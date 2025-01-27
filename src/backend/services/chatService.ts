import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  orderBy, 
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  isRead: boolean;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
    senderId: string;
  };
  createdAt: Timestamp;
}

// Sohbet oluştur veya var olan sohbeti getir
export const createOrGetChat = async (
  currentUserId: string,
  otherUserId: string
): Promise<string> => {
  const chatId = [currentUserId, otherUserId].sort().join('_');
  const chatRef = doc(db, 'chats', chatId);
  
  const chatDoc = await getDoc(chatRef);
  
  if (!chatDoc.exists()) {
    // Yeni sohbet oluştur
    await setDoc(chatRef, {
      participants: [currentUserId, otherUserId],
      createdAt: serverTimestamp(),
    });
  }
  
  return chatId;
};

// Kullanıcının tüm sohbetlerini getir
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  const chatsRef = collection(db, 'chats');
  const q = query(
    chatsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessage.timestamp', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Chat));
};

// Mesajları dinle
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

// Mesaj gönder
export const sendMessage = async (
  receiverId: string,
  senderId: string,
  text: string
): Promise<void> => {
  const chatId = [senderId, receiverId].sort().join('_');
  
  // Önce sohbetin varlığından emin ol
  await createOrGetChat(senderId, receiverId);
  
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const timestamp = serverTimestamp();

  // Mesajı ekle
  await addDoc(messagesRef, {
    senderId,
    text,
    timestamp,
    isRead: false
  });

  // Son mesaj bilgisini güncelle
  const chatRef = doc(db, 'chats', chatId);
  await setDoc(chatRef, {
    lastMessage: {
      text,
      timestamp,
      senderId
    }
  }, { merge: true });
};

// Mesajları okundu olarak işaretle
export const markMessagesAsRead = async (
  chatId: string,
  currentUserId: string
) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(
    messagesRef,
    where('senderId', '!=', currentUserId),
    where('isRead', '==', false)
  );

  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);

  querySnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { isRead: true });
  });

  await batch.commit();
};

// Belirli bir sohbetin mesajlarını getir
export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Message));
}; 