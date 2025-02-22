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

  // Detect screen size change
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapseSidebar(true);
      } else {
        setCollapseSidebar(false);
      }
    };
    // Set initial state based on screen size
    handleResize();

    // Attach resize event listener
    window.addEventListener("resize", handleResize);

    // Cleanup event listener on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const marginLeftClass = collapseSidebar ? "ml-10" : "ml-2";

  return (
    <div className="antialiased overflow-hidden">
      <div className="flex">
        {/* Sidebar */}
        {!collapseSidebar && (
          <div
            className={`bg-gray-950 text-gray-200 font-bold max-w-[250px] h-screen overflow-y-auto md:min-w-[220px] 
            transition-all duration-300 ${
              collapseSidebar ? "w-0 overflow-hidden" : "w-[250px] md:w-[220px]"
            }`}
          >
            {/* Close Button Inside Sidebar */}
            <div className="flex flex-row items-center justify-between text-3xl p-4">
              <p className="text-indigo-600">SideBar</p>
              <button onClick={() => setCollapseSidebar(!collapseSidebar)}>
                <FiSidebar />
              </button>
            </div>
            <div className="mt-3">
              <Sidebar />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 bg-neutral-900 h-screen overscroll-hidden relative text-gray-200">
          {/* Open Button (Only when sidebar is closed) */}
          <div
            className="flex m-2
                        absolute top-0 left-0 pl-2 pr-1 w-full items-center space-x-2"
          >
            <div className="flex">
              {collapseSidebar && (
                <button
                  className="font-bold text-3xl m-2"
                  onClick={() => setCollapseSidebar(!collapseSidebar)}
                >
                  <FiSidebar />
                </button>
              )}
            </div>
            <div className="flex">
              <Header ml={marginLeftClass} />
            </div>
          </div>

          {children}
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
