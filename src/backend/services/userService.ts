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

export interface User {
  id: string;
  uid: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  customId: string;
  isEmailVerified: boolean;
  bio?: string;
  website?: string;
  phoneNumber?: string;
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

// Profil güncelleme
export const updateUserProfile = async (
  userId: string,
  data: {
    name?: string;
    bio?: string;
    website?: string;
    phoneNumber?: string;
    avatar?: string;
  }
): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), data);
    
    if (data.name) {
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        await updateProfile(firebaseUser, {
          displayName: data.name,
          photoURL: data.avatar || firebaseUser.photoURL
        });
      }
    }
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

// 9 haneli benzersiz ID oluştur
const generateCustomId = async (): Promise<string> => {
  while (true) {
    // 9 haneli rastgele sayı oluştur
    const id = Math.floor(100000000 + Math.random() * 900000000).toString();
    
    // Bu ID'nin daha önce kullanılıp kullanılmadığını kontrol et
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('customId', '==', id));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return id;
    }
  }
};

// Kullanıcı kaydı
export const createUser = async (name: string, email: string, password: string): Promise<User> => {
  try {
    // Firebase Auth ile kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user: firebaseUser } = userCredential;

    // Email doğrulama gönder
    await sendEmailVerification(firebaseUser);

    // Benzersiz ID oluştur
    const customId = await generateCustomId();

    // Kullanıcı verilerini hazırla
    const userData: User = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
      createdAt: new Date(),
      customId,
      isEmailVerified: false
    };

    // Firestore'a kullanıcı verilerini kaydet
    await setDoc(doc(db, 'users', firebaseUser.uid), userData);

    // Varsayılan ayarları oluştur
    await getUserSettings(firebaseUser.uid);

    return userData;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Giriş yap
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const { user: firebaseUser } = userCredential;

    // Kullanıcı verilerini Firestore'dan al
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    if (!userDoc.exists()) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Email doğrulama durumunu güncelle
    await updateDoc(doc(db, 'users', firebaseUser.uid), {
      isEmailVerified: firebaseUser.emailVerified
    });

    return {
      ...userDoc.data() as User,
      isEmailVerified: firebaseUser.emailVerified
    };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Email doğrulama durumunu kontrol et
export const checkEmailVerification = async (): Promise<boolean> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return false;

    // Firebase'den güncel kullanıcı bilgilerini al
    await firebaseUser.reload();
    
    // Firestore'daki doğrulama durumunu güncelle
    if (firebaseUser.emailVerified) {
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        isEmailVerified: true
      });
    }

    return firebaseUser.emailVerified;
  } catch (error: any) {
    console.error('Email doğrulama kontrolü hatası:', error);
    return false;
  }
};

// Doğrulama emailini tekrar gönder
export const resendVerificationEmail = async (): Promise<void> => {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Kullanıcı oturumu bulunamadı');
    
    await sendEmailVerification(firebaseUser);
  } catch (error: any) {
    throw new Error('Doğrulama emaili gönderilemedi: ' + error.message);
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

export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return null;
    }
    return userDoc.data() as User;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getUserByCustomId = async (customId: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('customId', '==', customId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    return querySnapshot.docs[0].data() as User;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const getUserByName = async (name: string): Promise<User | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('name', '==', name));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }

    return querySnapshot.docs[0].data() as User;
  } catch (error: any) {
    throw new Error(error.message);
  }
}; 