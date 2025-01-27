import { v2 as cloudinary } from 'cloudinary';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, Timestamp, limit, startAt, endAt, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Cloudinary yapılandırması
cloudinary.config({
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
  api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET
});

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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        
        const uploadResult = await cloudinary.uploader.upload(base64Data, {
          resource_type: 'video',
          folder: 'reels',
          transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        });

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
        resolve(docRef.id);
      } catch (error) {
        console.error('Video yükleme hatası:', error);
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };
  });
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