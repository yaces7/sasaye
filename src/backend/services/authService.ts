import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { generateCustomId } from './userService';

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
      createdAt: new Date()
    });

    // Kullanıcı ayarlarını oluştur
    await setDoc(doc(db, 'userSettings', user.uid), {
      emailNotifications: true,
      privateProfile: false,
      theme: 'light',
      language: 'tr'
    });

    // Email doğrulama gerektiğini belirten hata fırlat
    throw new Error('Lütfen email adresinizi doğrulayın. Doğrulama linki gönderildi.');
  } catch (error: any) {
    // Firebase hata mesajlarını Türkçeleştir
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