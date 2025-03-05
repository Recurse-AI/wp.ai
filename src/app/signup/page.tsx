/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { signIn } from "next-auth/react";
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
      console.log(error);
      
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
      
      toast.error(errorMessage, getToastStyle(theme));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientOnly>
      <div className="flex min-h-screen w-full">
        {/* Background elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full ${theme === "dark" ? "bg-blue-900" : "bg-blue-200"} opacity-20 blur-3xl`}></div>
          <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full ${theme === "dark" ? "bg-indigo-800" : "bg-indigo-200"} opacity-20 blur-3xl`}></div>
        </div>
        
        {/* Content */}
        <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row rounded-xl shadow-2xl overflow-hidden">
          {/* Left side - Form */}
          <div className={`w-full lg:w-3/5 p-6 lg:p-10 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
            {/* Logo and heading section */}
            <div className="text-center mb-8">
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
            
            <div className="mt-8">
              <div className="flex items-center justify-center space-x-2 mb-6">
                <div className={`h-px flex-1 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
                <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Or continue with</p>
                <div className={`h-px flex-1 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}></div>
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <SocialButton 
                  provider="google" 
                  theme={theme} 
                  onClick={() => signIn('google', { callbackUrl: '/auth/callback' })}
                />
                <SocialButton 
                  provider="github" 
                  theme={theme} 
                  onClick={() => signIn('github', { callbackUrl: '/auth/callback' })}
                />
                <SocialButton 
                  provider="facebook" 
                  theme={theme} 
                  onClick={() => signIn('facebook', { callbackUrl: '/auth/callback' })}
                />
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
          
          {/* Right side - Illustration/Feature list */}
          <div className={`hidden lg:block lg:w-2/5 p-10 ${theme === "dark" ? "bg-gray-900" : "bg-blue-50"}`}>
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

interface SocialButtonProps {
  provider: "google" | "github" | "facebook";
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
    facebook: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        />
      </svg>
    )
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
