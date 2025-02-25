"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaPlus } from "react-icons/fa";
import React from "react";
import { useTheme } from "@/context/ThemeProvider";

const NewChat = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const {theme} = useTheme(); // Assuming you get theme data from session or default to light

  const createNewChat = async () => {
    router.push(`/chat`);
  };

  return (
    <button
      className={`
        flex items-center justify-center gap-2 border 
        ${theme === "dark" ? "border-white/20" : "border-gray-800/20"}
        text-xs md:text-base px-2 py-1 rounded-md 
        ${theme === "dark" ? "text-white/50" : "text-gray-800/70"}
        hover:${theme === "dark" ? "border-white/10" : "border-gray-800/10"}
        hover:${theme === "dark" ? "text-white" : "text-gray-900"}
        duration-300 tracking-wide w-full mx-1
      `}
      onClick={createNewChat}
    >
      <FaPlus /> New Chat
    </button>
  );
};

export default NewChat;
