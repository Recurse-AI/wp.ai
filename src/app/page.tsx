"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";

export default function Home() {
  const { theme } = useTheme(); // ✅ Get current theme
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"}`}>
      
    </div>
  );
}
