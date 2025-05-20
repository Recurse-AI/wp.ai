"use client";

import React, { useEffect, useRef } from 'react';
import { useWorkspaceState } from '../context/WorkspaceStateManager';
import { motion, AnimatePresence } from 'framer-motion';

interface StreamingResponseProps {
  className?: string;
  showTypingIndicator?: boolean;
  typingSpeed?: number;
}

const StreamingResponse: React.FC<StreamingResponseProps> = ({
  className = '',
  showTypingIndicator = true,
  typingSpeed = 30, // ms delay between tokens for animation
}) => {
  const { state } = useWorkspaceState();
  const responseRef = useRef<HTMLDivElement>(null);
  const { streaming } = state;
  
  // Auto-scroll to the bottom when new tokens arrive
  useEffect(() => {
    if (responseRef.current && streaming.isStreaming) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [streaming.content]);

  // If not streaming, don't render anything
  if (!streaming.isStreaming) {
    return null;
  }

  return (
    <div 
      className={`streaming-response ${className}`}
      ref={responseRef}
    >
      <div className="py-2 px-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-2 text-gray-700 dark:text-gray-300 font-medium">AI Assistant</div>
          
          {/* Typing indicator animation */}
          {showTypingIndicator && (
            <div className="ml-auto flex">
              <AnimatePresence>
                <motion.div
                  className="typing-indicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400">typing</span>
                  <span className="typing-dots">
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, times: [0, 0.2, 0.4] }}
                    >.</motion.span>
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, times: [0.1, 0.3, 0.5] }}
                    >.</motion.span>
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, times: [0.2, 0.4, 0.6] }}
                    >.</motion.span>
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
        
        <div className="relative streaming-content text-gray-800 dark:text-gray-200">
          {/* Animate tokens as they arrive */}
          <div className="whitespace-pre-wrap overflow-auto">
            {streaming.content}
            
            {/* Blinking cursor at the end of text */}
            <motion.span
              className="inline-block h-4 w-2 bg-blue-500 ml-0.5"
              animate={{ opacity: [0, 1] }}
              transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }}
            />
          </div>
        </div>
        
        {/* Statistics footer (useful for debugging) */}
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
          <span>Tokens: {streaming.tokens.length}</span>
          <span>Chunks: {streaming.chunkCount}</span>
        </div>
      </div>
    </div>
  );
};

export default StreamingResponse; 