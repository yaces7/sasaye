import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  signInWithEmailAndPassword
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

    await setDoc(doc(db, 'userSettings', user.uid), {
      emailNotifications: true,
      privateProfile: false,
      theme: 'light',
      language: 'tr'
    });

    throw new Error('Lütfen email adresinizi doğrulayın. Doğrulama linki gönderildi.');
  } catch (error: any) {
    throw error;
  }
}; 