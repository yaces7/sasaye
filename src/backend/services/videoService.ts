import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { uploadFile, deleteFile, validateFileSize, validateFileType } from './uploadService';

export interface Video {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  cloudinaryPublicId: string;
  createdAt: Date;
  likes: number;
  views: number;
  isReel: boolean;
  duration?: number;
}

export interface VideoUploadData {
  title: string;
  description: string;
  videoFile: File;
  thumbnailFile?: File;
  isReel?: boolean;
}

// Video yükleme
export const uploadVideo = async (userId: string, data: VideoUploadData): Promise<Video> => {
  try {
    // Video dosya kontrolü
    if (!validateFileSize(data.videoFile, 100)) { // 100MB limit
      throw new Error('Video boyutu çok büyük! Maximum 100MB olabilir.');
    }

    if (!validateFileType(data.videoFile, ['video/mp4', 'video/quicktime'])) {
      throw new Error('Geçersiz video formatı! Sadece MP4 ve MOV dosyaları kabul edilir.');
    }

    // Video'yu Cloudinary'ye yükle
    const videoUpload = await uploadFile(data.videoFile);
    let thumbnailUrl = undefined;

    // Eğer thumbnail varsa onu da yükle
    if (data.thumbnailFile) {
      if (!validateFileType(data.thumbnailFile, ['image/jpeg', 'image/png'])) {
        throw new Error('Geçersiz thumbnail formatı! Sadece JPG ve PNG dosyaları kabul edilir.');
      }
      const thumbnailUpload = await uploadFile(data.thumbnailFile);
      thumbnailUrl = thumbnailUpload.url;
    }

    // Video bilgilerini Firestore'a kaydet
    const videoData: Omit<Video, 'id'> = {
      userId,
      userName: '',
      title: data.title,
      description: data.description,
      videoUrl: videoUpload.url,
      thumbnailUrl,
      cloudinaryPublicId: videoUpload.publicId,
      createdAt: new Date(),
      likes: 0,
      views: 0,
      isReel: data.isReel || false
    };

    const docRef = await addDoc(collection(db, 'videos'), videoData);
    
    return {
      id: docRef.id,
      ...videoData
    };
  } catch (error: any) {
    throw new Error('Video yükleme hatası: ' + error.message);
  }
};

// Video silme
export const deleteVideo = async (videoId: string, userId: string): Promise<void> => {
  try {
    // Video dokümanını al
    const videoDoc = await getDoc(doc(db, 'videos', videoId));
    if (!videoDoc.exists()) {
      throw new Error('Video bulunamadı');
    }

    const videoData = videoDoc.data() as Video;
    
    // Kullanıcı kontrolü
    if (videoData.userId !== userId) {
      throw new Error('Bu videoyu silme yetkiniz yok');
    }

    // Cloudinary'den videoyu sil
    await deleteFile(videoData.cloudinaryPublicId);
    
    // Firestore'dan video bilgilerini sil
    await deleteDoc(doc(db, 'videos', videoId));
  } catch (error: any) {
    throw new Error('Video silme hatası: ' + error.message);
  }
};

// Tüm videoları getir
export const getAllVideos = async (isReel: boolean = false): Promise<Video[]> => {
  try {
    const q = query(
      collection(db, 'videos'),
      where('isReel', '==', isReel),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Video, 'id'>
    }));
  } catch (error: any) {
    throw new Error('Videoları getirme hatası: ' + error.message);
  }
};

// Belirli bir videoyu getir
export const getVideoById = async (videoId: string): Promise<Video | null> => {
  try {
    const videoDoc = await getDoc(doc(db, 'videos', videoId));
    if (!videoDoc.exists()) {
      return null;
    }

    // Görüntülenme sayısını artır
    const videoData = videoDoc.data() as Omit<Video, 'id'>;
    await updateVideoViews(videoId, videoData.views + 1);

    return {
      id: videoDoc.id,
      ...videoData
    };
  } catch (error: any) {
    throw new Error('Video getirme hatası: ' + error.message);
  }
};

// Kullanıcının videolarını getir
export const getUserVideos = async (userId: string, isReel: boolean = false): Promise<Video[]> => {
  try {
    const q = query(
      collection(db, 'videos'),
      where('userId', '==', userId),
      where('isReel', '==', isReel),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data() as Omit<Video, 'id'>
    }));
  } catch (error: any) {
    throw new Error('Kullanıcı videolarını getirme hatası: ' + error.message);
  }
};

// Video görüntülenme sayısını güncelle
const updateVideoViews = async (videoId: string, newViewCount: number): Promise<void> => {
  try {
    const videoRef = doc(db, 'videos', videoId);
    await updateDoc(videoRef, {
      views: newViewCount
    });
  } catch (error: any) {
    console.error('Görüntülenme sayısı güncelleme hatası:', error);
  }
};

// Video arama
export const searchVideos = async (query: string): Promise<Video[]> => {
  try {
    const q = query.toLowerCase();
    const querySnapshot = await getDocs(collection(db, 'videos'));
    
    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data() as Omit<Video, 'id'>
      }))
      .filter(video => 
        video.title.toLowerCase().includes(q) || 
        video.description.toLowerCase().includes(q)
      );
  } catch (error: any) {
    throw new Error('Video arama hatası: ' + error.message);
  }
}; 