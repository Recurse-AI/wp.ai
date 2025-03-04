/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaPlus } from "react-icons/fa";
import React from "react";
import { useTheme } from "@/context/ThemeProvider";

const NewChat = ({ onClose }: { onClose?: () => void }) => {
  const router = useRouter();
  const { theme } = useTheme();

  const handleNewChat = () => {
    if (onClose) {
      onClose();
    }
    router.push("/chat");
  };

  return (
    <button
      onClick={handleNewChat}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 w-full
        ${
          theme === "dark"
            ? "bg-black hover:bg-gray-800 text-white"
            : "bg-gray-300 hover:bg-gray-400 text-black"
        }`}
    >
      <FaPlus className="text-xl" />
      <span className="text-lg font-medium">New Chat</span>
    </button>
  );
};

export default NewChat;
