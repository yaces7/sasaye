import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, limit, startAt, endAt, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dxsl9h1kw';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

export interface Video {
  id: string;
  userId: string;
  userName: string;
  videoUrl: string;
  description: string;
  likes: number;
  comments: number;
  isReel: boolean;
  createdAt: Timestamp;
  title?: string;
  views?: number;
}

export const uploadVideo = async (file: File, description: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('resource_type', 'video');
    formData.append('folder', 'reels');

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Video yükleme başarısız');
    }

    const uploadResult = await response.json();

    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error('Kullanıcı oturum açmamış');
    }

    const videoData: Omit<Video, 'id'> = {
      userId: user.uid,
      userName: user.displayName || 'Anonim',
      videoUrl: uploadResult.secure_url,
      description,
      likes: 0,
      comments: 0,
      isReel: true,
      createdAt: Timestamp.now(),
      title: description,
      views: 0
    };

    const docRef = await addDoc(collection(db, 'videos'), videoData);
    return docRef.id;
  } catch (error) {
    console.error('Video yükleme hatası:', error);
    throw error;
  }
};

export const getAllVideos = async (): Promise<Video[]> => {
  try {
    const videosRef = collection(db, 'videos');
    const q = query(videosRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Video));
  } catch (error) {
    console.error('Videoları getirme hatası:', error);
    throw error;
  }
};

export const searchVideos = async (searchQuery: string): Promise<Video[]> => {
  try {
    const videosRef = collection(db, 'videos');
    const q = query(
      videosRef,
      orderBy('title'),
      startAt(searchQuery),
      endAt(searchQuery + '\uf8ff'),
      limit(20)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Video));
  } catch (error) {
    console.error('Video arama hatası:', error);
    return [];
  }
};

export const getVideoById = async (videoId: string): Promise<Video | null> => {
  try {
    const videoRef = doc(db, 'videos', videoId);
    const videoDoc = await getDoc(videoRef);
    
    if (!videoDoc.exists()) {
      return null;
    }

    // Görüntülenme sayısını artır
    const videoData = videoDoc.data() as Omit<Video, 'id'>;
    const newViews = (videoData.views || 0) + 1;
    
    await updateDoc(videoRef, {
      views: newViews
    });

    return {
      id: videoDoc.id,
      ...videoData,
      views: newViews
    };
  } catch (error) {
    console.error('Video getirme hatası:', error);
    return null;
  }
};