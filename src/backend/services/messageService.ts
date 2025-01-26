import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  read: boolean;
}

// İki kullanıcı arasındaki sohbet ID'sini oluştur
const getChatId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

// Yeni mesaj gönder
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string
): Promise<Message> => {
  try {
    const chatId = getChatId(senderId, receiverId);
    const messageData = {
      senderId,
      receiverId,
      content,
      createdAt: Timestamp.now(),
      read: false,
      chatId,
    };

    const docRef = await addDoc(collection(db, 'messages'), messageData);
    return {
      id: docRef.id,
      ...messageData,
      createdAt: messageData.createdAt.toDate(),
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Mesajları dinle
export const subscribeToMessages = (
  userId1: string,
  userId2: string,
  callback: (messages: Message[]) => void
) => {
  const chatId = getChatId(userId1, userId2);
  const q = query(
    collection(db, 'messages'),
    where('chatId', '==', chatId),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    })) as Message[];
    callback(messages);
  });
};

// Kullanıcının tüm sohbetlerini getir
export const getUserChats = async (userId: string): Promise<string[]> => {
  try {
    const sentMessagesQuery = query(
      collection(db, 'messages'),
      where('senderId', '==', userId)
    );
    const receivedMessagesQuery = query(
      collection(db, 'messages'),
      where('receiverId', '==', userId)
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentMessagesQuery),
      getDocs(receivedMessagesQuery),
    ]);

    const chatIds = new Set<string>();
    
    sentSnapshot.docs.forEach((doc) => {
      chatIds.add(doc.data().chatId);
    });
    
    receivedSnapshot.docs.forEach((doc) => {
      chatIds.add(doc.data().chatId);
    });

    return Array.from(chatIds);
  } catch (error: any) {
    throw new Error(error.message);
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