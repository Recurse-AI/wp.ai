"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from "@/context/ThemeProvider";
import { Brain, ChevronDown, ChevronUp } from "lucide-react";
import Loader from '@/components/ui/Loader';

interface ThinkingDisplayProps {
  content: string;
  isThinking: boolean;
  isComplete: boolean;
  onComplete?: () => void;
}

const ThinkingDisplay = ({
  content,
  isThinking,
  isComplete,
  onComplete
}: ThinkingDisplayProps) => {
  const { theme } = useTheme();
  const [displayedContent, setDisplayedContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Handle content display
  useEffect(() => {
    if (!content) {
      setDisplayedContent('');
      return;
    }
    
    // Show all content when complete
    if (isComplete) {
      setDisplayedContent(content);
      if (onComplete) onComplete();
      return;
    }
    
    // Simple streaming effect for thinking state
    if (isThinking) {
      let position = 0;
      const interval = setInterval(() => {
        position += 3;
        if (position >= content.length) {
          clearInterval(interval);
          setDisplayedContent(content);
          if (onComplete) setTimeout(onComplete, 300);
        } else {
          setDisplayedContent(content.substring(0, position));
        }
      }, 30);
      
      return () => clearInterval(interval);
    }
    
    // Default: show all content
    setDisplayedContent(content);
  }, [content, isThinking, isComplete, onComplete]);

  // Don't render anything if no content and not thinking
  if (!isThinking && !displayedContent) return null;

  const isDark = theme === 'dark';
  
  return (
    <div className={`w-full border rounded-lg mb-4 overflow-hidden ${
      isDark ? 'bg-gray-900/50 border-gray-700/50' : 'bg-gray-50 border-gray-200/70'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2 ${
        isDark ? 'bg-gray-800/50' : 'bg-gray-100/70'
      }`}>
        <div className="flex items-center">
          <Brain className="w-4 h-4 mr-2 text-purple-500" />
          <span className="text-sm font-medium">AI Thinking</span>
        </div>
        <div className="flex items-center">
          {isThinking && <Loader size="sm" color="#a855f7" className="mr-2" />}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`text-xs px-2 py-1 rounded flex items-center ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            {isExpanded ? 
              <>
                <span>Show Less</span>
                <ChevronUp className="w-3 h-3 ml-1" />
              </> : 
              <>
                <span>Show More</span>
                <ChevronDown className="w-3 h-3 ml-1" />
              </>
            }
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`overflow-hidden transition-all duration-300 ${
        isExpanded ? 'max-h-96' : 'max-h-40'
      }`}>
        <div className="p-4">
          {displayedContent ? (
            <div className={`whitespace-pre-wrap text-sm ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {displayedContent}
              {isThinking && <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />}
            </div>
          ) : (
            <div className="flex justify-center items-center py-4">
              <Loader color="#a855f7" />
              <span className="ml-2 text-sm text-gray-500">Thinking...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThinkingDisplay; 