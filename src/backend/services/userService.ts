import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  customId: string;
  bio?: string;
  createdAt: Date;
  isEmailVerified: boolean;
}

export interface UserSettings {
  emailNotifications: boolean;
  privateProfile: boolean;
  theme: 'light' | 'dark';
  language: string;
}

// Kullanıcı ayarlarını getir
export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  try {
    const settingsDoc = await getDoc(doc(db, 'userSettings', userId));
    if (!settingsDoc.exists()) {
      // Varsayılan ayarlar
      const defaultSettings: UserSettings = {
        emailNotifications: true,
        privateProfile: false,
        theme: 'light',
        language: 'tr'
      };
      await setDoc(doc(db, 'userSettings', userId), defaultSettings);
      return defaultSettings;
    }
    return settingsDoc.data() as UserSettings;
  } catch (error: any) {
    throw new Error('Ayarlar alınamadı: ' + error.message);
  }
};

// Kullanıcı ayarlarını güncelle
export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'userSettings', userId), settings);
  } catch (error: any) {
    throw new Error('Ayarlar güncellenemedi: ' + error.message);
  }
};

// Kullanıcı oluştur
export const createUser = async (user: AppUser, userData: {
  username: string;
  customId: string;
}): Promise<void> => {
  try {
    // Kullanıcı dokümanı oluşturma işlemleri burada yapılacak
  } catch (error) {
    console.error('Kullanıcı oluşturma hatası:', error);
    throw error;
  }
};

// Kullanıcı getir
export const getUserById = async (userId: string): Promise<AppUser | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;

    return {
      id: userDoc.id,
      ...userDoc.data() as Omit<AppUser, 'id'>
    };
  } catch (error: any) {
    throw new Error('Kullanıcı bilgileri alınamadı: ' + error.message);
  }
};

// Custom ID ile kullanıcı getir
export const getUserByCustomId = async (customId: string): Promise<AppUser | null> => {
  try {
    const q = query(collection(db, 'users'), where('customId', '==', customId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    const userDoc = querySnapshot.docs[0];

    return {
      id: userDoc.id,
      ...userDoc.data() as Omit<AppUser, 'id'>
    };
  } catch (error: any) {
    throw new Error('Kullanıcı bilgileri alınamadı: ' + error.message);
  }
};

// İsim ile kullanıcı ara
export const getUserByName = async (name: string): Promise<AppUser | null> => {
  try {
    const q = query(collection(db, 'users'), where('name', '==', name));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    const userDoc = querySnapshot.docs[0];

    return {
      id: userDoc.id,
      ...userDoc.data() as Omit<AppUser, 'id'>
    };
  } catch (error: any) {
    throw new Error('Kullanıcı bilgileri alınamadı: ' + error.message);
  }
};

// Kullanıcı profilini güncelle
export const updateUserProfile = async (userId: string, data: Partial<AppUser>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), data);
  } catch (error: any) {
    throw new Error('Profil güncellenemedi: ' + error.message);
  }
};

// Email güncelleme
export const updateUserEmail = async (newEmail: string): Promise<void> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Kullanıcı oturumu bulunamadı');
    
    await updateEmail(firebaseUser, newEmail);
    await sendEmailVerification(firebaseUser);
    
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      email: newEmail,
      isEmailVerified: false
    });
  } catch (error: any) {
    throw new Error('Email güncellenemedi: ' + error.message);
  }
};

// Şifre güncelleme
export const updateUserPassword = async (newPassword: string): Promise<void> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Kullanıcı oturumu bulunamadı');
    
    await updatePassword(firebaseUser, newPassword);
  } catch (error: any) {
    throw new Error('Şifre güncellenemedi: ' + error.message);
  }
};

// Şifre sıfırlama emaili gönder
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error('Şifre sıfırlama emaili gönderilemedi: ' + error.message);
  }
};

// Benzersiz kullanıcı ID'si oluştur
const generateCustomId = (): string => {
  return Math.random().toString().slice(2, 11);
};

// Email doğrulama durumunu kontrol et
export const checkEmailVerification = async (): Promise<boolean> => {
  try {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      return auth.currentUser.emailVerified;
    }
    return false;
  } catch (error) {
    console.error('Email doğrulama kontrolü hatası:', error);
    return false;
  }
};

// Doğrulama emailini tekrar gönder
export const resendVerificationEmail = async (): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await sendEmailVerification(currentUser);
    } else {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }
  } catch (error) {
    console.error('Doğrulama emaili gönderme hatası:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
  } catch (error: any) {
    throw new Error(error.message);
  }
}; 