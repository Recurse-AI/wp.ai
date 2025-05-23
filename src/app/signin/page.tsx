"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeProvider";
import { motion } from "framer-motion";
import useAuth from "@/lib/useAuth";
import Link from "next/link";
import { useAuthContext } from "@/context/AuthProvider";
import toast from "react-hot-toast";
import { showStatusToast, showErrorToast } from '@/components/ui/StatusToast';

// Interface for form data
interface SignInFormData {
  login: string;
  password: string;
}

// Interface for field errors
interface FormErrors {
  login?: string;
  password?: string;
  general?: string;
}

// Validation messages
const VALIDATION_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  INVALID_CREDENTIALS: "Invalid email or password",
  LOGIN_SUCCESS: "Login successful! Redirecting...",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  AUTH_FAILED: "Authentication failed. Please sign in again.",
  LOGIN_REQUIRED: "Your login session has expired. Please sign in again.",
  REFRESH_TOKEN_EXPIRED:
    "Your session has expired after 1 month of inactivity. Please sign in again.",
};

export default function SignIn() {
  const { theme } = useTheme();
  const router = useRouter();
  const { login, isAuthenticated, socialAuth } = useAuth();
  const { setUserData } = useAuthContext();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  // Form state
  const [formData, setFormData] = useState<SignInFormData>({
    login: "",
    password: "",
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const callbackExecuted = useRef(false);

  useEffect(() => {
    if (!mounted && isAuthenticated) {
      router.push("/");
    }
  }, [mounted, isAuthenticated]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check URL parameters for session messages
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const reason = urlParams.get("reason");

      if (reason) {
        // Only show messages for actual session expiration cases
        switch (reason) {
          case "expired":
            setSessionMessage(VALIDATION_MESSAGES.REFRESH_TOKEN_EXPIRED);
            break;
          case "session_expired":
            setSessionMessage(VALIDATION_MESSAGES.SESSION_EXPIRED);
            break;
          case "auth_failed":
            setSessionMessage(VALIDATION_MESSAGES.AUTH_FAILED);
            break;
          // Remove login_required case as it's not needed for normal signouts
        }

        // Clean up the URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    }
  }, [theme]);

  // Add Social Authentication Callback
  useEffect(() => {
    const handleSocialCallback = async () => {
      if (callbackExecuted.current) {
        return;
      }

      const socialAuthInitiated = localStorage.getItem("socialAuthInitiated");
      const authProvider = localStorage.getItem("authProvider");

      if (!session?.user?.email || !socialAuthInitiated || !authProvider) {
        return;
      }

      callbackExecuted.current = true;
      setLoading(true);

      // Show loading toast
      const loadingToastId = showStatusToast('LOADING', `Signing in with ${authProvider}...`);

      try {
        // Call the appropriate social auth method based on the provider
        let user;
        switch (authProvider) {
          case "google":
            user = await socialAuth.google(
              session.user.email,
              session.user.image || undefined
            );
            break;
          case "github":
            user = await socialAuth.github(session.user.email);
            break;
          case "wordpress":
            user = await socialAuth.wordpress(session.user.email);
            break;
          default:
            throw new Error(`Unsupported auth provider: ${authProvider}`);
        }

        // Set user data in context
        if (user) {
          setUserData(user);
        }

        // Clean up localStorage
        localStorage.removeItem("socialAuthInitiated");
        localStorage.removeItem("authProvider");

        // Dismiss loading toast and show success
        toast.dismiss(loadingToastId);
        showStatusToast('COMPLETED', `Successfully signed in with ${authProvider}!`);

        // Redirect
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } catch (error: unknown) {
        console.error("Social authentication error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message.replace(/^Error:\s*/, "")
            : "Failed to complete authentication";
        
        // Dismiss loading toast and show error
        toast.dismiss(loadingToastId);
        showErrorToast(errorMessage);
        
        setErrors({ general: errorMessage });
        localStorage.removeItem("socialAuthInitiated");
        localStorage.removeItem("authProvider");
      } finally {
        setLoading(false);
      }
    };

    handleSocialCallback();
  }, [session, socialAuth, setUserData, router, theme]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user types
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Check required fields
    if (!formData.login.trim()) {
      newErrors.login = VALIDATION_MESSAGES.REQUIRED("Username or Email");
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = VALIDATION_MESSAGES.REQUIRED("Password");
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setSuccessMessage(null);

    // Validate form
    if (!validateForm()) {
      // Show first validation error as toast
      const firstError = Object.values(errors).find(error => error);
      if (firstError) {
        showErrorToast(firstError);
      }
      return;
    }

    setLoading(true);
    
    // Show loading toast
    const loadingToastId = showStatusToast('LOADING', 'Signing in...');

    try {
      // Using the auth service for login
      const user = await login({
        login: formData.login,
        password: formData.password,
      });
      setUserData(user);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToastId);
      showStatusToast('COMPLETED', VALIDATION_MESSAGES.LOGIN_SUCCESS);
      
      setSuccessMessage(VALIDATION_MESSAGES.LOGIN_SUCCESS);
      setErrors({});

      setTimeout(() => {
        router.push("/");
      }, 1500);

    } catch (error: unknown) {
      let errorMessage = VALIDATION_MESSAGES.INVALID_CREDENTIALS;
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Dismiss loading toast and show error
      toast.dismiss(loadingToastId);
      showErrorToast(errorMessage);
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Add Social Sign In handlers
  const handleSocialSignIn = (provider: string) => {
    // Clear any existing auth data first
    localStorage.removeItem("socialAuthInitiated");
    localStorage.removeItem("authProvider");

    // Set new auth data
    localStorage.setItem("socialAuthInitiated", "true");
    localStorage.setItem("authProvider", provider);
    signIn(provider);
  };

  return (
      <>
        <div className="fixed inset-0 overflow-hidden">
          {/* Base Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-30" />

          {/* Glowing Orbs */}
          <div className="absolute -top-[10%] -left-[5%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute top-[40%] -right-[10%] w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-[10%] left-[30%] w-[600px] h-[600px] bg-pink-600/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-screen w-full overflow-y-auto py-4">
          {/* Content */}
          <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row rounded-xl shadow-2xl overflow-hidden my-4">
            {/* Left side - Illustration/Feature list (hidden on mobile) */}
            <div
              className={`hidden lg:block lg:w-2/5 p-8 lg:p-10 ${
                theme === "dark" ? "bg-gray-900" : "bg-blue-50"
              }`}
            >
              <div className="h-full flex flex-col justify-center">
                <h2
                  className={`text-2xl font-bold mb-6 ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                >
                  Welcome Back
                </h2>

                <div className="space-y-6">
                  <div className="flex items-start space-x-3">
                    <div
                      className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        theme === "dark" ? "bg-indigo-600" : "bg-indigo-100"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 ${
                          theme === "dark" ? "text-white" : "text-indigo-600"
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3
                        className={`font-medium ${
                          theme === "dark" ? "text-white" : "text-gray-800"
                        }`}
                      >
                        Secure Login
                      </h3>
                      <p
                        className={`text-sm mt-1 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Your account is protected with industry-standard
                        security
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div
                      className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        theme === "dark" ? "bg-indigo-600" : "bg-indigo-100"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 ${
                          theme === "dark" ? "text-white" : "text-indigo-600"
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path
                          fillRule="evenodd"
                          d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3
                        className={`font-medium ${
                          theme === "dark" ? "text-white" : "text-gray-800"
                        }`}
                      >
                        Privacy First
                      </h3>
                      <p
                        className={`text-sm mt-1 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        We never share your personal information
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div
                      className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        theme === "dark" ? "bg-indigo-600" : "bg-indigo-100"
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-4 w-4 ${
                          theme === "dark" ? "text-white" : "text-indigo-600"
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3
                        className={`font-medium ${
                          theme === "dark" ? "text-white" : "text-gray-800"
                        }`}
                      >
                        Instant Access
                      </h3>
                      <p
                        className={`text-sm mt-1 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Access your account and content immediately
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-12 p-5 rounded-lg relative overflow-hidden ${
                    theme === "dark" ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <div
                    className={`absolute top-0 left-0 w-2 h-full ${
                      theme === "dark" ? "bg-indigo-500" : "bg-indigo-500"
                    }`}
                  ></div>
                  <p
                    className={`text-base italic ${
                      theme === "dark" ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    "We're excited to have you back. Your personalized
                    experience is waiting for you."
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Form */}
            <div
              className={`w-full lg:w-3/5 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto max-h-[80vh] lg:max-h-none relative ${
                theme === "dark" ? "bg-gray-800" : "bg-white"
              }`}
            >
              {/* Logo and heading section */}
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 relative w-16 h-16 flex items-center justify-center">
                  <div
                    className={`absolute inset-0 rounded-full ${
                      theme === "dark" ? "bg-indigo-600" : "bg-indigo-500"
                    } opacity-20 blur-md`}
                  ></div>
                  <div
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full ${
                      theme === "dark" ? "bg-indigo-600" : "bg-indigo-500"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-0.257-0.257A6 6 0 0118 8zm-6-4a1 1 0 100 2h2a1 1 0 100-2h-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>

                <h1
                  className={`text-2xl font-bold ${
                    theme === "dark" ? "text-white" : "text-gray-800"
                  }`}
                >
                  Welcome Back
                </h1>
                <p
                  className={`text-sm mt-1 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  Sign in to continue to your account
                </p>
              </div>

              {/* Main form */}
              <form onSubmit={handleSignIn} className="space-y-5">
                {successMessage && (
                  <div
                    className={`p-3 rounded-md ${
                      theme === "dark"
                        ? "bg-green-900/30 text-green-200"
                        : "bg-green-50 text-green-600"
                    } text-sm flex items-center`}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 mr-2" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    {successMessage}
                  </div>
                )}

                {(errors.general && formSubmitted) || sessionMessage ? (
                  <div
                    className={`p-3 rounded-md ${
                      theme === "dark"
                        ? "bg-red-900/30 text-red-200"
                        : "bg-red-50 text-red-600"
                    } text-sm flex items-center`}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 mr-2" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    {errors.general || sessionMessage}
                  </div>
                ) : null}

                <div className="space-y-1">
                  <label
                    className={`block text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Email
                  </label>
                  <input
                    type="text"
                    name="login"
                    placeholder="Enter your email"
                    className={`w-full p-3 rounded-lg border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                        : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                    } ${
                      errors.login
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:ring-indigo-500"
                    } focus:ring-2 focus:border-transparent transition-all`}
                    value={formData.login}
                    onChange={handleInputChange}
                    required
                  />
                  {errors.login && formSubmitted && (
                    <p className="mt-1 text-sm text-red-500">{errors.login}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label
                      className={`block text-sm font-medium ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className={`text-xs font-medium ${
                        theme === "dark"
                          ? "text-indigo-400 hover:text-indigo-300"
                          : "text-indigo-600 hover:text-indigo-500"
                      }`}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      className={`w-full p-3 rounded-lg border ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                      } ${
                        errors.password
                          ? "border-red-500 focus:ring-red-500"
                          : "focus:ring-indigo-500"
                      } focus:ring-2 focus:border-transparent transition-all`}
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        theme === "dark"
                          ? "text-gray-400 hover:text-gray-300"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path
                            fillRule="evenodd"
                            d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                            clipRule="evenodd"
                          />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && formSubmitted && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.password}
                    </p>
                  )}
                </div>

                <motion.button
                  type="submit"
                  className={`w-full py-3 px-6 mt-2 rounded-lg font-medium text-white relative overflow-hidden
                    ${
                      theme === "dark"
                        ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500"
                        : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400"
                    } focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition-all`}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                  {/* Add a subtle animation effect */}
                  <motion.div
                    className="absolute inset-0 bg-white opacity-10"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "linear",
                    }}
                  />
                </motion.button>
              </form>

              <div className="mt-8">
                <div className="flex items-center justify-center space-x-2 mb-6">
                  <div
                    className={`h-px flex-1 ${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  ></div>
                  <p
                    className={`text-sm font-medium ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Or continue with
                  </p>
                  <div
                    className={`h-px flex-1 ${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  ></div>
                </div>

                <div className="flex items-center justify-center space-x-4">
                  <SocialButton
                    provider="google"
                    theme={theme}
                    onClick={() => handleSocialSignIn("google")}
                  />
                  <SocialButton
                    provider="github"
                    theme={theme}
                    onClick={() => handleSocialSignIn("github")}
                  />
                  <SocialButton
                    provider="wordpress"
                    theme={theme}
                    onClick={() => handleSocialSignIn("wordpress")}
                  />
                </div>
              </div>

              <div className="mt-8 text-center">
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Don't have an account?{" "}
                  <Link
                    href="/signup"
                    className={`font-medium ${
                      theme === "dark"
                        ? "text-indigo-400 hover:text-indigo-300"
                        : "text-indigo-600 hover:text-indigo-500"
                    }`}
                  >
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
  );
}

interface SocialButtonProps {
  provider: "google" | "github" | "wordpress";
  theme: string;
  onClick: () => void;
}

// Social login button component
function SocialButton({ provider, theme, onClick }: SocialButtonProps) {
  // Icons for different providers
  const icons = {
    google: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
        />
      </svg>
    ),
    github: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
        />
      </svg>
    ),
    wordpress: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.109m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.585-.03-.661.855-.075.885 0 0 .54.061 1.125.09l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C4.911 3.15 8.235 1.215 12 1.215c2.809 0 5.365 1.072 7.286 2.833-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.607-3.582.607M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.212 16.271 1.211 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0"
        />
      </svg>
    ),
  };

  return (
    <motion.button
      onClick={onClick}
      className={`p-3 rounded-lg border ${
        theme === "dark"
          ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {icons[provider]}
    </motion.button>
  );
}
