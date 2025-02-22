"use client";

import { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/chat-comp/Header";
import Sidebar from "@/components/chat-comp/Sidebar";
import { Toaster } from "react-hot-toast";
import { FiSidebar } from "react-icons/fi";

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
    <div className="w-full h-screen overflow-x-auto overflow-y-hidden">
      <div className="flex h-full min-w-[600px]">
        {/* Sidebar */}
        <div
          className={`bg-gray-950 text-gray-200 font-bold h-full overflow-y-auto transition-all duration-300 
          ${collapseSidebar ? "w-0 overflow-hidden" : "w-[250px] md:w-[220px]"}`}
        >
          {!collapseSidebar && (
            <div className="flex flex-row items-center justify-between text-3xl p-4">
              <p className="text-indigo-600">SideBar</p>
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
        <div className="flex flex-col flex-1 bg-neutral-900 h-full overscroll-x-auto text-gray-200 relative min-w-[400px]">
          {/* Header Section */}
          <div className="w-full bg-gray-900 border-b-2 border-gray-900 relative">
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
            background: "#000000",
            color: "#ffffff",
            padding: "10px",
            fontSize: "16px",
            fontWeight: "bold",
            border: "2px solid #000000",
          },
        }}
      />
    </div>
  );
}
