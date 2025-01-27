import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import axios from 'axios';

// Cloudinary yapılandırması
const CLOUDINARY_UPLOAD_PRESET = 'b65889d0-f518-473e-a533-7c9ae8445b14'; // Cloudinary'den alacağınız preset
const CLOUDINARY_CLOUD_NAME = 'dxsl9h1kw'; // Cloudinary cloud name
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}`;

// Desteklenen dosya tipleri
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_VIDEO_DURATION = 60; // saniye cinsinden maksimum video süresi

// Dosya boyutu kontrolleri
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

interface UploadResult {
  url: string;
  path: string;
  publicId: string;
}

// Video süresini kontrol et
const checkVideoDuration = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration <= MAX_VIDEO_DURATION);
    };

    video.src = URL.createObjectURL(file);
  });
};

// Resim yükleme
export const uploadImage = async (file: File): Promise<UploadResult> => {
  // Dosya tipi kontrolü
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Desteklenmeyen dosya tipi. Lütfen JPEG, PNG veya GIF formatında bir resim yükleyin.');
  }

  // Dosya boyutu kontrolü
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error('Dosya boyutu çok büyük. Maksimum 5MB yükleyebilirsiniz.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('resource_type', 'image');

  try {
    const response = await axios.post(`${CLOUDINARY_API_URL}/image/upload`, formData);
    return {
      url: response.data.secure_url,
      path: response.data.public_id,
      publicId: response.data.public_id
    };
  } catch (error: any) {
    throw new Error('Resim yükleme hatası: ' + error.message);
  }
};

// Video yükleme
export const uploadVideo = async (file: File): Promise<UploadResult> => {
  // Dosya tipi kontrolü
  if (!SUPPORTED_VIDEO_TYPES.includes(file.type)) {
    throw new Error('Desteklenmeyen dosya tipi. Lütfen MP4 formatında bir video yükleyin.');
  }

  // Dosya boyutu kontrolü
  if (file.size > MAX_VIDEO_SIZE) {
    throw new Error('Dosya boyutu çok büyük. Maksimum 100MB yükleyebilirsiniz.');
  }

  // Video süresi kontrolü
  const isValidDuration = await checkVideoDuration(file);
  if (!isValidDuration) {
    throw new Error('Video süresi çok uzun. Maksimum 60 saniye olabilir.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('resource_type', 'video');

  try {
    const response = await axios.post(`${CLOUDINARY_API_URL}/video/upload`, formData);
    return {
      url: response.data.secure_url,
      path: response.data.public_id,
      publicId: response.data.public_id
    };
  } catch (error: any) {
    throw new Error('Video yükleme hatası: ' + error.message);
  }
};

// Dosya silme
export const deleteFile = async (publicId: string, resourceType: 'image' | 'video'): Promise<void> => {
  try {
    const response = await axios.post(`${CLOUDINARY_API_URL}/${resourceType}/destroy`, {
      public_id: publicId,
      upload_preset: CLOUDINARY_UPLOAD_PRESET
    });

    if (response.data.result !== 'ok') {
      throw new Error('Dosya silme başarısız');
    }
  } catch (error: any) {
    throw new Error('Dosya silme hatası: ' + error.message);
  }
};

// Dosya boyutu kontrolü
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

// Dosya tipi kontrolü
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

// Resim boyutlandırma ve optimizasyon URL'i oluşturma
export const getOptimizedImageUrl = (
  url: string,
  width: number = 800,
  quality: number = 80
): string => {
  if (!url.includes('cloudinary')) return url;
  
  // URL'i parçalara ayır
  const parts = url.split('/upload/');
  
  // Optimizasyon parametrelerini ekle
  return `${parts[0]}/upload/w_${width},q_${quality}/${parts[1]}`;
};

// Video optimizasyonu için URL oluşturma
export const getOptimizedVideoUrl = (
  url: string,
  quality: 'low' | 'medium' | 'high' = 'medium'
): string => {
  if (!url.includes('cloudinary')) return url;

  const qualityMap = {
    low: 'q_auto:low',
    medium: 'q_auto:good',
    high: 'q_auto:best'
  };

  const parts = url.split('/upload/');
  return `${parts[0]}/upload/${qualityMap[quality]}/${parts[1]}`;
};

export const uploadFile = async (file: File, folder: string): Promise<UploadResult> => {
  try {
    // Dosya adını benzersiz yap
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const path = `${folder}/${fileName}`;
    
    // Storage referansı oluştur
    const storageRef = ref(storage, path);
    
    // Dosyayı yükle
    await uploadBytes(storageRef, file);
    
    // Download URL'ini al
    const url = await getDownloadURL(storageRef);
    
    return { url, path, publicId: '' };
  } catch (error: any) {
    throw new Error('Dosya yükleme hatası: ' + error.message);
  }
}; 