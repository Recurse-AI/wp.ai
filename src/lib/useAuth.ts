import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { getToastStyle } from './toastConfig';
import AuthService, { LoginCredentials, UserProfile, UserRegistration } from './authService';
import TokenManager from './tokenManager';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export default function useAuth() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
    error: null,
  });

  // Helper to safely access localStorage (only in browser)
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    },
    setItem: (key: string, value: string): void => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    },
    removeItem: (key: string): void => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    }
  };

  // Check token validity on mount and periodically
  useEffect(() => {
    const checkTokenValidity = async () => {
      // Check if token exists
      const token = TokenManager.getToken();
      if (!token) return;
  
      // Check if access token is expired (3 day validity)
      if (TokenManager.isTokenExpired(token)) {
        try {
          // Try to refresh the token
          await TokenManager.refreshAccessToken();
          console.log('🔄 Access token refreshed successfully');
        } catch (error) {
          console.error('❌ Token refresh failed:', error);
  
          // Clear tokens and update state
          TokenManager.clearTokens();
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
            error: 'Session expired. Please login again.',
          });
  
          // Get the refresh token to check if it's expired
          const refreshToken = TokenManager.getRefreshToken();
          if (refreshToken && TokenManager.isRefreshTokenExpired(refreshToken)) {
            // If refresh token is expired (1 month validity), redirect with expired message
            router.push('/signin?reason=expired');
          } else {
            // If refresh token is valid but refresh failed for other reasons
            router.push('/signin?reason=session_expired');
          }
        }
      } else {
        console.log('✅ Access token still valid (valid for 3 days)');
      }
    };
  
    // Run initial check
    checkTokenValidity();
  
    // Set up periodic check every 5 minutes
    const intervalId = setInterval(checkTokenValidity, 5 * 60 * 1000);
  
    return () => clearInterval(intervalId);
  }, [router]);

  // Load user data on mount
  useEffect(() => {
    const loadUser = async () => {
      console.log('🔄 Starting loadUser function');
      try {
        // Check for token
        const token = TokenManager.getToken();
        console.log('Token check:', token ? 'Token exists' : 'No token found');
        
        if (!token) {
          // Try to get user data from localStorage as fallback
          const userDataString = safeLocalStorage.getItem('userData');
          // Also check for authToken as another fallback
          const authToken = safeLocalStorage.getItem('token');
          
          console.log('Fallback checks:', {
            hasUserData: !!userDataString,
            hasAuthToken: !!authToken
          });
          
          if (userDataString) {
            try {
              const userData = JSON.parse(userDataString);
              console.log('✅ Using userData from localStorage');
              setAuthState({
                user: userData,
                loading: false,
                isAuthenticated: true,
                error: null,
              });
              return;
            } catch (parseError) {
              console.error('Failed to parse userData from localStorage:', parseError);
            }
          } else if (authToken) {
            console.log('🔑 Found authToken, attempting to fetch user data');
            // If we have an authToken but no userData, consider the user authenticated
            // but with incomplete data - this prevents unnecessary redirects
            setAuthState({
              user: { id: 0, email: '', username: '' }, // Minimal placeholder data
              loading: false,
              isAuthenticated: true, // Consider user authenticated
              error: null,
            });
            
            // Try to fetch the full user data in the background
            try {
              console.log('🔄 Fetching full user data');
              const user = await AuthService.getUserProfile();
              if (user) {
                console.log('✅ User data fetched successfully');
                setAuthState({
                  user,
                  loading: false,
                  isAuthenticated: true,
                  error: null,
                });
                safeLocalStorage.setItem('userData', JSON.stringify(user));
              }
            } catch (fetchError) {
              console.error('❌ Error fetching user data:', fetchError);
              const apiError = fetchError as any;
              
              // Handle token-specific errors
              if (apiError.tokenError === 'expired_refresh') {
                console.error('❌ Refresh token expired (1 month validity)');
                TokenManager.clearTokens();
                safeLocalStorage.removeItem('userData');
                router.push('/signin?reason=expired');
              } else if (apiError.tokenError === 'expired_access') {
                console.log('🔄 Access token expired, attempting refresh');
                // Try to refresh the token
                try {
                  await TokenManager.refreshAccessToken();
                  console.log('✅ Token refreshed, retrying user data fetch');
                  // If successful, retry loading user
                  const user = await AuthService.getUserProfile();
                  if (user) {
                    console.log('✅ User data fetched after token refresh');
                    setAuthState({
                      user,
                      loading: false,
                      isAuthenticated: true,
                      error: null,
                    });
                    safeLocalStorage.setItem('userData', JSON.stringify(user));
                  }
                } catch (refreshError) {
                  console.error('Failed to refresh token in background:', refreshError);
                }
              }
            }
            return;
          }
          
          console.log('❌ No valid auth data found, setting unauthenticated state');
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
            error: null,
          });
          return;
        }

        console.log('🔄 Valid token found, fetching current user data');
        // Get current user data
        const user = await AuthService.getUserProfile();
        console.log('✅ User data fetched successfully:', user);
        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
        
        // Store user data in localStorage for fallback
        safeLocalStorage.setItem('userData', JSON.stringify(user));
      } catch (error) {
        console.error('❌ Error in loadUser:', error);
        const apiError = error as any;
        
        // Try to get user data from localStorage as fallback
        const userDataString = safeLocalStorage.getItem('userData');
        const authToken = safeLocalStorage.getItem('token');
        
        // Handle token-specific errors
        if (apiError.tokenError === 'expired_refresh') {
          console.error('❌ Refresh token expired (1 month validity)');
          TokenManager.clearTokens();
          safeLocalStorage.removeItem('userData');
          
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
            error: 'Session expired. Please login again.',
          });
          
          router.push('/signin?reason=expired');
          return;
        }
        
        if (userDataString) {
          try {
            const user = JSON.parse(userDataString);
            setAuthState({
              user,
              loading: false,
              isAuthenticated: true,
              error: null,
            });
            return;
          } catch (parseError) {
            console.error('Failed to parse userData from localStorage:', parseError);
          }
        } else if (authToken) {
          // If we have an authToken but no userData, consider the user authenticated
          setAuthState({
            user: { id: 0, email: '', username: '' }, // Minimal placeholder data 
            loading: false,
            isAuthenticated: true, // Consider user authenticated
            error: null,
          });
          return;
        }
        
        // Handle unauthorized or other errors
        TokenManager.clearTokens();
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
          error: 'Session expired. Please login again.',
        });
      }
    };

    loadUser();
  }, [router]);

  // Login handler
  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Get tokens and user data from API
      const response = await AuthService.login(credentials);
      
      console.log('🔐 Login Success - Tokens received:', {
        access: response.access ? 'Access token received' : 'No access token',
        refresh: response.refresh ? 'Refresh token received' : 'No refresh token',
        user: response.user ? 'User data received' : 'No user data'
      });
      
      // Store tokens
      TokenManager.storeTokens(response.access, response.refresh);
      
      // User data is now included in the login response
      const user = response.user;
          
      setAuthState({
        user,
        loading: false,
        isAuthenticated: true,
        error: null,
      });
          
      // Add a short delay before redirecting to ensure tokens are fully saved
      setTimeout(() => {
        if(localStorage.getItem("isChat")){
          localStorage.removeItem("isChat");
          router.push("/chat");
        } else {
          router.push("/");
        }
      }, 500); // 500ms delay
      
      return user;
    } catch (error) {
      const errorMessage = (error as any)?.message || 'Login failed. Please try again.';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        isAuthenticated: false,
        error: errorMessage,
      }));
      
      throw error;
    }
  }, [router]);

  // Register handler
  const register = useCallback(async (userData: UserRegistration) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Register the user
      const response = await AuthService.register(userData);
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: null,
      }));
      
      return response;
    } catch (error) {
      const errorMessage = (error as any)?.message || 'Registration failed. Please try again.';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      throw error;
    }
  }, []);

  // Logout handler
  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    
    try {
      // Call logout API
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Store current path before clearing everything
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const isProtectedRoute = currentPath.includes('/chat') || 
                              currentPath.includes('/dashboard') || 
                              currentPath.includes('/profile') ||
                              currentPath.includes('/settings');
      
      // Clear tokens regardless of API success
      TokenManager.clearTokens();
      
      // Also clear user data from localStorage
      safeLocalStorage.removeItem('userData');
      safeLocalStorage.removeItem('token');
      
      // Update state
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: null,
      });
      
      // Trigger storage event to notify other components about the logout
      if (typeof window !== 'undefined') {
        // Create a storage event to notify other components
        window.dispatchEvent(new Event('storage'));
        
        // Set a flag to indicate recent logout (helps with immediate UI updates)
        safeLocalStorage.setItem('recentLogout', Date.now().toString());
        // This will be automatically cleaned up on the next auth check
        setTimeout(() => safeLocalStorage.removeItem('recentLogout'), 1000);
      }
      
      // Redirect to appropriate page based on current route
      if (isProtectedRoute) {
        console.log('Logged out from protected route, redirecting to signin');
        router.push('/signin');
      } else {
        console.log('Logged out from public route, redirecting to home');
        router.push('/');
      }
    }
  }, [router]);

  // Social authentication methods
  const socialAuth = {
    google: async (code: string) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const response = await AuthService.googleAuth(code);
        TokenManager.storeTokens(response.access, response.refresh);
        const user = response.user;
        
        // Store user data in localStorage for fallback
        safeLocalStorage.setItem('userData', JSON.stringify(user));
        
        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
        return user;
      } catch (error) {
        const errorMessage = (error as any)?.message || 'Google authentication failed.';
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    
    facebook: async (accessToken: string) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const response = await AuthService.facebookAuth(accessToken);
        TokenManager.storeTokens(response.access, response.refresh);
        const user = response.user;
        
        // Store user data in localStorage for fallback
        safeLocalStorage.setItem('userData', JSON.stringify(user));
        
        setAuthState({
            user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
        return user;
      } catch (error) {
        const errorMessage = (error as any)?.message || 'Facebook authentication failed.';
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    
    github: async (code: string) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const response = await AuthService.githubAuth(code);
        TokenManager.storeTokens(response.access, response.refresh);
        const user = response.user;
        
        // Store user data in localStorage for fallback
        safeLocalStorage.setItem('userData', JSON.stringify(user));
        
        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
        return user;
      } catch (error) {
        const errorMessage = (error as any)?.message || 'GitHub authentication failed.';
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    
    wordpress: async (code: string) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      try {
        const response = await AuthService.wordpressAuth(code);
        TokenManager.storeTokens(response.access, response.refresh);
        const user = response.user;
        
        // Store user data in localStorage for fallback
        safeLocalStorage.setItem('userData', JSON.stringify(user));
        
        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
        return user;
      } catch (error) {
        const errorMessage = (error as any)?.message || 'WordPress authentication failed.';
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    }
  };

  // Update user profile
  const updateProfile = useCallback(async (profileData: Partial<UserProfile>) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const updatedProfile = await AuthService.updateUserProfile(profileData);
      
      // Update localStorage with new profile data
      const userDataString = safeLocalStorage.getItem('userData');
      if (userDataString) {
        try {
          const userData = JSON.parse(userDataString);
          const updatedUserData = { ...userData, ...updatedProfile };
          safeLocalStorage.setItem('userData', JSON.stringify(updatedUserData));
        } catch (parseError) {
          console.error('Failed to update userData in localStorage:', parseError);
        }
      } else {
        // If no existing data, just store the updated profile
        safeLocalStorage.setItem('userData', JSON.stringify(updatedProfile));
      }
      
      setAuthState(prev => ({
        ...prev,
        user: updatedProfile,
        loading: false,
        error: null,
      }));
      
      return updatedProfile;
    } catch (error) {
      const errorMessage = (error as any)?.message || 'Failed to update profile.';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      throw error;
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (oldPassword: string, newPassword: string, confirmPassword: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await AuthService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      
      setAuthState(prev => ({ ...prev, loading: false, error: null }));
    } catch (error) {
      const errorMessage = (error as any)?.message || 'Password change failed.';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      throw error;
    }
  }, []);

  // Reset password methods
  const passwordReset = {
    request: async (email: string) => {
      try {
        return await AuthService.requestPasswordReset(email);
      } catch (error) {
        const errorMessage = (error as any)?.message || 'Password reset request failed.';
        throw new Error(errorMessage);
      }
    },
    
    confirm: async (uid: string, token: string, newPassword: string, confirmPassword: string) => {
      try {
        return await AuthService.confirmPasswordReset({
          uid,
          token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        });
      } catch (error) {
        const errorMessage = (error as any)?.message || 'Password reset confirmation failed.';
        throw new Error(errorMessage);
      }
    }
  };

  // Email verification methods
  const emailVerification = {
    request: async () => {
      try {
        return await AuthService.requestEmailVerification();
      } catch (error) {
        const errorMessage = (error as any)?.message || 'Email verification request failed.';
        throw new Error(errorMessage);
      }
    },
    
    confirm: async (uidb64: string, token: string) => {
      try {
        return await AuthService.confirmEmailVerification(uidb64, token);
      } catch (error) {
        const errorMessage = (error as any)?.message || 'Email verification confirmation failed.';
        throw new Error(errorMessage);
      }
    }
  };

  // Phone verification methods
  const phoneVerification = {
    request: async (phoneNumber: string) => {
      try {
        return await AuthService.requestPhoneVerification(phoneNumber);
      } catch (error) {
        const errorMessage = (error as any)?.message || 'Phone verification request failed.';
        throw new Error(errorMessage);
      }
    },
    
    confirm: async (phoneNumber: string, verificationCode: string) => {
      try {
        return await AuthService.verifyPhone({
          phone_number: phoneNumber,
          verification_code: verificationCode,
        });
      } catch (error) {
        const errorMessage = (error as any)?.message || 'Phone verification confirmation failed.';
        throw new Error(errorMessage);
      }
    }
  };

  // Session management methods
  const sessions = {
    list: async () => {
      try {
        return await AuthService.getUserSessions();
      } catch (error) {
        const errorMessage = (error as any)?.message || 'Failed to retrieve sessions.';
        throw new Error(errorMessage);
      }
    },
    
    terminate: async (sessionId: number) => {
      try {
        return await AuthService.terminateSession(sessionId);
      } catch (error) {
        const errorMessage = (error as any)?.message || 'Failed to terminate session.';
        throw new Error(errorMessage);
      }
    }
  };

  // Add a verifyEmail function if it doesn't exist
  const verifyEmail = useCallback(async (uidb64: string, token: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Call the API to verify the email
      const response = await AuthService.confirmEmailVerification(uidb64, token);
      
      // Check if the response includes auth tokens (user is automatically logged in)
      if (response.access && response.refresh && response.user) {
        // Store the tokens
        TokenManager.storeTokens(response.access, response.refresh);
        
        // Update auth state with the user data
        setAuthState({
          user: response.user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        // Just update loading state if no tokens returned
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: null,
        }));
      }
      
      return response;
    } catch (error) {
      const errorMessage = (error as any)?.message || 'Email verification failed. Please try again.';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      throw error;
    }
  }, []);

  // Return all the auth methods and state
  return {
    // State
    user: authState.user,
    loading: authState.loading,
    isAuthenticated: authState.isAuthenticated,
    error: authState.error,
    
    // Methods
    login,
    register,
    logout,
    verifyEmail,
    socialAuth,
    
    // Profile management
    updateProfile,
    changePassword,
    
    // Password reset
    passwordReset,
    
    // Verification methods
    emailVerification,
    phoneVerification,
    
    // Session management
    sessions,
  };
} 