import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AuthService, {
  LoginCredentials,
  UserProfile,
  UserRegistration,
} from "./authService";
import TokenManager from "./tokenManager";

// Re-export UserProfile type for easy import by other components
export type { UserProfile } from "./authService";

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

  // Add setUserData function
  const setUserData = useCallback((userData: UserProfile) => {
    setAuthState((prevState) => ({
      ...prevState,
      user: userData,
      isAuthenticated: true,
    }));
  }, []);

  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      if (typeof window !== "undefined") return localStorage.getItem(key);
      return null;
    },
    setItem: (key: string, value: string): void => {
      if (typeof window !== "undefined") localStorage.setItem(key, value);
    },
    removeItem: (key: string): void => {
      if (typeof window !== "undefined") localStorage.removeItem(key);
    },
  };

  useEffect(() => {
    const checkTokenValidity = async () => {
      try {
        const token = await TokenManager.getValidToken();
        if (!token) {
          if (typeof window !== 'undefined' && 
              window.location.pathname !== '/' &&
              !window.location.pathname.includes('/signin') && 
              !window.location.pathname.includes('/signup')) {
            TokenManager.clearTokens();
            router.push("/signin?reason=session_expired");
          }
        }
      } catch (error) {
        console.error("Token validation error:", error);
      }
    };
    
    checkTokenValidity();
    const intervalId = setInterval(checkTokenValidity, 6 * 60 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [router]);

  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const user = JSON.parse(userData);
      setAuthState({
        user,
        loading: false,
        isAuthenticated: true,
        error: null,
      });
    }
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await AuthService.login(credentials);
        TokenManager.storeTokens(response.access, response.refresh);
        const user = response.user;
        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
        localStorage.setItem("userData", JSON.stringify(user));

        return user;
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "Login failed. Please try again.";

        setAuthState((prev) => ({
          ...prev,
          loading: false,
          isAuthenticated: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    [router]
  );

  const register = useCallback(async (userData: UserRegistration) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await AuthService.register(userData);
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: null,
      }));
      return response;
    } catch (error) {
      const errorMessage =
        (error as any)?.message || "Registration failed. Please try again.";
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthState((prev) => ({ ...prev, loading: true }));

    try {
      await AuthService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: null,
      });
      TokenManager.clearTokens();
      localStorage.removeItem("userData");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
      }
    }
  }, [router]);

  const socialAuth = {
    google: async (email: string, image?: string) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await AuthService.googleAuth(email, image);
        TokenManager.storeTokens(response.access, response.refresh);
        const user = response.user;
        safeLocalStorage.setItem("userData", JSON.stringify(user));

        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
        return user;
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "Google authentication failed.";
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    facebook: async (accessToken: string) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await AuthService.facebookAuth(accessToken);
        TokenManager.storeTokens(response.access, response.refresh);
        const user = response.user;
        safeLocalStorage.setItem("userData", JSON.stringify(user));

        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
        return user;
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "Facebook authentication failed.";
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    github: async (code: string) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await AuthService.githubAuth(code);
        TokenManager.storeTokens(response.access, response.refresh);
        const user = response.user;
        safeLocalStorage.setItem("userData", JSON.stringify(user));

        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
        return user;
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "GitHub authentication failed.";
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },

    wordpress: async (code: string) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const response = await AuthService.wordpressAuth(code);
        TokenManager.storeTokens(response.access, response.refresh);
        const user = response.user;
        safeLocalStorage.setItem("userData", JSON.stringify(user));

        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
        return user;
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "WordPress authentication failed.";
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
  };

  const updateProfile = useCallback(
    async (profileData: Partial<UserProfile>) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const updatedProfile = await AuthService.updateUserProfile(profileData);

        const userDataString = safeLocalStorage.getItem("userData");
        if (userDataString) {
          try {
            const userData = JSON.parse(userDataString);
            const updatedUserData = { ...userData, ...updatedProfile };
            safeLocalStorage.setItem(
              "userData",
              JSON.stringify(updatedUserData)
            );
          } catch (parseError) {}
        } else {
          safeLocalStorage.setItem("userData", JSON.stringify(updatedProfile));
        }

        setAuthState((prev) => ({
          ...prev,
          user: updatedProfile,
          loading: false,
          error: null,
        }));

        return updatedProfile;
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "Failed to update profile.";

        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    []
  );

  const changePassword = useCallback(
    async (
      oldPassword: string,
      newPassword: string,
      confirmPassword: string
    ) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        await AuthService.changePassword({
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        });

        setAuthState((prev) => ({ ...prev, loading: false, error: null }));
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "Password change failed.";

        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        throw error;
      }
    },
    []
  );

  const passwordReset = {
    request: async (email: string) => {
      try {
        return await AuthService.requestPasswordReset(email);
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "Password reset request failed.";
        throw new Error(errorMessage);
      }
    },

    confirm: async (
      uid: string,
      token: string,
      newPassword: string,
      confirmPassword: string
    ) => {
      try {
        return await AuthService.confirmPasswordReset({
          uid,
          token,
          new_password: newPassword,
          confirm_password: confirmPassword,
        });
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "Password reset confirmation failed.";
        throw new Error(errorMessage);
      }
    },
  };

  const emailVerification = {
    request: async () => {
      try {
        return await AuthService.requestEmailVerification();
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "Email verification request failed.";
        throw new Error(errorMessage);
      }
    },

    confirm: async (uidb64: string, token: string) => {
      try {
        return await AuthService.confirmEmailVerification(uidb64, token);
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "Email verification confirmation failed.";
        throw new Error(errorMessage);
      }
    },
  };

  const phoneVerification = {
    request: async (phoneNumber: string) => {
      try {
        return await AuthService.requestPhoneVerification(phoneNumber);
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "Phone verification request failed.";
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
        const errorMessage =
          (error as any)?.message || "Phone verification confirmation failed.";
        throw new Error(errorMessage);
      }
    },
  };

  const sessions = {
    list: async () => {
      try {
        return await AuthService.getUserSessions();
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "Failed to retrieve sessions.";
        throw new Error(errorMessage);
      }
    },

    terminate: async (sessionId: number) => {
      try {
        return await AuthService.terminateSession(sessionId);
      } catch (error) {
        const errorMessage =
          (error as any)?.message || "Failed to terminate session.";
        throw new Error(errorMessage);
      }
    },
  };

  const verifyEmail = useCallback(async (uidb64: string, token: string) => {
    setAuthState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await AuthService.confirmEmailVerification(
        uidb64,
        token
      );

      if (response.access && response.refresh && response.user) {
        TokenManager.storeTokens(response.access, response.refresh);

        setAuthState({
          user: response.user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          error: null,
        }));
      }

      return response;
    } catch (error) {
      const errorMessage =
        (error as any)?.message ||
        "Email verification failed. Please try again.";

      setAuthState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      throw error;
    }
  }, []);

  return {
    user: authState.user,
    loading: authState.loading,
    isAuthenticated: authState.isAuthenticated,
    error: authState.error,
    setUserData,
    login,
    register,
    logout,
    verifyEmail,
    socialAuth,
    updateProfile,
    changePassword,
    passwordReset,
    emailVerification,
    phoneVerification,
    sessions,
  };
}
