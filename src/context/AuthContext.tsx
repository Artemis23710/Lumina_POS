import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type UserRole = 'admin' | 'cashier';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  role: UserRole;
  isDemo?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string, isDemoLogin?: boolean, demoRole?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ADMIN: UserProfile = {
  uid: 'demo-admin-uid',
  email: 'admin@lumina.com',
  displayName: 'Lumina Manager',
  role: 'admin',
  isDemo: true
};

const DEMO_CASHIER: UserProfile = {
  uid: 'demo-cashier-uid',
  email: 'cashier@lumina.com',
  displayName: 'Cashier John',
  role: 'cashier',
  isDemo: true
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there is a saved demo user session in localStorage first
    const savedDemoUser = localStorage.getItem('lumina_demo_user');
    if (savedDemoUser) {
      setUser(JSON.parse(savedDemoUser));
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Check Firestore user doc for role
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: data.displayName || fbUser.displayName || 'Staff Member',
              role: data.role || 'cashier',
            });
          } else {
            // Default new Firebase registrations to cashier
            const defaultProfile = {
              displayName: fbUser.displayName || 'Staff Member',
              role: 'cashier' as UserRole,
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, defaultProfile);
            setUser({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: defaultProfile.displayName,
              role: defaultProfile.role,
            });
          }
        } catch (error) {
          console.error('Error fetching user profile from Firestore:', error);
          // Fallback to basic profile
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || 'Staff Member',
            role: 'cashier',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, isDemoLogin = false, demoRole: UserRole = 'cashier') => {
    setLoading(true);
    try {
      if (isDemoLogin) {
        const demoUser = demoRole === 'admin' ? DEMO_ADMIN : DEMO_CASHIER;
        localStorage.setItem('lumina_demo_user', JSON.stringify(demoUser));
        setUser(demoUser);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (user?.isDemo) {
        localStorage.removeItem('lumina_demo_user');
        setUser(null);
        return;
      }
      await fbSignOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
