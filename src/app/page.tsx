"use client";

import Image from "next/image";

import Sidebar from "@/components/Sidebar";
import Chatbox from "@/components/Chatbox";

export default function Home() {
  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Chatbox */}
      <div className="flex flex-col flex-1">
        <Chatbox />
      </div>
    </div>
  );
}
