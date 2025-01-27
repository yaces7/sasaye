import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  Timestamp,
  writeBatch,
  increment,
  limit
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
  unreadCount: { [key: string]: number };
}

// Yeni sohbet oluştur
export const createChat = async (userId: string, receiverId: string): Promise<string> => {
  try {
    // Mevcut sohbeti kontrol et
    const existingChat = await findExistingChat(userId, receiverId);
    if (existingChat) {
      return existingChat.id;
    }

    // Kullanıcı bilgilerini al
    const [senderDoc, receiverDoc] = await Promise.all([
      getDoc(doc(db, 'users', userId)),
      getDoc(doc(db, 'users', receiverId))
    ]);

    if (!senderDoc.exists() || !receiverDoc.exists()) {
      throw new Error('Kullanıcı bulunamadı');
    }

    const sender = senderDoc.data();
    const receiver = receiverDoc.data();

    // Yeni sohbet oluştur
    const chatRef = doc(collection(db, 'chats'));
    const newChat: Chat = {
      id: chatRef.id,
      participants: [userId, receiverId],
      participantNames: {
        [userId]: sender.username || sender.displayName,
        [receiverId]: receiver.username || receiver.displayName
      },
      lastMessage: '',
      lastMessageTime: Timestamp.now(),
      unreadCount: {
        [userId]: 0,
        [receiverId]: 0
      }
    };

    // Önce sohbeti oluştur
    await setDoc(chatRef, newChat);

    // Sonra kullanıcıların sohbet listelerini güncelle
    const batch = writeBatch(db);
    
    // Gönderen kullanıcı için
    batch.set(doc(db, 'users', userId), {
      chats: arrayUnion(chatRef.id)
    }, { merge: true });
    
    // Alıcı kullanıcı için
    batch.set(doc(db, 'users', receiverId), {
      chats: arrayUnion(chatRef.id)
    }, { merge: true });

    await batch.commit();

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
      [`unreadCount.${receiverId}`]: increment(1)
    });

    await batch.commit();

    // Bildirim oluştur
    await createNotification({
      userId: receiverId,
      type: 'message',
      title: 'Yeni Mesaj',
      body: text.length > 50 ? text.substring(0, 47) + '...' : text,
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
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Message);
    callback(messages);
  }, (error) => {
    console.error('Mesaj dinleme hatası:', error);
  });
};

// Sohbetleri gerçek zamanlı dinle
export const subscribeToChats = (userId: string, callback: (chats: Chat[]) => void) => {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    }) as Chat);
    callback(chats);
  });
};

// Mesajları okundu olarak işaretle
export const markMessagesAsRead = async (chatId: string, userId: string): Promise<void> => {
  try {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      [`unreadCount.${userId}`]: 0
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