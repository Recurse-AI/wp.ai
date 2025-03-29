"use client";
import React from 'react';
import { FaWordpress } from "react-icons/fa";
import { useTheme } from "@/context/ThemeProvider";

interface WelcomeHeaderProps {
  username: string;
}

const WelcomeHeader: React.FC<WelcomeHeaderProps> = ({ username }) => {
  const { theme } = useTheme();

  return (
    <div className={`w-full text-center mb-6 ${
      theme === "dark" ? "text-gray-300" : "text-gray-700"
    }`}>
      {/* Simple Logo */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="text-blue-600">
          <FaWordpress className="text-xl" />
        </div>
        <span className={`font-medium text-xl ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
          WP.AI
        </span>
      </div>
      
      {/* Welcome Message */}
      <div className="p-4">
        <h2 className={`text-lg font-medium mb-2 ${
          theme === "dark" ? "text-blue-300" : "text-blue-700"
        }`}>
          Welcome back, {username || "User"}!
        </h2>
        
        <p className={`text-sm ${
          theme === "dark" ? "text-gray-300" : "text-gray-600"
        }`}>
          I'm your WordPress assistant. Ask me anything about WordPress.
        </p>
      </div>
    </div>
  );
};

export default WelcomeHeader; 