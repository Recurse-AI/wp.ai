'use client';

import React from 'react';
import { useChatSocket } from '@/context/ChatSocketContext';
import { Square } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeProvider';

interface CancelResponseButtonProps {
  className?: string;
}

const CancelResponseButton: React.FC<CancelResponseButtonProps> = ({ className }) => {
  const { cancelResponse } = useChatSocket();
  const { theme } = useTheme();
  
  const handleCancel = () => {
    cancelResponse();
  };
  
  return (
    <motion.button
      onClick={handleCancel}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all duration-200 
        ${theme === "dark" 
          ? "bg-red-600 text-white hover:bg-red-700" 
          : "bg-red-500 text-white hover:bg-red-600"
        }
        ${className || ''}`}
      title="Cancel AI response"
      aria-label="Cancel AI response"
    >
      {/* Stop symbol (a square) */}
      <Square className="w-4 h-4 fill-current" strokeWidth={0} />
      
      {/* Pulsing ring animation */}
      <span className="absolute inset-0 rounded-full animate-ping-slow bg-red-400 opacity-20"></span>
    </motion.button>
  );
};

export default CancelResponseButton; 