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
  const {
    isAuthenticated,
    user: authUser,
    logout,
    loading: authLoading,
  } = useAuth();

  const [user, setUser] = useState({
    name: "",
    image:
      "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=",
  });

  // Get authentication state from AuthContext
  const {
    isLoggedIn: contextIsLoggedIn,
    user: contextUser,
    logout: contextLogout,
  } = useAuthContext();

  // Determine user state combining both auth sources
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);

  // Update local state from authUser when it changes
  useEffect(() => {
    const loadUserData = async () => {
      if (!authLoading) {
        if (authUser && isAuthenticated) {
          console.log("Navbar: Setting logged in from useAuth:", authUser);
          setIsLoggedIn(true);
          setUser({
            name: authUser.username || "",
            image: authUser.profile_picture || user.image,
          });
        } else if (!isAuthenticated && !contextIsLoggedIn) {
          console.log(
            "Navbar: Setting logged out (both auth sources negative)"
          );
          setIsLoggedIn(false);
          setUser({
            name: "",
            image:
              "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=",
          });
        }
      }
    };

    loadUserData();
  }, [authUser, isAuthenticated, authLoading, contextIsLoggedIn]);

  // Update local state from context when it changes
  useEffect(() => {
    if (contextIsLoggedIn && contextUser) {
      console.log("Navbar: Setting logged in from context:", contextUser);
      setIsLoggedIn(true);
      setUser({
        name: contextUser.username || "",
        image: contextUser.image || user.image,
      });
    }
  }, [contextIsLoggedIn, contextUser]);

  // Check for token and userData directly
  useEffect(() => {
    const checkLocalStorage = () => {
      if (typeof window !== "undefined") {
        const hasToken = !!localStorage.getItem("token");
        const hasRefreshToken = !!localStorage.getItem("refreshToken");
        const hasUserData = !!localStorage.getItem("userData");
        const hasAuthToken = !!localStorage.getItem("token");

        if (
          (hasToken || hasRefreshToken || hasUserData || hasAuthToken) &&
          !isLoggedIn
        ) {
          console.log("Navbar: Setting logged in from localStorage");
          setIsLoggedIn(true);

          // Try to set user data from localStorage
          try {
            const userDataString = localStorage.getItem("userData");
            if (userDataString) {
              const userData = JSON.parse(userDataString);
              setUser({
                name: userData.username || "",
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

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
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
      // Show loading toast
      const loadingToast = toast.loading("Signing out...", {
        style: {
          background: theme === "dark" ? "#1F2937" : "#fff",
          color: theme === "dark" ? "#fff" : "#000",
        },
      });

      // Close dropdowns
      setShowDropdown(false);
      setShowThemeDropdown(false);
      setIsSettingsOpen(false);

      // Clear all local storage first
      if (typeof window !== "undefined") {
        localStorage.removeItem("userData");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("isChat");

        // Dispatch storage event to notify other components
        window.dispatchEvent(new Event("storage"));
      }

      // Update local state
      setIsLoggedIn(false);
      setUser({
        name: "",
        image:
          "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=",
      });

      // Call both logout functions to ensure complete logout
      if (contextLogout) {
        await contextLogout();
      }
      await logout();

      // Clear NextAuth session if it exists
      if (session) {
        await signOut({ redirect: false });
      }

      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success("Successfully signed out!", {
        style: {
          background: theme === "dark" ? "#1F2937" : "#fff",
          color: theme === "dark" ? "#fff" : "#000",
        },
      });

      // Redirect based on current route without adding reason parameter
      const currentPath = pathname;
      const isProtectedRoute =
        currentPath.includes("/chat") ||
        currentPath.includes("/dashboard") ||
        currentPath.includes("/profile") ||
        currentPath.includes("/settings");

      // Small delay to ensure state updates are processed
      setTimeout(() => {
        if (isProtectedRoute) {
          router.replace("/signin");
        } else {
          router.replace("/");
        }
      }, 100);
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to sign out. Please try again.", {
        style: {
          background: theme === "dark" ? "#1F2937" : "#fff",
          color: theme === "dark" ? "#fff" : "#000",
        },
      });

      // Even if API call fails, clear local state
      setIsLoggedIn(false);
      setUser({
        name: "",
        image:
          "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=",
      });
    }
  };

  // Force check auth state on mount and route change
  useEffect(() => {
    const checkAuthState = () => {
      const hasToken = !!localStorage.getItem("token");
      const hasUserData = !!localStorage.getItem("userData");

      if (!hasToken && !hasUserData) {
        setIsLoggedIn(false);
        setUser({
          name: "",
          image:
            "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=",
        });
      }
    };

    checkAuthState();
  }, [pathname]);

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
        themeButtonRef.current &&
        !themeButtonRef.current.contains(event.target as Node)
      ) {
        setShowThemeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/chat" ||
    pathname.startsWith("/verify-email")
  )
    return null;

  return (
    <>
      <motion.nav
        initial={{ y: 0 }}
        className={`fixed top-0 left-0 w-full py-3 md:py-4 px-4 md:px-6 flex justify-between items-center z-50 transition-all duration-300
        ${
          !isScrolled
            ? "bg-[#F8FAFC]/80 dark:bg-[#0A0F1C]/90 backdrop-blur-xl shadow-lg border-b border-gray-200 dark:border-gray-800"
            : "bg-[#F8FAFC]/40 dark:bg-[#0A0F1C]/40 backdrop-blur-md"
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
          {/* Authentication */}
          {!isLoggedIn && !isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Theme Button */}
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
                  className="p-2.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-full hover:shadow-md transition-all duration-300 relative group backdrop-blur-sm"
                  aria-label="Theme settings"
                  ref={themeButtonRef}
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
                    className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-800/80"
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
            <div className="flex items-center gap-3">
              {/* Theme Button */}
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
                  className="p-2.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-full hover:shadow-md transition-all duration-300 relative group backdrop-blur-sm"
                  aria-label="Theme settings"
                  ref={themeButtonRef}
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
                    className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-800/80"
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
              
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <Image
                    src={user.image}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full aspect-square object-cover"
                  />
                  <span className="hidden md:inline">{user.name}</span>
                </button>

                {showDropdown && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
                  >
                    {/* User Info Section */}
                    <div className="p-4 bg-gray-50/80 dark:bg-gray-700/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden shadow-inner">
                          <Image
                            src={user.image || "/placeholder.svg"}
                            alt={user.name || "User"}
                            width={40}
                            height={40}
                            className="rounded-full aspect-square object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold">{user.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            WordPress Developer
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 group"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                          <FaUser className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Profile</span>
                      </Link>

                      {/* About and Pricing section */}
                      <Link
                        href="/about"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 group"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200">
                          <FaInfoCircle className="w-4 h-4" />
                        </div>
                        <span className="font-medium">About</span>
                      </Link>

                      <Link
                        href="/pricing"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 group"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white transition-all duration-200">
                          <FaCrown className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Pricing</span>
                      </Link>

                      <button
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 group"
                      >
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200">
                          <FaCogs className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Settings</span>
                      </button>

                      <div className="h-px bg-gray-200 dark:bg-gray-700/70 my-1 mx-3"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 group"
                      >
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-all duration-200">
                          <FaSignOutAlt className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300">Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.nav>

      {/* Spacer */}
      <div className="h-14 md:h-16"></div>

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
