import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

  // Load user data on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check for token
        if (!TokenManager.getToken()) {
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
            error: null,
          });
          return;
        }

        // Get current user data
        const user = await AuthService.getCurrentUser();
        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
      } catch (error) {
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
  }, []);

  // Login handler
  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Get tokens and user data from API
      const response = await AuthService.login(credentials);
      
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
  }, []);

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
      // Clear tokens regardless of API success
      TokenManager.clearTokens();
      
      // Update state
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: null,
      });
      
      // Redirect to login
      router.push('/signin');
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
      const updatedUser = await AuthService.updateUserProfile(profileData);
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        loading: false,
        error: null,
      }));
      
      return updatedUser;
    } catch (error) {
      const errorMessage = (error as any)?.message || 'Profile update failed.';
      
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

  return {
    // State
    user: authState.user,
    loading: authState.loading,
    isAuthenticated: authState.isAuthenticated,
    error: authState.error,
    
    // Auth methods
    login,
    register,
    logout,
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