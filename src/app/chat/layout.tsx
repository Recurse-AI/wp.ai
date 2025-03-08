/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/chat-comp/Sidebar";
import { FiSidebar, FiSettings, FiLogOut } from "react-icons/fi";
import { FaSun, FaMoon, FaDesktop } from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";
import "@fontsource/inter";
import { useRouter } from "next/navigation";
import useAuth from "@/lib/useAuth";
import Image from "next/image";
import { useTheme } from "@/context/ThemeProvider";
import { toast } from "react-hot-toast";

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
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [collapseSidebar, setCollapseSidebar] = useState(false);
  const [ismobileorMedium, setismobileorMedium] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLDivElement>(null);
  
  // Agent mode state
  const [agentMode, setAgentMode] = useState(false);

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
      setIsAuthenticated(true);
    }
  }, [user]);

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

  // Handle click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current && 
        !userDropdownRef.current.contains(event.target as Node) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    // Implement your logout logic here
    console.log("Logging out...");
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    // Redirect to home page
    router.push("/");
  };

  // Open settings modal
  const openSettings = () => {
    setShowSettingsModal(true);
    setShowUserDropdown(false);
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

      {/* Sidebar - No border */}
      <div
        className={`h-full transition-all duration-300 z-50 ${
          collapseSidebar
            ? "w-0 overflow-hidden"
            : ismobileorMedium
              ? "fixed top-0 left-0 h-full w-[290px]"
              : "w-[300px] md:w-[270px]"
        } ${"bg-gray-100/95 dark:bg-gray-800/90 dark:backdrop-blur-md"}`}
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
        {/* Header with only necessary elements */}
        <div className="w-full relative flex justify-between items-center">
          {/* Left: Sidebar toggle only */}
          <div className="flex-grow-0">
            {collapseSidebar && (
              <button className="text-2xl m-2" onClick={handleSidebarToggle}>
                <FiSidebar />
              </button>
            )}
          </div>
          
          {/* Right: Auth profile/sign in button - ensure it's on the right */}
          <div className="ml-auto mr-4 mt-2 flex items-center gap-3">
            {/* Share Link Button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <button
                onClick={() => {
                  // Get the current URL
                  const url = window.location.href;
                  
                  // Copy to clipboard
                  navigator.clipboard.writeText(url)
                    .then(() => {
                      toast.success("Chat link copied to clipboard!", {
                        style: {
                          borderRadius: '10px',
                          background: theme === 'dark' ? '#333' : '#fff',
                          color: theme === 'dark' ? '#fff' : '#333',
                        },
                      });
                    })
                    .catch((err) => {
                      console.error('Failed to copy: ', err);
                      toast.error("Failed to copy link");
                    });
                }}
                className="p-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-full hover:shadow-md transition-all duration-300 relative group backdrop-blur-sm"
                aria-label="Copy chat link"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-50 blur transition duration-300" />
                <div className="relative">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-blue-500"
                  >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
              </button>
            </motion.div>

            {!isAuthenticated ? (
              <Link href="/signin">
                <motion.button
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition overflow-hidden text-sm font-medium"
                  whileHover={{ scale: 1.03 }}
                  onClick={() => localStorage.setItem("isChat", "true")}
                >
                  Sign In
                </motion.button>
              </Link>
            ) : (
              <div className="relative" ref={userButtonRef}>
                <div 
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Image
                    src={user?.profile_picture || "/placeholder.svg"}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-gray-200 dark:border-gray-700"
                  />
                </div>
                
                {/* User Profile Dropdown */}
                {showUserDropdown && (
                  <motion.div
                    ref={userDropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 z-50"
                  >
                    {/* User Info */}
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <Image
                          src={user?.profile_picture || "/placeholder.svg"}
                          alt="Profile"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div>
                          <p className="font-medium">{user?.username || 'User'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || ''}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items */}
                    <div className="py-1">
                      {/* Settings Option */}
                      <button
                        onClick={openSettings}
                        className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <FiSettings className="text-gray-500" />
                        <span>Settings</span>
                      </button>
                      
                      {/* Theme Options */}
                      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Theme</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTheme("light")}
                            className={`p-2 rounded-full ${theme === "light" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-700"}`}
                          >
                            <FaSun className="text-yellow-500 text-sm" />
                          </button>
                          <button
                            onClick={() => setTheme("dark")}
                            className={`p-2 rounded-full ${theme === "dark" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-700"}`}
                          >
                            <FaMoon className="text-blue-500 text-sm" />
                          </button>
                          <button
                            onClick={() => setTheme("system")}
                            className={`p-2 rounded-full ${theme === "system" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-700"}`}
                          >
                            <FaDesktop className="text-purple-500 text-sm" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Logout Option */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-200 dark:border-gray-700"
                      >
                        <FiLogOut />
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Settings</h2>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Theme Settings */}
                <div>
                  <h3 className="font-medium mb-2">Theme</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTheme("light")}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg ${
                        theme === "light" 
                          ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700" 
                          : "bg-gray-100 dark:bg-gray-700 border border-transparent"
                      }`}
                    >
                      <FaSun className="text-yellow-500 text-xl" />
                      <span className="text-sm">Light</span>
                    </button>
                    <button
                      onClick={() => setTheme("dark")}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg ${
                        theme === "dark" 
                          ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700" 
                          : "bg-gray-100 dark:bg-gray-700 border border-transparent"
                      }`}
                    >
                      <FaMoon className="text-blue-500 text-xl" />
                      <span className="text-sm">Dark</span>
                    </button>
                    <button
                      onClick={() => setTheme("system")}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg ${
                        theme === "system" 
                          ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700" 
                          : "bg-gray-100 dark:bg-gray-700 border border-transparent"
                      }`}
                    >
                      <FaDesktop className="text-purple-500 text-xl" />
                      <span className="text-sm">System</span>
                    </button>
                  </div>
                </div>
                
                {/* Other settings can be added here */}
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Page Content: Make sure it scrolls with custom scrollbar */}
        <div className="flex-1 overflow-y-auto pb-2 pt-0 font-inter w-full custom-scrollbar">
          <style jsx global>{`
            /* Custom scrollbar styling */
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(156, 163, 175, 0.5);
              border-radius: 20px;
              border: 2px solid transparent;
              background-clip: content-box;
            }
            
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: rgba(156, 163, 175, 0.7);
            }
            
            /* For Firefox */
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
            }
            
            /* Dark mode adjustments */
            .dark .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: rgba(75, 85, 99, 0.5);
            }
            
            .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: rgba(75, 85, 99, 0.7);
            }
            
            .dark .custom-scrollbar {
              scrollbar-color: rgba(75, 85, 99, 0.5) transparent;
            }
          `}</style>
          {children}
        </div>
      </div>
    </div>
  );
}
