/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef, createContext, useContext } from "react";
import Sidebar from "@/components/chat-comp/Sidebar";
import { FiSidebar, FiSettings, FiLogOut } from "react-icons/fi";
import { FaSun, FaMoon, FaDesktop } from "react-icons/fa";
import Link from "next/link";
import { motion } from "framer-motion";
import "@fontsource/inter";
import { ChatSocketProvider } from "@/context/ChatSocketContext";

// Create a context for sidebar functionality
export interface SidebarContextType {
  collapseSidebar: boolean;
  toggleSidebar: () => void;
}

export const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Custom hook to use the sidebar context
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapseSidebar, setCollapseSidebar] = useState(false);
  const [ismobileorMedium, setismobileorMedium] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth < 975;
      setismobileorMedium(isNowMobile);

      if (!isNowMobile) {
        // Retrieve sidebar state from localStorage only on desktop
        const savedSidebarState = typeof window !== 'undefined' ? localStorage.getItem("sidebarState") : null;
        setCollapseSidebar(savedSidebarState === "true");
      } else {
        // Always collapse sidebar on mobile after a refresh
        setCollapseSidebar(true);
      }
    };

    // Set initial state from localStorage on mount
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener("resize", handleResize);
      
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Toggle sidebar and save state
  const handleSidebarToggle = () => {
    const newState = !collapseSidebar;
    setCollapseSidebar(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem("sidebarState", newState.toString()); // Save state
    }
  };

  // Close sidebar when clicking outside (on mobile)
  const handleOutsideClick = () => {
    if (ismobileorMedium && !collapseSidebar) {
      setCollapseSidebar(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem("sidebarState", "false"); // Save state as collapsed
      }
    }
  };

  // Create the context value to provide to children
  const sidebarContextValue: SidebarContextType = {
    collapseSidebar,
    toggleSidebar: handleSidebarToggle,
  };

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <ChatSocketProvider>
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
              } ${"bg-gray-100/90 backdrop-blur-sm dark:bg-gray-900/80 dark:backdrop-blur-sm border-r border-gray-200/20 dark:border-gray-800/20"}`}
              style={{
                contain: 'layout',
                willChange: 'transform',
                transform: 'translateZ(0)'
              }}
            >
              {/* Sidebar Header */}
              <div className="flex flex-row items-center justify-between text-3xl p-4">
                <Link href="/" className="flex items-center gap-2">
                  <motion.span
                    className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    } as any}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      backgroundSize: "200% 200%",
                    } as any}
                  >
                    WP.ai
                  </motion.span>
                </Link>
                <button 
                  onClick={handleSidebarToggle} 
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Toggle sidebar"
                >
                  <FiSidebar className="text-gray-600 dark:text-gray-300" size={20} />
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
            <div className="flex flex-col flex-1 h-full w-full relative overflow-hidden bg-grid-light dark:bg-grid-dark"
              style={{
                contain: 'layout',
                willChange: 'transform',
                transform: 'translateZ(0)'
              }}
            >
              {/* Header with only necessary elements */}
              <div className="w-full relative flex justify-between items-center bg-transparent"
                style={{
                  contain: 'layout',
                  willChange: 'transform',
                  transform: 'translateZ(0)',
                  zIndex: 99999,
                }}
              >
                {/* Left: Sidebar toggle only */}
                <div className="flex-grow-0 absolute top-2 left-2" >
                  {collapseSidebar && (
                    <button 
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" 
                      onClick={handleSidebarToggle}
                      aria-label="Toggle sidebar"
                    >
                      <FiSidebar className="text-gray-600 dark:text-gray-300" size={20} style={{ zIndex: 99999 }} />
                    </button>
                  )}
                </div>
              </div>

              {/* Page Content: Make sure it scrolls with custom scrollbar */}
              <div className="flex-1 overflow-hidden pb-2 pt-0 font-inter w-full">
                {children}
              </div>
            </div>
          </div>
      </ChatSocketProvider>
    </SidebarContext.Provider>
  );
}
