import { v2 as cloudinary } from 'cloudinary';
import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
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

        // Firestore'a video bilgilerini kaydet
        const videoData: Omit<Video, 'id'> = {
          userId: user.uid,
          userName: user.displayName || 'Anonim',
          videoUrl: uploadResult.secure_url,
          description,
          likes: 0,
          comments: 0,
          isReel: true,
          createdAt: Timestamp.now()
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