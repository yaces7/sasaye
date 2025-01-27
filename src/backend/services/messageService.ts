import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  Timestamp,
  writeBatch,
  increment,
  limit,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { createNotification } from './notificationService';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Timestamp;
  isRead: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  lastMessage?: string;
  lastMessageTime?: Timestamp;
  unreadCounts: { [key: string]: number };
}

// Yeni sohbet oluştur
export const createChat = async (currentUserId: string, otherUserId: string): Promise<string> => {
  try {
    // Mevcut sohbeti kontrol et
    const existingChat = await findExistingChat(currentUserId, otherUserId);
    if (existingChat) {
      return existingChat.id;
    }

    // Her iki kullanıcının bilgilerini al
    const currentUserDoc = await getDoc(doc(db, 'users', currentUserId));
    const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));

    if (!currentUserDoc.exists() || !otherUserDoc.exists()) {
      throw new Error('Kullanıcı bulunamadı');
    }

    const currentUserData = currentUserDoc.data();
    const otherUserData = otherUserDoc.data();

    // Yeni sohbet oluştur
    const chatRef = await addDoc(collection(db, 'chats'), {
      participants: [currentUserId, otherUserId],
      participantNames: {
        [currentUserId]: otherUserData.name || 'İsimsiz Kullanıcı',
        [otherUserId]: currentUserData.name || 'İsimsiz Kullanıcı'
      },
      unreadCounts: {
        [currentUserId]: 0,
        [otherUserId]: 0
      },
      lastMessage: '',
      lastMessageTime: Timestamp.now(),
      createdAt: serverTimestamp()
    });

    return chatRef.id;
  } catch (error) {
    console.error('Sohbet oluşturma hatası:', error);
    throw error;
  }
};

// Mesaj gönder
export const sendMessage = async (chatId: string, senderId: string, receiverId: string, text: string): Promise<void> => {
  try {
    const messageRef = doc(collection(db, 'messages'));
    const message: Message = {
      id: messageRef.id,
      chatId,
      senderId,
      receiverId,
      text,
      timestamp: Timestamp.now(),
      isRead: false
    };

    const batch = writeBatch(db);
    
    // Mesajı kaydet
    batch.set(messageRef, message);
    
    // Sohbeti güncelle
    const chatRef = doc(db, 'chats', chatId);
    batch.update(chatRef, {
      lastMessage: text,
      lastMessageTime: Timestamp.now(),
      [`unreadCounts.${receiverId}`]: increment(1)
    });

    await batch.commit();

    // Bildirim oluştur
    await createNotification({
      userId: receiverId,
      type: 'message',
      title: 'Yeni Mesaj',
      message: text.length > 50 ? text.substring(0, 47) + '...' : text,
      data: { chatId }
    });
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    throw error;
  }
};

// Mesajları getir
export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Message);
  } catch (error) {
    console.error('Mesajları getirme hatası:', error);
    throw error;
  }
};

// Mesajları dinle
export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void): () => void => {
  const q = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }) as Message);
    callback(messages.reverse()); // En eski mesajlar önce gelsin
  }, (error) => {
    console.error('Mesaj dinleme hatası:', error);
  });
};

// Sohbetleri gerçek zamanlı dinle
export const subscribeToChats = (userId: string, callback: (chats: Chat[]) => void) => {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }) as Chat);
    callback(chats);
  }, (error) => {
    console.error('Sohbet dinleme hatası:', error);
  });
};

// Mesajları okundu olarak işaretle
export const markMessagesAsRead = async (chatId: string, userId: string): Promise<void> => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`unreadCounts.${userId}`]: 0
    });

    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      where('receiverId', '==', userId),
      where('isRead', '==', false)
    );

    const unreadMessages = await getDocs(q);
    const batch = writeBatch(db);
    
    unreadMessages.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();
  } catch (error) {
    console.error('Mesajları okundu işaretleme hatası:', error);
    throw error;
  }
};

// Mevcut sohbeti bul
const findExistingChat = async (userId: string, receiverId: string): Promise<Chat | null> => {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId)
  );

  const querySnapshot = await getDocs(q);
  const existingChat = querySnapshot.docs.find(doc => {
    const chat = doc.data() as Chat;
    return chat.participants.includes(receiverId);
  });

  return existingChat ? { ...existingChat.data(), id: existingChat.id } as Chat : null;
};

// Kullanıcı ara
export const getUserByName = async (searchTerm: string): Promise<any[]> => {
  try {
    const searchTermLower = searchTerm.toLowerCase();
    
    // Kullanıcı adı ile arama
    const usernameQuery = query(
      collection(db, 'users'),
      where('username', '>=', searchTermLower),
      where('username', '<=', searchTermLower + '\uf8ff'),
      limit(5)
    );

    // CustomId ile arama
    const customIdQuery = query(
      collection(db, 'users'),
      where('customId', '>=', searchTermLower),
      where('customId', '<=', searchTermLower + '\uf8ff'),
      limit(5)
    );

    const [usernameResults, customIdResults] = await Promise.all([
      getDocs(usernameQuery),
      getDocs(customIdQuery)
    ]);

    // Sonuçları birleştir ve tekrar edenleri kaldır
    const results = [...usernameResults.docs, ...customIdResults.docs]
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        matchType: doc.data().username.toLowerCase().includes(searchTermLower) ? 'username' : 'customId'
      }))
      .filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );

    return results;
  } catch (error) {
    console.error('Kullanıcı arama hatası:', error);
    return []; // Hata durumunda boş dizi dön
  }
};

// Sohbet detaylarını getir
export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const chatDoc = await getDoc(doc(db, 'chats', chatId));
    if (chatDoc.exists()) {
      return { id: chatDoc.id, ...chatDoc.data() } as Chat;
    }
    return null;
  } catch (error) {
    console.error('Sohbet getirme hatası:', error);
    throw error;
  }
}; 