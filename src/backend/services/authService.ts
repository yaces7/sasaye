import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendEmailVerification,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { generateCustomId } from './userService';

// Giriş yap
export const login = async (email: string, password: string): Promise<void> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Email doğrulaması kontrolü
    if (!user.emailVerified) {
      await signOut(auth); // Doğrulanmamış kullanıcıyı çıkış yaptır
      throw new Error('Lütfen email adresinizi doğrulayın. Doğrulama emaili gönderildi.');
    }

    // Kullanıcı dokümanını kontrol et
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
      throw new Error('Kullanıcı bilgileri bulunamadı.');
    }

    // Son giriş zamanını güncelle
    await setDoc(doc(db, 'users', user.uid), {
      lastLogin: new Date(),
      lastAction: new Date()
    }, { merge: true });

  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('Kullanıcı bulunamadı.');
    } else if (error.code === 'auth/wrong-password') {
      throw new Error('Hatalı şifre.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.');
    }
    throw error;
  }
};

// Kayıt ol
export const register = async (name: string, email: string, password: string): Promise<void> => {
  try {
    // Kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Email doğrulama gönder
    await sendEmailVerification(user);

    // Benzersiz ID oluştur
    const customId = await generateCustomId();

    // Kullanıcı dokümanı oluştur
    await setDoc(doc(db, 'users', user.uid), {
      name,
      email,
      username: name.toLowerCase().replace(/\s+/g, ''),
      customId,
      avatar: '',
      bio: '',
      interests: [],
      isEmailVerified: false,
      createdAt: new Date(),
      lastAction: new Date()
    });

    // Kullanıcı ayarlarını oluştur
    await setDoc(doc(db, 'userSettings', user.uid), {
      emailNotifications: true,
      privateProfile: false,
      theme: 'light',
      language: 'tr'
    });

    // Kullanıcıyı çıkış yaptır (email doğrulaması için)
    await signOut(auth);
    
    throw new Error('Lütfen email adresinizi doğrulayın. Doğrulama linki gönderildi.');
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Bu email adresi zaten kullanımda.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Geçersiz email adresi.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Email/şifre girişi devre dışı bırakılmış.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Şifre çok zayıf. En az 6 karakter kullanın.');
    }
    throw error;
  }
};

// Email doğrulama durumunu kontrol et
export const checkEmailVerification = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // Dinlemeyi durdur
      
      if (user && user.emailVerified) {
        // Email doğrulandıysa kullanıcı dokümanını güncelle
        await setDoc(doc(db, 'users', user.uid), {
          isEmailVerified: true,
          lastAction: new Date()
        }, { merge: true });
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
};

// Çıkış yap
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Çıkış yapma hatası:', error);
    throw error;
  }
}; 