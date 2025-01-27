import { collection, query, where, getDocs, addDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export const getUserChats = async (userId: string): Promise<string[]> => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.id);
};

export const subscribeToMessages = (
  currentUserId: string,
  otherUserId: string,
  callback: (messages: Message[]) => void
) => {
  const chatId = [currentUserId, otherUserId].sort().join('_');
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Message[];
    callback(messages);
  });
};

export const sendMessage = async (
  receiverId: string,
  senderId: string,
  text: string
): Promise<void> => {
  const chatId = [senderId, receiverId].sort().join('_');
  const messagesRef = collection(db, 'chats', chatId, 'messages');

  await addDoc(messagesRef, {
    senderId,
    text,
    timestamp: new Date()
  });
}; 