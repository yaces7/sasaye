import axios from 'axios';

const CLOUDINARY_UPLOAD_PRESET = 'b65889d0-f518-473e-a533-7c9ae8445b14'; // Cloudinary'den alacağınız değer
const CLOUDINARY_CLOUD_NAME = 'dxsl9h1kw'; // Cloudinary'den alacağınız değer
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

export interface UploadResponse {
  url: string;
  publicId: string;
}

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await axios.post(UPLOAD_URL, formData);

    return {
      url: response.data.secure_url,
      publicId: response.data.public_id
    };
  } catch (error: any) {
    throw new Error('Dosya yükleme hatası: ' + error.message);
  }
};

export const deleteFile = async (publicId: string): Promise<void> => {
  // Cloudinary'nin Admin API'sini kullanarak dosyayı silme
  // Not: Bu işlem için backend servisi gerekebilir
  try {
    const response = await axios.post(`/api/deleteFile`, { publicId });
    if (!response.data.success) {
      throw new Error('Dosya silme hatası');
    }
  } catch (error: any) {
    throw new Error('Dosya silme hatası: ' + error.message);
  }
};

// Dosya boyutu kontrolü
export const validateFileSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSize = maxSizeMB * 1024 * 1024; // MB to bytes
  return file.size <= maxSize;
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