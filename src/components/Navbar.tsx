/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  FaUser,
  FaSignOutAlt,
  FaCogs,
  FaHome,
  FaRocket,
  FaInfoCircle,
  FaCrown,
  FaSun,
  FaMoon,
  FaDesktop,
} from "react-icons/fa";
import { useTheme } from "@/context/ThemeProvider";
import { useAuthContext } from "@/context/AuthProvider";
import SettingsDialog from "@/myUi/SettingsDialog";
import MySettings from "@/myUi/MySettings";
import useAuth from "@/lib/useAuth";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);


  // Get authentication state from useAuth hook
  const { isAuthenticated, user: authUser, logout, loading: authLoading } = useAuth();

  const [user, setUser] = useState({
    name: "",
    image:
      "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=",
  });
  
  // Get authentication state from AuthContext
  const { isLoggedIn: contextIsLoggedIn, user: contextUser, logout: contextLogout } = useAuthContext();

  // Determine user state combining both auth sources
  const [isLoggedIn, setIsLoggedIn] = useState(false);
 
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // Update local state from authUser when it changes
  useEffect(() => {
    if (!authLoading) {
      if (authUser && isAuthenticated) {
        console.log("Navbar: Setting logged in from useAuth:", authUser);
        setIsLoggedIn(true);
        setUser({
          name: authUser.username || '',
          image: user.image,
        });
      } else if (!isAuthenticated && !contextIsLoggedIn) {
        // Only set logged out if both auth sources are negative
        console.log("Navbar: Setting logged out (both auth sources negative)");
        setIsLoggedIn(false);
      }
    }
  }, [authUser, isAuthenticated, authLoading, contextIsLoggedIn]);
  
  // Update local state from context when it changes
  useEffect(() => {
    if (contextIsLoggedIn && contextUser) {
      console.log("Navbar: Setting logged in from context:", contextUser);
      setIsLoggedIn(true);
      setUser({
        name: contextUser.username || contextUser.name,
        image: contextUser.image || user.image,
      });
    }
  }, [contextIsLoggedIn, contextUser]);

  // Check for token and userData directly
  useEffect(() => {
    const checkLocalStorage = () => {
      if (typeof window !== 'undefined') {
        const hasToken = !!localStorage.getItem('token');
        const hasRefreshToken = !!localStorage.getItem('refreshToken');
        const hasUserData = !!localStorage.getItem('userData');
        const hasAuthToken = !!localStorage.getItem('token');
        
        if ((hasToken || hasRefreshToken || hasUserData || hasAuthToken) && !isLoggedIn) {
          console.log("Navbar: Setting logged in from localStorage");
          setIsLoggedIn(true);
          
          // Try to set user data from localStorage
          try {
            const userDataString = localStorage.getItem('userData');
            if (userDataString) {
              const userData = JSON.parse(userDataString);
              setUser({
                name: userData.username || userData.name || '',
                image: userData.image || user.image,
              });
            }
          } catch (error) {
            console.error("Error parsing userData in Navbar:", error);
          }
        }
      }
    };
    
    checkLocalStorage();
    
    // Listen for storage events
    const handleStorageChange = () => {
      checkLocalStorage();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isLoggedIn, user.image]);

  // ✅ Detect if page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Modified handleLogout to use useAuth's logout
  const handleLogout = async () => {
    try {
      setShowDropdown(false);
      
      // Immediately update local state to reflect logout
      setIsLoggedIn(false);
      setUser({ 
        name: "",
        image: "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs="
      });
      
      // Store current path for potential redirection logic
      const currentPath = pathname;
      const isProtectedRoute = currentPath.includes('/chat') || 
                              currentPath.includes('/dashboard') || 
                              currentPath.includes('/profile') ||
                              currentPath.includes('/settings');
      
      // Show loading toast
      const loadingToast = toast.loading("Signing out...", { 
        style: { background: theme === 'dark' ? '#1F2937' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }
      });
      
      // Try to clear NextAuth session if it exists
      if (typeof window !== 'undefined' && session) {
        try {
          await signOut({ redirect: false })
          .then(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userData");
            localStorage.removeItem("isChat");
          });
        } catch (signOutError) {
          console.warn("NextAuth signOut error (non-critical):", signOutError);
        }
      }
      
      // Use both logout functions to ensure consistent state
      if (contextLogout) {
        await contextLogout(); // Use the context logout if available
      } else {
        await logout(); // Fallback to useAuth logout
      }
      
      // Dismiss loading toast and show success message
      toast.dismiss(loadingToast);
      toast.success("Successfully logged out!", { 
        style: { background: theme === 'dark' ? '#1F2937' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }
      });
      
      // Force update any cached auth state
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
      
      // Let the logout functions handle redirects based on route type
      // We don't need to redirect here as the useAuth/contextLogout will handle it
    } catch (error) {
      console.error("Error logging out:", error);
      
      // Still consider the user logged out locally
      setIsLoggedIn(false);
      setUser({ 
        name: "",
        image: "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs="
      });
      
      // Show error message
      toast.error("There was an issue with logout, but you've been signed out locally.", { 
        style: { background: theme === 'dark' ? '#1F2937' : '#fff', color: theme === 'dark' ? '#fff' : '#000' }
      });
      
      // Redirect based on current route
      const currentPath = pathname;
      const isProtectedRoute = currentPath.includes('/chat') || 
                              currentPath.includes('/dashboard') || 
                              currentPath.includes('/profile') ||
                              currentPath.includes('/settings');
      
      if (isProtectedRoute) {
        router.push('/signin');
      } else {
        router.push('/');
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }

      if (
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowThemeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname === "/signin" || pathname === "/signup" || pathname === "/chat" || pathname.startsWith("/verify-email"))
    return null;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className={`fixed top-0 left-0 w-full py-3 md:py-4 px-4 md:px-6 flex justify-between items-center z-50 transition-all duration-300
        ${
          isScrolled
            ? "bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg border-b border-gray-200 dark:border-gray-800"
            : "bg-white/40 dark:bg-gray-900/40 backdrop-blur-md"
        }`}
      >
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-30 group-hover:opacity-100 blur transition-all duration-300" />
            <motion.span
              className="relative text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              WP.ai
            </motion.span>
          </motion.div>
        </Link>

        {/* Right: Theme & Authentication */}
        <div className="flex gap-3 md:gap-5 items-center relative">
          {/* Theme Dropdown */}
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => {
                setShowThemeDropdown(!showThemeDropdown);
                setShowDropdown(false);
              }}
              className="p-2.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-full hover:shadow-md transition-all duration-300 relative group backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
              ref={buttonRef}
              aria-label="Theme settings"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-50 blur transition duration-300" />
              <div className="relative">
                {theme === "light" && <FaSun className="text-yellow-500 text-xl" />}
                {theme === "dark" && <FaMoon className="text-blue-500 text-xl" />}
                {theme === "system" && <FaDesktop className="text-purple-500 text-xl" />}
              </div>
            </button>

            {/* Theme Dropdown Menu */}
            {showThemeDropdown && (
              <motion.div
                ref={themeDropdownRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80"
              >
                {[
                  { mode: "light", icon: FaSun, label: "Light Mode", color: "text-yellow-500" },
                  { mode: "dark", icon: FaMoon, label: "Dark Mode", color: "text-blue-500" },
                  { mode: "system", icon: FaDesktop, label: "System", color: "text-purple-500" }
                ].map((item) => (
                  <motion.button
                    key={item.mode}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      setTheme(item.mode);
                      setShowThemeDropdown(false);
                    }}
                  >
                    <item.icon className={`${item.color} text-lg`} />
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Authentication */}
          {!isLoggedIn && !isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link href="/signin">
                <motion.button
                  className="relative px-4 md:px-5 py-2 text-sm md:text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition overflow-hidden shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                  <motion.div
                    className="absolute inset-0 bg-white opacity-20"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "linear",
                    }}
                  />
                </motion.button>
              </Link>
            </div>
          ) : (
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  setShowThemeDropdown(false);
                }}
                className="flex items-center gap-2 py-1 px-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-full hover:shadow-md transition-all duration-300 relative group backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
                ref={buttonRef}
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-50 blur transition duration-300" />
                <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-inner">
                  <Image
                    src={user.image || "/placeholder.svg"}
                    alt={user.name || "User"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </div>
                <span className="font-medium text-sm hidden md:block relative">
                  {user.name}
                </span>
              </button>

              {/* User Dropdown Menu with Enhanced Design */}
              {showDropdown && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white/90 dark:bg-gray-800/90 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 backdrop-blur-md"
                >
                  {/* User Info Section */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-700">
                        <Image
                          src={user.image || "/placeholder.svg"}
                          alt={user.name || "User"}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      </div>
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">WordPress Expert</div>
                      </div>
                    </div>
                  </div>

                  {/* Simplified Menu with only requested options */}
                  <motion.div
                    whileHover={{ x: 5, backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.7)' }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-all duration-200"
                    onClick={() => {
                      setIsSettingsOpen(true);
                      setShowDropdown(false);
                    }}
                  >
                    <FaCogs className="text-lg text-gray-600 dark:text-gray-400" />
                    <span className="font-medium">Settings</span>
                  </motion.div>

                  <Link href="/help" onClick={() => setShowDropdown(false)}>
                    <motion.div
                      whileHover={{ x: 5, backgroundColor: theme === 'dark' ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.7)' }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-all duration-200"
                    >
                      <FaInfoCircle className="text-lg text-gray-600 dark:text-gray-400" />
                      <span className="font-medium">Help & Feedback</span>
                    </motion.div>
                  </Link>

                  {/* Logout Button with Enhanced Styling */}
                  <motion.div
                    whileHover={{ x: 5 }}
                    onClick={(e) => {
                      e.preventDefault();
                      try {
                        handleLogout();
                      } catch (error) {
                        console.error("Logout failed:", error);
                        toast.error("Logout failed. Please try again.");
                      }
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-50/80 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer transition-all duration-200 border-t border-gray-200 dark:border-gray-700"
                  >
                    <FaSignOutAlt className="text-lg" />
                    <span className="font-medium">Sign Out</span>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Spacer */}
      <div className="h-16 md:h-20"></div>
      
      {/* Settings Dialog */}
      {isSettingsOpen && (
        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          content={<MySettings />}
        />
      )}
    </>
  );
}