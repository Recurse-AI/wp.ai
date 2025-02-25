"use client";

import { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/chat-comp/Header";
import Sidebar from "@/components/chat-comp/Sidebar";
import { Toaster } from "react-hot-toast";
import { FiSidebar } from "react-icons/fi";
import { useTheme } from "@/context/ThemeProvider";

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
    <div className={`w-full h-screen overflow-x-hidden overflow-y-hidden ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      <div className="flex h-full min-w-[600px]">
        {/* Sidebar */}
        <div
          className={`font-bold h-full overflow-y-auto transition-all duration-300 ${
            collapseSidebar ? "w-0 overflow-hidden" : "w-[250px] md:w-[220px]"
          } ${theme === "dark" ? "bg-gray-950 text-gray-200" : "bg-gray-100 text-black"}`}
        >
          {!collapseSidebar && (
            <div className="flex flex-row items-center justify-between text-3xl p-4">
              <p className={theme === "dark" ? "text-indigo-400" : "text-indigo-600"}>SideBar</p>
              <button onClick={() => setCollapseSidebar(!collapseSidebar)}>
                <FiSidebar />
              </button>
            </div>
          )}
          <div className="mt-3">
            <Sidebar />
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex flex-col flex-1 h-full overscroll-x-auto relative min-w-[400px] ${theme === "dark" ? "bg-neutral-900 text-gray-200" : "bg-gray-50 text-black"}`}>
          {/* Header Section */}
          <div className={`w-full border-b-2 relative ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-gray-200 border-gray-300"}`}>
            <div className="flex min-w-[600px]">
              {collapseSidebar && (
                <button
                  className="font-bold text-3xl m-2"
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
