"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onIdTokenChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import axios from 'axios';

// Extended user profile data from backend
interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  firebase_uid: string;
  bib_number: string;
  age_category?: string;
  contact_number?: string;
  city?: string;
  state?: string;
  country?: string;
}

interface CustomUser extends User {
  customClaims?: {
    admin?: boolean;
  };
  profile?: UserProfile;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user profile from backend
  const fetchUserProfile = async (firebaseUser: User) => {
    try {
      const token = await firebaseUser.getIdToken();
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/users/me`;
      console.log("Fetching user profile from:", apiUrl);
      
      const response = await axios.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log("User profile data:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      if (axios.isAxiosError(error)) {
        console.error("API Error details:", {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
      }
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get the ID token and decode it to access custom claims
        const token = await firebaseUser.getIdTokenResult();
        
        // Fetch user profile from backend
        const profile = await fetchUserProfile(firebaseUser);
        
        const customUser: CustomUser = {
          ...firebaseUser,
          customClaims: {
            admin: token.claims.admin as boolean,
          },
          profile: profile
        };
        setUser(customUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Keep this function for internal use only
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in with email:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 