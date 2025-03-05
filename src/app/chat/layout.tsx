/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/chat-comp/Header";
import Sidebar from "@/components/chat-comp/Sidebar";
import { Toaster } from "react-hot-toast";
import { FiSidebar } from "react-icons/fi";
import { useTheme } from "@/context/ThemeProvider";
import Link from "next/link";
import { motion } from "framer-motion";
import "@fontsource/inter";

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
  const { theme } = useTheme();
  const [collapseSidebar, setCollapseSidebar] = useState(false);
  const [ismobileorMedium, setismobileorMedium] = useState(false);

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

  return (
    <div className="flex w-full h-screen overflow-hidden relative">
      {/* Sidebar Overlay for Mobile */}
      {ismobileorMedium && !collapseSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleOutsideClick}
        />
      )}

      {/* Sidebar */}
      <div
        className={`h-full transition-all duration-300 z-50 ${
          ismobileorMedium
            ? `fixed top-0 left-0 h-full bg-gray-800 shadow-lg ${
                collapseSidebar ? "w-0 overflow-hidden" : "w-[290px]"
              }`
            : `${
                collapseSidebar
                  ? "w-0 overflow-hidden"
                  : "w-[300px] md:w-[270px]"
              } ${
                theme === "dark"
                  ? "bg-gray-900/80 backdrop-blur-md shadow-md"
                  : "bg-gray-200/90 border-r border-gray-200"
              }`
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
        {/* Header Section */}
        <div
          className={`w-full relative ${
            theme === "dark" ? "bg-gray-800" : "bg-gray-200"
          }`}
        >
          <div
            className={`flex w-full p-2 ${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-black"
            }`}
          >
            {collapseSidebar && (
              <button
                className="font-bold text-3xl m-2"
                onClick={handleSidebarToggle}
              >
                <FiSidebar />
              </button>
            )}
            <Header />
          </div>
        </div>

        {/* Page Content: Make sure it scrolls */}
        <div className="flex-1 overflow-y-auto pb-2 pt-0 font-inter w-full">
          {children}
        </div>
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: theme === "dark" ? "#000000" : "#ffffff",
            color: theme === "dark" ? "#ffffff" : "#000000",
            padding: "10px",
            fontSize: "16px",
            fontWeight: "bold",
            border: `2px solid ${theme === "dark" ? "#000000" : "#e0e0e0"}`,
          },
        }}
      />
    </div>
  );
}
