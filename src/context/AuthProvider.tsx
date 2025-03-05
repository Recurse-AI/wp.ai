"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuth from '@/lib/useAuth';
import { UserProfile } from '@/lib/authService';

interface AuthContextProps {
  isLoggedIn: boolean;
  user: {
    name: string;
    image: string;
    email?: string;
    id?: number;
    username?: string;
  };
  checkAuthStatus: () => Promise<boolean>;
  setUserData: (userData: any) => void;
}

const AuthContext = createContext<AuthContextProps>({
  isLoggedIn: false,
  user: { name: '', image: '' },
  checkAuthStatus: async () => false,
  setUserData: () => {},
});

export const useAuthContext = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({
    name: '',
    image: '',
    email: '',
    id: 0,
    username: '',
  });
  
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user: authUser } = useAuth();

  const checkAuthStatus = async () => {
    return true;
  };

  // Set user data manually (useful after login)
  const setUserData = (userData: any) => {
    if (userData) {
      setIsLoggedIn(true);
      setUser({
        name: userData.name || userData.user?.full_name || '',
        image: userData.image || userData.profile_pic || '',
        email: userData.email || userData.user?.email || '',
        id: userData.id || userData.user?.id || 0,
        username: userData.username || userData.user?.username || '',
      });
    }
  };

  // Sync with useAuth hook when authUser changes
  useEffect(() => {
    if (authUser) {
      setIsLoggedIn(true);
      setUser({
        name: `${authUser.first_name} ${authUser.last_name}`.trim() || authUser.username,
        image: authUser.profile_picture || user.image,
        email: authUser.email,
        id: authUser.id,
        username: authUser.username,
      });
    }
  }, [authUser]);

  // Check for stored user data on mount
  useEffect(() => {
    const checkStoredData = () => {
      try {
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
        } else if (!isAuthenticated) {
          // If no stored data and not authenticated via useAuth, check with backend
          checkAuthStatus();
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
      }
    };

    // Only run in client
    if (typeof window !== 'undefined') {
      checkStoredData();
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        checkAuthStatus,
        setUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 