"use client";
import React from 'react';
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { ArrowUp } from "lucide-react";

interface SendButtonProps {
  isDisabled: boolean;
}

const SendButton: React.FC<SendButtonProps> = ({ isDisabled }) => {
  const { theme } = useTheme();

  return (
    <motion.button
      type="submit"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={isDisabled}
      className={`p-3 rounded-full ml-3 ${
        !isDisabled 
          ? theme === "dark"
            ? "bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 shadow-md"
            : "bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-md"
          : theme === "dark"
            ? "bg-gray-800 text-gray-600"
            : "bg-gray-100 text-gray-400"
      } flex items-center justify-center transition-all`}
    >
      <motion.div
        animate={!isDisabled ? { 
          scale: [1, 1.1, 1],
          y: [0, -2, 0]
        } : {}}
        transition={{ 
          repeat: !isDisabled ? Number.POSITIVE_INFINITY : 0, 
          repeatType: "reverse", 
          duration: 1.2,
          repeatDelay: 0.5
        }}
        className="flex items-center justify-center"
      >
        <ArrowUp className={`w-5 h-5 ${!isDisabled ? "text-white" : ""}`} strokeWidth={2.5} />
      </motion.div>
    </motion.button>
  );
};

export default SendButton; 