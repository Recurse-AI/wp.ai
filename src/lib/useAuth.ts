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
      const token = TokenManager.getToken();
      if (!token) return;

      if (TokenManager.isTokenExpired(token)) {
        try {
          await TokenManager.refreshAccessToken();
        } catch (error) {
          TokenManager.clearTokens();
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
            error: "Session expired. Please login again.",
          });

          const refreshToken = TokenManager.getRefreshToken();
          if (
            refreshToken &&
            TokenManager.isRefreshTokenExpired(refreshToken)
          ) {
            router.push("/signin?reason=expired");
          } else {
            router.push("/signin?reason=session_expired");
          }
        }
      }
    };

    checkTokenValidity();
    const intervalId = setInterval(checkTokenValidity, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [router]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if we already have user data in state
        if (authState.user && authState.user.id && !authState.loading) {
          // User is already loaded, no need to fetch again
          return;
        }

        const token = TokenManager.getToken();

        if (!token) {
          const userDataString = safeLocalStorage.getItem("userData");
          const authToken = safeLocalStorage.getItem("token");

          if (userDataString) {
            try {
              const userData = JSON.parse(userDataString);
              setAuthState({
                user: userData,
                loading: false,
                isAuthenticated: true,
                error: null,
              });
              return;
            } catch (parseError) {}
          } else if (authToken) {
            setAuthState({
              user: { id: 0, email: "", username: "" },
              loading: false,
              isAuthenticated: true,
              error: null,
            });

            try {
              // Only fetch user profile if we don't have it in localStorage
              const userDataString = safeLocalStorage.getItem("userData");
              if (!userDataString) {
                const user = await AuthService.getUserProfile();
                if (user) {
                  setAuthState({
                    user,
                    loading: false,
                    isAuthenticated: true,
                    error: null,
                  });
                  safeLocalStorage.setItem("userData", JSON.stringify(user));
                }
              }
            } catch (fetchError) {
              const apiError = fetchError as any;

              if (apiError.tokenError === "expired_refresh") {
                TokenManager.clearTokens();
                safeLocalStorage.removeItem("userData");
                router.push("/signin?reason=expired");
              } else if (apiError.tokenError === "expired_access") {
                try {
                  await TokenManager.refreshAccessToken();
                  const user = await AuthService.getUserProfile();
                  if (user) {
                    setAuthState({
                      user,
                      loading: false,
                      isAuthenticated: true,
                      error: null,
                    });
                    safeLocalStorage.setItem("userData", JSON.stringify(user));
                  }
                } catch (refreshError) {}
              }
            }
            return;
          }

          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
            error: null,
          });
          return;
        }

        // Check if we already have user data in localStorage before making API call
        const userDataString = safeLocalStorage.getItem("userData");
        if (userDataString) {
          try {
            const userData = JSON.parse(userDataString);
            // Check if the user data is recent (less than 5 minutes old)
            const lastFetchTime = safeLocalStorage.getItem("userDataFetchTime");
            const currentTime = Date.now();
            if (
              lastFetchTime &&
              currentTime - parseInt(lastFetchTime) < 5 * 60 * 1000
            ) {
              setAuthState({
                user: userData,
                loading: false,
                isAuthenticated: true,
                error: null,
              });
              return;
            }
          } catch (parseError) {
            // If parsing fails, continue to fetch from API
          }
        }

        const user = await AuthService.getUserProfile();
        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });

        safeLocalStorage.setItem("userData", JSON.stringify(user));
        safeLocalStorage.setItem("userDataFetchTime", Date.now().toString());
      } catch (error) {
        const apiError = error as any;

        const userDataString = safeLocalStorage.getItem("userData");
        const authToken = safeLocalStorage.getItem("token");

        if (apiError.tokenError === "expired_refresh") {
          TokenManager.clearTokens();
          safeLocalStorage.removeItem("userData");

          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
            error: "Session expired. Please login again.",
          });

          router.push("/signin?reason=expired");
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
          } catch (parseError) {}
        } else if (authToken) {
          setAuthState({
            user: { id: 0, email: "", username: "" },
            loading: false,
            isAuthenticated: true,
            error: null,
          });
          return;
        }

        TokenManager.clearTokens();
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
          error: "Session expired. Please login again.",
        });
      }
    };

    loadUser();
  }, [router]);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setAuthState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const response = await AuthService.login(credentials);
        TokenManager.storeTokens(response.access, response.refresh);
        localStorage.setItem("token", response.access);

        const user = response.user;
        console.log("user", user);
        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });

        setTimeout(() => {
          if (localStorage.getItem("isChat")) {
            localStorage.removeItem("isChat");
            router.push("/chat");
          } else {
            router.push("/");
          }
        }, 500);

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
      const currentPath =
        typeof window !== "undefined" ? window.location.pathname : "";
      const isProtectedRoute =
        currentPath.includes("/chat") ||
        currentPath.includes("/dashboard") ||
        currentPath.includes("/profile") ||
        currentPath.includes("/settings");

      TokenManager.clearTokens();
      safeLocalStorage.removeItem("userData");
      safeLocalStorage.removeItem("token");

      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: null,
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("storage"));
        safeLocalStorage.setItem("recentLogout", Date.now().toString());
        setTimeout(() => safeLocalStorage.removeItem("recentLogout"), 1000);
      }

      if (isProtectedRoute) {
        router.push("/signin");
      } else {
        router.push("/");
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
