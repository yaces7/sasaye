import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';


const firebaseConfig = {
  apiKey: "AIzaSyDOmzrwROxq8k0X_lN66Cnr46zd3X5qk38",
  authDomain: "sasaye-backend.firebaseapp.com",
  projectId: "sasaye-backend",
  storageBucket: "sasaye-backend.firebasestorage.app",
  messagingSenderId: "391912614161",
  appId: "1:391912614161:web:6f0cc8f6402974453704b0",
  measurementId: "G-808YK14KCD"
};


const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app; 