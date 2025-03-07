"use client";
import React from 'react';
import { FaWordpress } from "react-icons/fa";
import { useTheme } from "@/context/ThemeProvider";

interface WelcomeHeaderProps {
  username: string;
  setPrompt: (prompt: string) => void;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ username, setPrompt }) => {
  const { theme } = useTheme();

  return (
    <div className={`w-full text-center mb-6 ${
      theme === "dark" ? "text-gray-300" : "text-gray-700"
      }`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="bg-blue-600 text-white p-2 rounded-full">
          <FaWordpress className="text-lg" />
        </div>
        <span className="font-bold text-xl text-blue-600 dark:text-blue-400">WP.AI</span>
      </div>
      
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30 shadow-sm mb-4">
        <p className="text-blue-800 dark:text-blue-300 font-medium mb-1">Welcome back, {username}!</p>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          I'm your WordPress assistant. What would you like help with today?
        </p>
        
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button 
            onClick={() => setPrompt("How do I optimize my WordPress site performance?")} 
            className="text-xs bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            Site Performance
          </button>
          <button 
            onClick={() => setPrompt("Help me troubleshoot WordPress plugin conflicts")} 
            className="text-xs bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            Plugin Conflicts
          </button>
          <button 
            onClick={() => setPrompt("How do I create a custom WordPress theme?")} 
            className="text-xs bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            Custom Themes
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader; 