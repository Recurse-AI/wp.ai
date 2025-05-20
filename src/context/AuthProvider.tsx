"use client";

import React, { createContext, useContext, useMemo } from 'react';
import useAuth, { UserProfile } from '@/lib/useAuth';

// Define the context with all the values from useAuth
interface AuthContextProps {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  setUserData: (userData: UserProfile) => void;
  login: (credentials: any) => Promise<UserProfile | null>;  
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  verifyEmail: (uidb64: string, token: string) => Promise<any>;
  socialAuth: {
    google: (code: string) => Promise<UserProfile | null>;
    facebook: (accessToken: string) => Promise<UserProfile | null>;
    github: (code: string) => Promise<UserProfile | null>;
    wordpress: (code: string) => Promise<UserProfile | null>;
  };
  updateProfile: (profileData: Partial<UserProfile>) => Promise<UserProfile>;
  changePassword: (oldPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  passwordReset: {
    request: (email: string) => Promise<any>;
    confirm: (uid: string, token: string, newPassword: string, confirmPassword: string) => Promise<any>;
  };
  emailVerification: {
    request: () => Promise<any>;
    confirm: (uidb64: string, token: string) => Promise<any>;
  };
  phoneVerification: {
    request: (phoneNumber: string) => Promise<any>;
    confirm: (phoneNumber: string, verificationCode: string) => Promise<any>;
  };
  sessions: {
    list: () => Promise<any>;
    terminate: (sessionId: number) => Promise<any>;
  };
}

// Create context with default values
const AuthContext = createContext<AuthContextProps | null>(null);

// Custom hook to use the auth context
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // Use the useAuth hook directly
  const auth = useAuth();

  // Memoize the auth value to prevent unnecessary rerenders
  const memoizedAuth = useMemo(() => auth, [auth]);

  
  return (
    <AuthContext.Provider value={memoizedAuth}>
      {children}
    </AuthContext.Provider>
  );
} 