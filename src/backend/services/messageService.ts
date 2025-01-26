import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  timestamp: Date;
}

// Mesaj gönderme
export const sendMessage = async (chatId: string, senderId: string, content: string): Promise<void> => {
  try {
    await addDoc(collection(db, 'messages'), {
      chatId,
      senderId,
      content,
      timestamp: new Date()
    });
  } catch (error: any) {
    throw new Error('Mesaj gönderilemedi: ' + error.message);
  }
};

// Mesajları getir
export const getMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Message, 'id'>
    }));
  } catch (error: any) {
    throw new Error('Mesajlar alınamadı: ' + error.message);
  }
};

// Mesajları dinle
export const subscribeToMessages = (
  userId1: string,
  userId2: string,
  callback: (messages: Message[]) => void
): (() => void) => {
  const chatId = [userId1, userId2].sort().join('_');
  const q = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Message, 'id'>
    }));
    callback(messages);
  });
};

// Kullanıcının sohbetlerini getir
export const getUserChats = async (userId: string): Promise<string[]> => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(q);
    return [...new Set(querySnapshot.docs.map(doc => doc.data().chatId))];
  } catch (error: any) {
    throw new Error('Sohbetler alınamadı: ' + error.message);
  }
};

// Okunmamış mesaj sayısını getir
export const getUnreadMessageCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('receiverId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error: any) {
    throw new Error(error.message);
  }
}; 