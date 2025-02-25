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

  useEffect(() => {
    const handleResize = () => {
      setCollapseSidebar(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={`w-full h-screen overflow-x-hidden overflow-y-hidden
    `}>
      <div className="flex h-full min-w-[600px]">
        {/* Sidebar */}
        <div
          className={`font-bold h-full overflow-y-auto transition-all duration-300 ${
            collapseSidebar ? "w-0 overflow-hidden" : "w-[350px] md:w-[250px]"
          }`}
        >
          {!collapseSidebar && (
            <div
              className={`flex flex-row items-center justify-between text-3xl p-4
             ${
               theme === "dark"
                 ? "bg-gray-800 text-white"
                 : "bg-gray-200 border-r border-gray-200"
             }`}
            >
              {/* <p className={theme === "dark" ? "text-indigo-400" : "text-indigo-600"}>SideBar</p> */}
              <Link href="/" className={`flex items-center gap-2 `}>
                <motion.span
                  className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"], // Moves the gradient left-right
                  }}
                  transition={{
                    duration: 4, // Duration of one cycle
                    repeat: Infinity, // Infinite loop
                    ease: "linear", // Smooth transition
                  }}
                  style={{
                    backgroundSize: "200% 200%", // Increases gradient size for smooth flow
                  }}
                >
                  WP.ai
                </motion.span>
              </Link>
              <button onClick={() => setCollapseSidebar(!collapseSidebar)}>
                <FiSidebar />
              </button>
            </div>
          )}
          <div className="">
            <Sidebar />
          </div>
        </div>

        {/* Main Content */}
        <div
          className={`flex flex-col flex-1 h-full overscroll-x-auto relative min-w-[400px] 
            ${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-black"
            }`}
        >
          {/* Header Section */}
          <div
            className={`w-full relative ${
              theme === "dark"
                ? "bg-gray-800"
                : "bg-gray-200"
            }`}
          >
            <div className={`flex min-w-[600px] ${
                    theme === "dark"
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-black"
                  }`}>
              {collapseSidebar && (
                <button
                  className={`font-bold text-3xl m-2`}
                  onClick={() => setCollapseSidebar(!collapseSidebar)}
                >
                  <FiSidebar />
                </button>
              )}
              {/* Header */}
              <Header />
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 overflow-hidden p-4">{children}</div>
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
