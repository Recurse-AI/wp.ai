"use client";

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuth from '@/lib/useAuth';
import { UserProfile } from '@/lib/authService';
import TokenManager from '@/lib/tokenManager';

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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  isLoggedIn: false,
  user: { name: '', image: '' },
  checkAuthStatus: async () => false,
  setUserData: () => {},
  logout: async () => {},
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
  const { isAuthenticated, user: authUser, loading: authLoading, logout: authLogout } = useAuth();

  // Forward logout function from useAuth
  const logout = async () => {
    await authLogout();
    setIsLoggedIn(false);
    setUser({
      name: '',
      image: '',
      email: '',
      id: 0,
      username: '',
    });
  };

  const checkAuthStatus = async () => {
    // Check all possible auth sources
    const hasToken = !!TokenManager.getToken();
    const hasRefreshToken = !!TokenManager.getRefreshToken();
    const hasUserData = !!localStorage.getItem('userData');
    const hasAuthToken = !!localStorage.getItem('token');
    
    console.log("AuthProvider: Checking auth status", { 
      isAuthenticated, 
      hasToken, 
      hasRefreshToken, 
      hasUserData, 
      hasAuthToken
    });
    
    // If any method indicates the user is authenticated, consider them logged in
    return isAuthenticated || hasToken || hasRefreshToken || hasUserData || hasAuthToken;
  };

  // Set user data manually (useful after login)
  const setUserData = (userData: any) => {
    if (userData) {
      console.log("AuthProvider: Setting user data manually", userData);
      setIsLoggedIn(true);
      setUser({
        name: userData.username || userData.name || userData.user?.username || userData.user?.name || '',
        image: userData.image || userData.profile_pic || '',
        email: userData.email || userData.user?.email || '',
        id: userData.id || userData.user?.id || 0,
        username: userData.username || userData.user?.username || '',
      });
    }
  };

  // Sync with useAuth hook when authUser changes
  useEffect(() => {
    if (!authLoading) {
      if (authUser && isAuthenticated) {
        console.log("AuthProvider: Setting logged in from useAuth", authUser);
        setIsLoggedIn(true);
        setUser({
          name: authUser.username || `${authUser.first_name || ''} ${authUser.last_name || ''}`.trim(),
          image: authUser.profile_picture || user.image,
          email: authUser.email,
          id: authUser.id,
          username: authUser.username,
        });
      }
    }
  }, [authUser, isAuthenticated, authLoading]);

  // Listen for storage events to detect logout/login events from other components
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        // Check for recent logout flag
        const recentLogout = localStorage.getItem('recentLogout');
        
        // Check for userData removal which indicates logout
        const userData = localStorage.getItem('userData');
        
        if (recentLogout || !userData) {
          // Update state to reflect logout
          setIsLoggedIn(false);
          setUser({
            name: '',
            image: '',
            email: '',
            id: 0,
            username: '',
          });
          console.log('Auth state reset due to storage event (logout detected)');
        } else if (userData && !isLoggedIn) {
          // User data exists but not logged in - potential login event
          try {
            const parsedData = JSON.parse(userData);
            setUserData(parsedData);
            console.log('Auth state updated due to storage event (login detected)');
          } catch (error) {
            console.error('Error parsing userData from storage event:', error);
          }
        }
      } catch (error) {
        console.error('Error handling storage event:', error);
      }
    };
    
    // Only add listener in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      // Also listen for custom storage event (for same-tab communication)
      window.addEventListener('storage-local', handleStorageChange);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('storage-local', handleStorageChange);
      }
    };
  }, [isLoggedIn]);

  // Check for stored user data on mount
  useEffect(() => {
    const checkStoredData = async () => {
      try {
        // Check all possible authentication indicators
        const storedUserData = localStorage.getItem('userData');
        const hasToken = !!TokenManager.getToken();
        const hasRefreshToken = !!TokenManager.getRefreshToken();
        const hasAuthToken = !!localStorage.getItem('token');
        
        console.log("AuthProvider: Checking stored data", { 
          hasStoredUserData: !!storedUserData,
          hasToken,
          hasRefreshToken,
          hasAuthToken,
          isAuthenticated
        });
        
        // If we have user data, set it
        if (storedUserData) {
          try {
            const parsedData = JSON.parse(storedUserData);
            setUserData(parsedData);
            console.log("AuthProvider: Set user data from localStorage");
          } catch (parseError) {
            console.error('Error parsing userData:', parseError);
          }
        } 
        // If we have any token but no user data, mark as logged in with minimal data
        else if ((hasToken || hasRefreshToken || hasAuthToken) && !isAuthenticated) {
          console.log("AuthProvider: Setting logged in from tokens with minimal data");
          setIsLoggedIn(true);
          
          // We'll rely on the authUser from useAuth to update when it's available
          if (!authLoading && authUser) {
            setUserData(authUser);
            console.log("AuthProvider: User data available from useAuth");
          } else {
            console.log("AuthProvider: No user data available yet, will update when authUser becomes available");
          }
        }
      } catch (error) {
        console.error('Error checking stored user data:', error);
      }
    };

    // Only run in client
    if (typeof window !== 'undefined') {
      checkStoredData();
    }
  }, [isAuthenticated, authUser, authLoading]);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        checkAuthStatus,
        setUserData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 