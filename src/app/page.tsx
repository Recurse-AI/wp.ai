"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";

export default function Home() {
  const { theme } = useTheme(); // ✅ Get current theme
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      {/* 🔹 Sidebar (Fixed Position Below Navbar) */}
      <div
        className={`fixed top-16 z-40 h-[calc(100vh-4rem)] transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${theme === "dark" ? "bg-gray-900" : "bg-gray-100 text-black"}`}
      >
        {/* Sidebar Component */}
        {/* <Sidebar onClose={() => setIsSidebarOpen(false)} /> */}
      </div>

      {/* 🔹 Chatbox Section (Scrollable Inside) */}
      <div className="flex flex-col flex-1 h-screen pt-16">
        {/* Mobile Sidebar Toggle */}
        <button
          className="md:hidden p-3 text-white dark:text-black bg-gray-800 dark:bg-gray-700 fixed top-4 left-4 z-50 rounded-lg"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Chatbox (Full-screen but scrolls inside) */}
        <div className="h-full w-full flex flex-col overflow-y-auto">
          {/* Chatbox Component */}
          {/* <Chatbox /> */}
        </div>
      </div>
    </div>
  );
}
