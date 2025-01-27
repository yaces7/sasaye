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
  increment
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

    // Yeni sohbet oluştur
    const chatRef = doc(collection(db, 'chats'));
    const newChat: Chat = {
      id: chatRef.id,
      participants: [userId, receiverId],
      unreadCount: {
        [userId]: 0,
        [receiverId]: 0
      }
    };

    await setDoc(chatRef, newChat);

    // Her iki kullanıcının sohbet listesini güncelle
    await updateUserChats(userId, chatRef.id);
    await updateUserChats(receiverId, chatRef.id);

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

    // Mesajı kaydet
    await setDoc(messageRef, message);

    // Sohbeti güncelle
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: text,
      lastMessageTime: serverTimestamp(),
      [`unreadCount.${receiverId}`]: increment(1)
    });

    // Bildirim gönder
    await createNotification({
      userId: receiverId,
      type: 'message',
      title: 'Yeni Mesaj',
      message: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
      link: `/messages/${chatId}`,
      data: {
        senderId
      }
    });
  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    throw error;
  }
};

// Mesajları gerçek zamanlı dinle
export const subscribeToMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  const q = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        timestamp: data.timestamp
      } as Message;
    });
    callback(messages);
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

// Kullanıcının sohbet listesini güncelle
const updateUserChats = async (userId: string, chatId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    chats: arrayUnion(chatId)
  });
}; 