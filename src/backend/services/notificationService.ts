import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Notification {
  id: string;
  userId: string;
  type: 'group_invite' | 'group_join' | 'message' | 'like' | 'comment';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: any;
  data?: {
    groupId?: string;
    senderId?: string;
    postId?: string;
  };
}

// Bildirim oluştur
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
  try {
    const notificationData = {
      ...notification,
      isRead: false,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'notifications'), notificationData);
  } catch (error) {
    console.error('Bildirim oluşturma hatası:', error);
    throw error;
  }
};

// Bildirimleri getir
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
  } catch (error) {
    console.error('Bildirimler alınamadı:', error);
    throw error;
  }
};

// Bildirimi okundu olarak işaretle
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });
  } catch (error) {
    console.error('Bildirim güncelleme hatası:', error);
    throw error;
  }
}; 