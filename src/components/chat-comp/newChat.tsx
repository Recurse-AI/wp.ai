"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaPlus } from "react-icons/fa";
import React from "react";
import { useTheme } from "@/context/ThemeProvider";

const NewChat = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { theme } = useTheme(); // Assuming you get theme data from session or default to light

  const createNewChat = async () => {
    router.push(`/chat`);
  };

  return (
    <button
      className={`
        flex items-center justify-center gap-2 
        w-full py-2 rounded-md
        text-sm md:text-base font-medium tracking-wide
        transition duration-300 ease-in-out
        ${theme === "dark"
          ? "bg-gray-800 text-white border border-white/20 hover:bg-gray-700 hover:border-white/10"
          : "bg-white text-gray-800 border border-gray-800/20 hover:bg-gray-50 hover:border-gray-800/10"}
        cursor-pointer
      `}
      onClick={createNewChat}
    >
      <FaPlus className="text-lg" /> {/* Adjust icon size */}
      New Chat
    </button>
  );
};

export default NewChat;