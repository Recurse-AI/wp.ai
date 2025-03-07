/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/chat-comp/Sidebar";
import { FiSidebar, FiChevronDown } from "react-icons/fi";
import { useTheme } from "@/context/ThemeProvider";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import "@fontsource/inter";
import { useRouter } from "next/navigation";
import { 
  FaSun, 
  FaMoon, 
  FaDesktop, 
  FaUser,
  FaSignOutAlt,
  FaCog
} from "react-icons/fa";
import { SiOpenai, SiClaude, SiGooglegemini } from "react-icons/si";
import useAuth from "@/lib/useAuth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [collapseSidebar, setCollapseSidebar] = useState(false);
  const [ismobileorMedium, setismobileorMedium] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Header state
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  
  // Refs for dropdowns
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth < 975;
      setismobileorMedium(isNowMobile);

      if (!isNowMobile) {
        // Retrieve sidebar state from localStorage only on desktop
        const savedSidebarState = localStorage.getItem("sidebarState");
        setCollapseSidebar(savedSidebarState === "true");
      } else {
        // Always collapse sidebar on mobile after a refresh
        setCollapseSidebar(true);
      }
    };

    // Set initial state from localStorage on mount
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if user is logged in
  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
    }
  }, []);

  // Add listener for agent mode changes
  useEffect(() => {
    const checkAgentMode = () => {
      const savedAgentMode = localStorage.getItem('selectedAgentMode');
      
      if (savedAgentMode === 'agent') {
        setAgentMode(true);
      
      } else {
        setAgentMode(false);
        // Reset manual toggle marker when exiting agent mode
        localStorage.removeItem("userManuallyOpened");
      }
    };

    // Initial check - but don't set up the recurring check
    checkAgentMode();

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedAgentMode') {
        checkAgentMode();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [collapseSidebar]); // Add collapseSidebar as dependency to react to its changes

  // Add effect to close sidebar when agent mode is active
  useEffect(() => {
    // Only run this when agent mode becomes true
    if (agentMode) {
      const userManuallyOpened = localStorage.getItem("userManuallyOpened") === "true";
      
      // Only auto-close sidebar if user hasn't manually opened it
      if (!userManuallyOpened) {
        setCollapseSidebar(true);
      }
    }
  }, [agentMode]);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close Profile Dropdown if clicked outside
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowDropdown(false), 100);
      }

      // Close Theme Dropdown if clicked outside
      if (
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(event.target as Node) &&
        themeButtonRef.current &&
        !themeButtonRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowThemeDropdown(false), 100);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle sidebar and save state
  const handleSidebarToggle = () => {
    const newState = !collapseSidebar;
    setCollapseSidebar(newState);
    localStorage.setItem("sidebarState", newState.toString()); // Save state
  };

  // Close sidebar when clicking outside (on mobile)
  const handleOutsideClick = () => {
    if (ismobileorMedium && !collapseSidebar) {
      setCollapseSidebar(true);
      localStorage.setItem("sidebarState", "false"); // Save state as collapsed
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setShowDropdown(false);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/logout/`, {
        method: "GET",
        credentials: "include",
      });
      await signOut({ redirect: false });
      setIsLoggedIn(false);
      router.push("/chat");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="flex w-full h-screen overflow-hidden relative">
      {/* Sidebar Overlay for Mobile */}
      {ismobileorMedium && !collapseSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleOutsideClick}
        />
      )}

      {/* Sidebar - Collapse when in agent mode */}
      <div
        className={`h-full transition-all duration-300 z-50 ${
          collapseSidebar
            ? "w-0 overflow-hidden"
            : ismobileorMedium
              ? "fixed top-0 left-0 h-full w-[290px]"
              : "w-[300px] md:w-[270px]"
        } ${
          theme === "dark"
            ? "bg-gray-800/90 backdrop-blur-md shadow-md"
            : "bg-gray-100/95 border-r border-gray-200"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex flex-row items-center justify-between text-3xl p-4">
          <Link href="/" className="flex items-center gap-2">
            <motion.span
              className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              WP.ai
            </motion.span>
          </Link>
          <button onClick={handleSidebarToggle}>
            <FiSidebar />
          </button>
        </div>

        {/* Sidebar Content */}
        {!collapseSidebar && (
          <Sidebar
            onClose={() => {
              if (ismobileorMedium) {
                setCollapseSidebar(true);
                localStorage.setItem("sidebarState", "true");
              }
            }}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-full w-full relative overflow-hidden">
        {/* Simplified Header - No Background */}
        <div className="w-full relative">
          <div className="flex justify-between items-center w-full px-4 py-3">
            {/* Left: Sidebar toggle */}
            <div className="flex items-center space-x-3">
              {collapseSidebar && (
                <button className="text-2xl mr-2" onClick={handleSidebarToggle}>
                  <FiSidebar />
                </button>
              )}
            </div>
            
            {/* Right: Theme & Profile only */}
            <div className="flex items-center gap-3">
              {/* Theme Dropdown Button */}
              <div className="relative">
                <button
                  ref={themeButtonRef} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThemeDropdown((prev) => !prev);
                    setShowDropdown(false);
                  }}
                  className="p-2.5 bg-gray-100/80 dark:bg-gray-700/80 rounded-full hover:shadow-md transition-all duration-300 relative group backdrop-blur-sm"
                  aria-label="Theme settings"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-50 blur transition duration-300" />
                  <div className="relative">
                    {theme === "light" && <FaSun className="text-yellow-500 text-xl" />}
                    {theme === "dark" && <FaMoon className="text-blue-500 text-xl" />}
                    {theme === "system" && <FaDesktop className="text-purple-500 text-xl" />}
                  </div>
                </button>

                {/* Theme Selection Dropdown */}
                {showThemeDropdown && (
                  <motion.div
                    ref={themeDropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-44 bg-white/95 dark:bg-gray-700/95 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600 backdrop-blur-sm"
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
                          setTheme(item.mode as any);
                          setShowThemeDropdown(false);
                        }}
                      >
                        <item.icon className={`${item.color} text-lg`} />
                        <span className="font-medium">{item.label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Profile - Simplified to just circle image */}
              {!isLoggedIn ? (
                <div className="flex space-x-3">
                  <Link href="/signin">
                    <motion.button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition overflow-hidden text-sm font-medium"
                      whileHover={{ scale: 1.03 }}
                      onClick={() => localStorage.setItem("isChat", "true")}
                    >
                      Sign In
                    </motion.button>
                  </Link>
                </div>
              ) : (
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown((prev) => !prev);
                    setShowThemeDropdown(false);
                  }}
                  className="relative h-10 w-10 rounded-full overflow-hidden shadow-inner hover:shadow-md transition-all duration-300"
                >
                  <Image
                    src={user?.profile_picture || "/placeholder.svg"}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </button>

                {/* User Dropdown Menu - Simplified */}
                {showDropdown && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-gray-700/95 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600 backdrop-blur-sm"
                  >
                    {/* Menu Options */}
                    <div>
                      <Link href="/profile">
                        <motion.div
                          whileHover={{ x: 5 }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <FaUser className="text-gray-500" />
                          <span>My Profile</span>
                        </motion.div>
                      </Link>
                      <Link href="/settings">
                        <motion.div
                          whileHover={{ x: 5 }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <FaCog className="text-gray-500" />
                          <span>Settings</span>
                        </motion.div>
                      </Link>
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={handleLogout}
                      >
                        <FaSignOutAlt className="text-red-500" />
                        <span className="text-red-500">Sign Out</span>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content: Make sure it scrolls */}
        <div className="flex-1 overflow-y-auto pb-2 pt-0 font-inter w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
