/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PlusCircle } from "lucide-react";
import React from "react";
import { useTheme } from "@/context/ThemeProvider";
import { motion } from "framer-motion";
import { useChatSocket } from "@/context/ChatSocketContext";

const NewChat = ({ onClose }: { onClose?: () => void }) => {
  const router = useRouter();
  const { theme } = useTheme();
  const { disconnect } = useChatSocket();

  const handleNewChat = () => {
    if (onClose) {
      onClose();
    }
    
    // Disconnect from any existing conversation
    disconnect();
    
    // Clear ALL conversation-related data from localStorage
    localStorage.removeItem('currentConversationId');
    localStorage.removeItem('pendingChatMessage');
    localStorage.removeItem('pendingChatModel');
    
    // Force a slight delay to ensure disconnect completes before navigation
    setTimeout(() => {
      // Redirect to the main chat page
      router.push('/chat');
    }, 50);
  };

  return (
    <motion.button
      onClick={handleNewChat}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 w-full
        ${
          theme === "dark"
            ? "bg-gradient-to-r from-blue-700/70 to-purple-700/70 hover:from-blue-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg"
            : "bg-gradient-to-r from-blue-500/90 to-purple-500/90 hover:from-blue-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg"
        }`}
    >
      <div className="flex items-center">
        <span className="text-base font-medium">New Chat</span>
      </div>
      <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
        <PlusCircle size={18} className="text-white" />
      </div>
    </motion.button>
  );
};

export default NewChat;
