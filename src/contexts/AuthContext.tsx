import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../backend/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthUser {
  uid: string;
  email: string;
  username: string;
  customId: string;
  avatar?: string;
  bio?: string;
  isEmailVerified: boolean;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // LocalStorage'dan kullanıcı bilgilerini kontrol et
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const authUser: AuthUser = {
              uid: user.uid,
              email: user.email || '',
              username: userData.username,
              customId: userData.customId,
              avatar: userData.avatar,
              bio: userData.bio,
              isEmailVerified: user.emailVerified
            };
            setCurrentUser(authUser);
            localStorage.setItem('user', JSON.stringify(authUser));
            localStorage.setItem('isLoggedIn', 'true');
          }
        } catch (error) {
          console.error('Kullanıcı bilgileri alınamadı:', error);
        }
      } else {
        setCurrentUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

// Yetkilendirme gerektiren route'lar için HOC
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  return (props: P) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
      return null; // veya loading spinner
    }

    if (!currentUser) {
      // Login sayfasına yönlendir
      window.location.href = '/login';
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}; 