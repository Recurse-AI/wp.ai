/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PlusCircle } from "lucide-react";
import React from "react";
import { useTheme } from "@/context/ThemeProvider";
import { motion } from "framer-motion";
import Link from "next/link"; 

const NewChat = ({ onClose }: { onClose?: () => void }) => {
  const router = useRouter();
  const { theme } = useTheme();

  const handleNewChat = () => {
    if (onClose) {
      onClose();
    }
    
    // Simply redirect to the main chat page
    router.push('/chat');
  };

  return (
    <Link href="/chat" passHref>
      <motion.button
        onClick={onClose}
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
    </Link>
  );
};

export default NewChat;
