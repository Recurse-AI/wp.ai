"use client";
import React from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { FaUser, FaRobot } from 'react-icons/fa';

interface AgentMessageProps {
  content: string;
  isUser: boolean;
}

const AgentMessage: React.FC<AgentMessageProps> = ({ content, isUser }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 ml-2' 
            : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 mr-2'
        }`}>
          {isUser ? <FaUser /> : <FaRobot />}
        </div>
        
        <div className={`p-3 rounded-lg ${
          isUser 
            ? 'bg-blue-500 text-white dark:bg-blue-600' 
            : theme === 'dark' 
              ? 'bg-gray-700 text-gray-100' 
              : 'bg-gray-100 text-gray-800'
        }`}>
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    </div>
  );
};

export default AgentMessage; 