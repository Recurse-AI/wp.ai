"use client";

import { useState } from "react";
// import Sidebar from "@/components/Sidebar";
// import Chatbox from "@/components/Chatbox";
import { Menu } from "lucide-react";

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar (Fixed & Doesn't Scroll) */}
      <div
        className={`fixed top-16 z-40 h-[calc(100vh-4rem)] bg-gray-900 md:relative md:translate-x-0 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* <Sidebar onClose={() => setIsSidebarOpen(false)} /> */}
      </div>

      {/* Chatbox Section (Scrolls Inside) */}
      <div className="flex flex-col flex-1 h-screen pt-16">


        {/* Chatbox (Full-screen but scrolls inside) */}
        <div className="h-full w-full flex flex-col overflow-hidden">
          {/* <Chatbox /> */}
        </div>
      </div>
    </div>
  );
}