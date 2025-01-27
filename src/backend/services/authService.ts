import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export const register = async (name: string, email: string, password: string): Promise<void> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);

    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name,
      email,
      customId: Math.floor(100000000 + Math.random() * 900000000).toString(),
      avatar: '',
      bio: '',
      createdAt: new Date(),
      isEmailVerified: false
    });

    await setDoc(doc(db, 'userSettings', userCredential.user.uid), {
      emailNotifications: true,
      privateProfile: false,
      theme: 'light',
      language: 'tr'
    });
  } catch (error: any) {
    throw new Error('Kayıt işlemi başarısız: ' + error.message);
  }
}; 