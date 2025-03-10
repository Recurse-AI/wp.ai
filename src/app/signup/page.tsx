/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { signIn, getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
import { useTheme } from "@/context/ThemeProvider";
import { motion } from "framer-motion";
import { getUser } from "@/utils/getUser";
import useAuth from "@/lib/useAuth";
import ClientOnly from "@/lib/client-only";
import Link from 'next/link';
import { getToastStyle } from "@/lib/toastConfig";

// Add ExtendedSession type
interface ExtendedSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    provider?: string;
  };
  expires: string;
  accessToken?: string;
  googleProfile?: any;
}

// Password validation regex password must at least 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;

// Interface for form data
interface SignupFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Interface for field errors
interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

// Form validation messages
const VALIDATION_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  PASSWORD_MISMATCH: "Passwords do not match!",
  PASSWORD_WEAK: "Password must be 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character.",
  SIGNUP_SUCCESS: "Account created! Please check your email...",
};

export default function SignUp() {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { register } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<SignupFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", image: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const isAuthenticated = await getUser(setIsLoggedIn, setUser, router, pathname);
        if (isAuthenticated) {
          router.push('/'); // Redirect to home if already logged in
        }
      } catch (error) {
        // Silently handle errors - we expect users not to be logged in here
        console.log("Not logged in, which is expected on signup page");
      }
    };
    
    checkAuthStatus();
  }, [router, pathname]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user types
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Validate password strength
  const isPasswordStrong = (password: string) => {
    return PASSWORD_REGEX.test(password);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Check required fields
    if (!formData.username.trim()) {
      newErrors.username = VALIDATION_MESSAGES.REQUIRED('Username');
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = VALIDATION_MESSAGES.REQUIRED('Email');
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = VALIDATION_MESSAGES.REQUIRED('Password');
      isValid = false;
    } else if (!isPasswordStrong(formData.password)) {
      newErrors.password = VALIDATION_MESSAGES.PASSWORD_WEAK;
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = VALIDATION_MESSAGES.REQUIRED('Password confirmation');
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = VALIDATION_MESSAGES.PASSWORD_MISMATCH;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Form submission handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    
    // Validate form
    if (!validateForm()) {
      // Display first error as toast
      const firstError = Object.values(errors).find(error => error);
      if (firstError) {
        toast.error(firstError, getToastStyle(theme));
      }
      return;
    }

    try {
      setLoading(true);
      
      // Register user
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword
      });
      
      toast.success(VALIDATION_MESSAGES.SIGNUP_SUCCESS, getToastStyle(theme));
      setTimeout(() => router.push("/signin"), 2000);
    } catch (error) {
      const errorObj = error as any;
      let errorMessage = "Sign-up failed. Please try again.";
      
      // Handle structured API errors (e.g. from DRF)
      if (errorObj?.errors) {
        // Extract field-specific errors
        const fieldErrors: FormErrors = {};
        Object.entries(errorObj.errors).forEach(([key, value]) => {
          const messages = Array.isArray(value) ? value : [String(value)];
          fieldErrors[key as keyof FormErrors] = messages[0];
        });
        setErrors(fieldErrors);
        
        // Get the first error for toast
        const firstErrorKey = Object.keys(errorObj.errors)[0];
        const firstErrorValue = errorObj.errors[firstErrorKey];
        errorMessage = Array.isArray(firstErrorValue) 
          ? firstErrorValue[0] 
          : String(firstErrorValue);
      } else if (errorObj?.message) {
        errorMessage = errorObj.message;
      }

      //if data is an object, and there is array of strings, then join them with a new line
      if (errorObj?.data && typeof errorObj.data === 'object' && !Array.isArray(errorObj.data)) {
        errorMessage = Object.values(errorObj.data).join('\n');
      }

      toast.error(errorMessage, {
        duration: 5000,
        icon: '🚨',
        style: {
          backgroundColor: theme === "dark" ? "#333" : "#fff",
          color: theme === "dark" ? "#fff" : "#333",
        },
        position: 'bottom-right',
      });
    } finally {
      setLoading(false);
    }
  };

  // Add handleSocialSignIn function
  const handleSocialSignIn = async (provider: string) => {
    try {
      localStorage.setItem('socialAuthInitiated', 'true');
      localStorage.setItem('authProvider', provider);
      await signIn(provider, { callbackUrl: '/signup' });
    } catch (error: unknown) {
      console.error('Social sign-in error:', error);
      toast.error('Failed to initiate social sign-in', getToastStyle(theme));
    }
  };

  // Add useEffect for social callback handling
  useEffect(() => {
    const handleSocialCallback = async () => {
      const socialAuthInitiated = localStorage.getItem('socialAuthInitiated');
      const authProvider = localStorage.getItem('authProvider');
      const session = await getSession();
      const extendedSession = session as unknown as ExtendedSession;

      console.log('Session Data:', extendedSession);
      console.log('Session User:', extendedSession?.user);
      console.log('Auth Initiated:', socialAuthInitiated);
      console.log('Auth Provider:', authProvider);
      
      // Check if this is a social auth callback
      if (extendedSession?.user && socialAuthInitiated === 'true' && authProvider) {
        console.log('Social Auth Callback Triggered');
        console.log('Full Session Data:', extendedSession);
        
        try {
          // Call your API with social profile data
          const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/users/auth/google/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: extendedSession.user.email,
              image: extendedSession.user.image,
              provider: authProvider,
            }),
          });

          const userData = await response.json();
          console.log('API Response Data:', userData);

          if (!response.ok) {
            throw new Error(`${userData.error}`);
          }
          
          // Save user data and clean up
          localStorage.setItem("userData", JSON.stringify(userData.user));
          localStorage.removeItem('socialAuthInitiated');
          localStorage.removeItem('authProvider');

          localStorage.setItem("token", userData.access);
          
          // Show success message
          toast.success(`Successfully signed up with ${authProvider}!`, getToastStyle(theme));
          
          // Redirect
          if(localStorage.getItem("isChat")){
            localStorage.removeItem("isChat");
            router.push("/chat");
          } else {
            router.push("/");
          }
        } catch (error: unknown) {
          console.error('Social authentication error:', error);
          const errorMessage = error instanceof Error ? error.message.replace(/^Error:\s*/, '') : 'Failed to complete authentication';
          toast.error(errorMessage, getToastStyle(theme));
          localStorage.removeItem('socialAuthInitiated');
          localStorage.removeItem('authProvider');
        }
      }
    };

    handleSocialCallback();
  }, [router, theme]);

  return (
    <ClientOnly>
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
          {/* Left side - Form */}
          <div className={`w-full lg:w-3/5 p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto max-h-[80vh] lg:max-h-none relative ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
            {/* Home Button */}
            <Link
              href="/"
              className={`absolute top-4 right-4 p-3 rounded-lg border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
              } z-50 flex items-center gap-2 transition-all`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </Link>
            
            {/* Logo and heading section */}
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 relative w-16 h-16 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full ${theme === "dark" ? "bg-blue-600" : "bg-blue-500"} opacity-20 blur-md`}></div>
                <div className={`relative flex items-center justify-center w-12 h-12 rounded-full ${theme === "dark" ? "bg-blue-600" : "bg-blue-500"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <h1 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                Create an Account
              </h1>
              <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                Join our community today
              </p>
            </div>

            {/* Main form */}
            <form onSubmit={handleSignUp} className="space-y-5">
              <div className="space-y-1">
                <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  placeholder="Choose a username"
                  className={`w-full p-3 rounded-lg border ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                  } ${errors.username ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'} focus:ring-2 focus:border-transparent transition-all`}
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
                {errors.username && formSubmitted && (
                  <p className="mt-1 text-sm text-red-500">{errors.username}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  className={`w-full p-3 rounded-lg border ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                  } ${errors.email ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'} focus:ring-2 focus:border-transparent transition-all`}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                {errors.email && formSubmitted && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-1">
                <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  className={`w-full p-3 rounded-lg border ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                  } ${errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'} focus:ring-2 focus:border-transparent transition-all`}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                {errors.password && formSubmitted ? (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                ) : (
                  <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                    Must contain 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character
                  </p>
                )}
              </div>
              
              <div className="space-y-1">
                <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  className={`w-full p-3 rounded-lg border ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                  } ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'} focus:ring-2 focus:border-transparent transition-all`}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                {errors.confirmPassword && formSubmitted && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
              
              <motion.button
                type="submit"
                className={`w-full py-3 px-6 mt-2 rounded-lg font-medium text-white relative overflow-hidden
                  ${theme === "dark" 
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500" 
                    : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400"
                  } focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 transition-all`}
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
                {/* Add a subtle animation effect */}
                <motion.div 
                  className="absolute inset-0 bg-white opacity-10"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
              </motion.button>
            </form>
            
            {/* Social Sign-in Buttons */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${theme === "dark" ? "border-gray-600" : "border-gray-300"}`}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-2 ${theme === "dark" ? "bg-gray-800 text-gray-300" : "bg-white text-gray-500"}`}>
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleSocialSignIn('google')}
                  className={`w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialSignIn('github')}
                  className={`w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialSignIn('wordpress')}
                  className={`w-full inline-flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <svg className="w-5 h-5" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.109m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.585-.03-.661.855-.075.885 0 0 .54.061 1.125.09l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C4.911 3.15 8.235 1.215 12 1.215c2.809 0 5.365 1.072 7.286 2.833-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.607-3.582.607M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.212 16.271 1.211 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                Already have an account?{" "}
                <Link href="/signin" className={`font-medium ${theme === "dark" ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-500"}`}>
                  Sign In
                </Link>
              </p>
            </div>
          </div>
          
          {/* Right side - Features and benefits */}
          <div className={`hidden lg:block lg:w-2/5 p-8 lg:p-10 ${theme === "dark" ? "bg-gray-900" : "bg-blue-50"}`}>
            <div className="h-full flex flex-col justify-center">
              <h2 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                Welcome to our platform
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-blue-600" : "bg-blue-100"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${theme === "dark" ? "text-white" : "text-blue-600"}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Premium Content Access</h3>
                    <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Unlock exclusive content and resources</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-blue-600" : "bg-blue-100"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${theme === "dark" ? "text-white" : "text-blue-600"}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Secure Account</h3>
                    <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Your data is encrypted and never shared</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-blue-600" : "bg-blue-100"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${theme === "dark" ? "text-white" : "text-blue-600"}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Community Access</h3>
                    <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Connect with like-minded professionals</p>
                  </div>
                </div>
              </div>
              
              <div className={`mt-8 p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex items-center space-x-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-200`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm italic ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                      "Joining this platform was one of the best decisions I've made. The community and resources are incredible!"
                    </p>
                    <p className={`text-sm font-medium mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-700"}`}>
                      — Sarah Johnson
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
