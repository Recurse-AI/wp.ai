"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getUser } from "@/utils/getUser";
import { toast, Toaster } from "react-hot-toast";
import { useTheme } from "@/context/ThemeProvider";
import { motion } from "framer-motion";
import useAuth from "@/lib/useAuth";
import ClientOnly from "@/lib/client-only";
import Link from 'next/link';
import { getToastStyle } from "@/lib/toastConfig";
import { useAuthContext } from "@/context/AuthProvider";

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
  INVALID_CREDENTIALS: "Invalid username or password",
  LOGIN_SUCCESS: "Login successful! Redirecting...",
};

export default function SignIn() {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { login, error: authError } = useAuth();
  const { data: session } = useSession();
  const { setUserData } = useAuthContext();
  
  // Form state
  const [formData, setFormData] = useState<SignInFormData>({
    login: "",
    password: "",
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
        console.log("Not logged in, which is expected on signin page");
      }
    };
    
    checkAuthStatus();
  }, [router, pathname]);

  useEffect(() => {
    const authenticateUser = async () => {
      if (session?.user?.name) {
        try {
          console.log("🔹 Calling Backend API /authLogin...");
          const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/login-auth/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: session.user.email,
              name: session.user.name,
              image: session.user.image,
              // @ts-ignore - provider is added by our custom NextAuth config
              provider: session.user.provider,
            }),
            credentials: "include",
          });

          if (response.ok) {
            console.log("🔹 Backend API responded successfully.");
            const data = await response.json();
            localStorage.setItem("authToken", data.jwt); // Save backend token
            toast.success("You are logged in now!", getToastStyle(theme));
            if(localStorage.getItem("isChat")){
              localStorage.removeItem("isChat");
              router.push("/chat");
            }
            else router.push("/");
            setIsLoggedIn(true);
          } else {
            console.error("❌ Backend /authLogin API failed");
            toast.error("Authentication failed", getToastStyle(theme));
          }
        } catch (err) {
          console.error("❌ Error calling /authLogin:", err);
          toast.error("Connection error. Please try again.", getToastStyle(theme));
        }
      }
    };

    authenticateUser();
  }, [session, router, theme]);

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

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Check required fields
    if (!formData.login.trim()) {
      newErrors.login = VALIDATION_MESSAGES.REQUIRED('Username or Email');
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = VALIDATION_MESSAGES.REQUIRED('Password');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignIn = async (e: React.FormEvent) => {
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

    setLoading(true);

    try {
      // Using the auth service for login
      const user = await login({
        login: formData.login,
        password: formData.password
      });
      
      // Save user data to localStorage for immediate access across components
      if (user) {
        const userData = {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            full_name: `${user.first_name} ${user.last_name}`.trim()
          },
          profile_pic: user.profile_picture || ""
        };
        
        localStorage.setItem("userData", JSON.stringify(userData));
        
        // Update the auth context with the new user data
        setUserData(userData);
      }
      
      toast.success(VALIDATION_MESSAGES.LOGIN_SUCCESS, getToastStyle(theme));
      
      if(localStorage.getItem("isChat")){
        localStorage.removeItem("isChat");
        router.push("/chat");
      } else {
        router.push("/");
      }
    } catch (error) {
      const errorObj = error as any;
      let errorMessage = VALIDATION_MESSAGES.INVALID_CREDENTIALS;
      
      // Handle structured API errors
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
        setErrors({ general: errorMessage });
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
          <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full ${theme === "dark" ? "bg-indigo-900" : "bg-indigo-200"} opacity-20 blur-3xl`}></div>
          <div className={`absolute bottom-0 right-1/4 w-96 h-96 rounded-full ${theme === "dark" ? "bg-blue-800" : "bg-blue-200"} opacity-20 blur-3xl`}></div>
        </div>
        
        {/* Content */}
        <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row rounded-xl shadow-2xl overflow-hidden">
          {/* Left side - Illustration/Feature list (hidden on mobile) */}
          <div className={`hidden lg:block lg:w-2/5 p-10 ${theme === "dark" ? "bg-gray-900" : "bg-blue-50"}`}>
            <div className="h-full flex flex-col justify-center">
              <h2 className={`text-2xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                Welcome Back
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-indigo-600" : "bg-indigo-100"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${theme === "dark" ? "text-white" : "text-indigo-600"}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Secure Login</h3>
                    <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Your account is protected with industry-standard security</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-indigo-600" : "bg-indigo-100"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${theme === "dark" ? "text-white" : "text-indigo-600"}`} viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Privacy First</h3>
                    <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>We never share your personal information</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-indigo-600" : "bg-indigo-100"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${theme === "dark" ? "text-white" : "text-indigo-600"}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-800"}`}>Instant Access</h3>
                    <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Access your account and content immediately</p>
                  </div>
                </div>
              </div>
              
              <div className={`mt-12 p-5 rounded-lg relative overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
                <div className={`absolute top-0 left-0 w-2 h-full ${theme === "dark" ? "bg-indigo-500" : "bg-indigo-500"}`}></div>
                <p className={`text-base italic ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                  "We're excited to have you back. Your personalized experience is waiting for you."
                </p>
              </div>
            </div>
          </div>
          
          {/* Right side - Form */}
          <div className={`w-full lg:w-3/5 p-6 lg:p-10 ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
            {/* Logo and heading section */}
            <div className="text-center mb-8">
              <div className="mx-auto mb-4 relative w-16 h-16 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full ${theme === "dark" ? "bg-indigo-600" : "bg-indigo-500"} opacity-20 blur-md`}></div>
                <div className={`relative flex items-center justify-center w-12 h-12 rounded-full ${theme === "dark" ? "bg-indigo-600" : "bg-indigo-500"}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v-1l1-1 1-1-0.257-0.257A6 6 0 1118 8zm-6-4a1 1 0 100 2h2a1 1 0 100-2h-2z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <h1 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"}`}>
                Welcome Back
              </h1>
              <p className={`text-sm mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
                Sign in to continue to your account
              </p>
            </div>

            {/* Main form */}
            <form onSubmit={handleSignIn} className="space-y-5">
              {errors.general && formSubmitted && (
                <div className={`p-3 rounded-md ${theme === "dark" ? "bg-red-900/30 text-red-200" : "bg-red-50 text-red-600"} text-sm`}>
                  {errors.general}
                </div>
              )}
              
              <div className="space-y-1">
                <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  Username or Email
                </label>
                <input
                  type="text"
                  name="login"
                  placeholder="Enter your username or email"
                  className={`w-full p-3 rounded-lg border ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                  } ${errors.login ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'} focus:ring-2 focus:border-transparent transition-all`}
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
                  <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                    Password
                  </label>
                  <Link href="/forgot-password" className={`text-xs font-medium ${theme === "dark" ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-500"}`}>
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  className={`w-full p-3 rounded-lg border ${
                    theme === "dark" 
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" 
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500"
                  } ${errors.password ? 'border-red-500 focus:ring-red-500' : 'focus:ring-indigo-500'} focus:ring-2 focus:border-transparent transition-all`}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                {errors.password && formSubmitted && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              
              <motion.button
                type="submit"
                className={`w-full py-3 px-6 mt-2 rounded-lg font-medium text-white relative overflow-hidden
                  ${theme === "dark" 
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500" 
                    : "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400"
                  } focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-50 transition-all`}
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
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
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
                Don't have an account?{" "}
                <Link href="/signup" className={`font-medium ${theme === "dark" ? "text-indigo-400 hover:text-indigo-300" : "text-indigo-600 hover:text-indigo-500"}`}>
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Toaster component to ensure toast notifications appear */}
      <Toaster position="bottom-right" reverseOrder={false} />
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
