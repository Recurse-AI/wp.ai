"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme } from "@/context/ThemeProvider";
import { Brain, ChevronDown, ChevronUp, Loader } from "lucide-react";
import { useStreaming } from '@/context/MessageStateContext';

interface ThinkingPanelProps {
  content: string;
  // streamingPhase: 'search' | 'thinking' | 'response' | 'complete';
  isExpanded: boolean;
  setExpanded: (expanded: boolean) => void;
  messageId: string;
}

const ThinkingPanel: React.FC<ThinkingPanelProps> = ({
  content,
  isExpanded,
  setExpanded,
  messageId
}) => {
  const { theme } = useTheme();
  const thinkingBoxRef = useRef<HTMLDivElement>(null);
  const thinkingHeaderRef = useRef<HTMLDivElement>(null);
  const [displayContent, setDisplayContent] = useState<string>('');
  const [streamingPhase, setStreamingPhase] = useState<'search' | 'thinking' | 'response' | 'complete'>('thinking');
  // Add a ref to track if streaming is in progress to prevent multiple streaming processes
  const isStreamingRef = useRef(false);

  // Get streaming context
  const { 
    currentPhase,
    id,
    completeThinking,
  } = useStreaming();

  useEffect(() => {
    if (currentPhase) {
      setStreamingPhase(currentPhase);
    }
  }, [currentPhase]);


  // Stream thinking content
  useEffect(() => {
    // Use a mounted flag to prevent state updates after unmount
    let isMounted = true;
    
    // If the messageId is the same as the id and there's no content, complete the thinking phase
    if(messageId === id && (!content || content.length === 0)) {
      completeThinking();
      setExpanded(false);
    } else if(messageId !== id) {
      setDisplayContent(content);
      setExpanded(false);
    } else if (messageId === id && !isStreamingRef.current && currentPhase === "thinking" && content) {
      // Stream thinking content character by character
      const streamContent = async () => {
        // Set streaming flag to prevent multiple streaming processes
        isStreamingRef.current = true;
        
        if (isMounted) {
          setDisplayContent('');
        }
        
        // Add one character at a time with a small delay
        const contentChunks = content.split(' ');
        let currentContent = '';
        
        for (let i = 0; i < contentChunks.length; i++) {
          if (!isMounted) break; // Stop if component unmounted
          
          // Wait for a tiny delay to create streaming effect
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Add the next word plus space
          currentContent += contentChunks[i] + (i < contentChunks.length - 1 ? ' ' : '');
          
          // Update displayContent if still mounted
          if (isMounted) {
            setDisplayContent(currentContent);
          }
          
          // If this is the last chunk, complete the thinking phase
          if (i === contentChunks.length - 1 && isMounted) {
            setTimeout(() => {
              if (isMounted) {
                completeThinking();
                // Reset streaming flag
                isStreamingRef.current = false;
                setTimeout(() => {
                  if (isMounted) {
                    setExpanded(false);
                  }
                }, 1000);
              }
            }, 1000);
          }
        }
      };
      
      // Start streaming content
      streamContent();
    } else if (messageId === id && !isStreamingRef.current && currentPhase === "thinking" && !content) {
      // Reset display content
      setDisplayContent('');
      completeThinking();
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [messageId, id, completeThinking, content, currentPhase, setExpanded]);

  
  // Define colors based on theme
  const textColor = theme === "dark" ? "text-gray-300" : "text-gray-700";
  const bgColor = theme === "dark" ? "bg-gray-900" : "bg-white";
  const borderColor = theme === "dark" ? "border-purple-600" : "border-purple-400";
  const bgContentColor = theme === "dark" ? "bg-gray-800/50" : "bg-gray-50/90";
  const placeholderColor = theme === "dark" ? "text-gray-400" : "text-gray-500";
  const thinkingTextColor = "text-purple-500";
  const cursorColor = "text-purple-600";

  // Don't render anything if no content and not in thinking phase
  if ((!displayContent && streamingPhase !== 'thinking') || (content?.length === 0)) {
    return null;
  }
    
  return isExpanded ? (
    <div className="pl-4 mb-4 thinking-container">
      <div 
        ref={thinkingHeaderRef}
        className={`flex items-center gap-2 mb-2 sticky top-0 ${bgColor} z-10 py-1 cursor-pointer ${textColor} ${streamingPhase === 'thinking' ? 'thinking-header-active' : ''}`}
        onClick={() => setExpanded(!isExpanded)}
        style={{
          position: 'sticky',
          top: 0,
          padding: '10px',
          borderRadius: '0.375rem',
          transition: 'all 0.3s ease'
        }}
      >
        <Brain className="w-4 h-4 text-purple-500" />
        <h4 className="text-xs font-medium flex items-center flex-1">
          {streamingPhase === 'thinking' ? (
            <span className="flex items-center text-xs text-purple-500">
              <Loader className="w-3 h-3 mr-1 animate-spin" />
              Thinking...
            </span>
          ) : "AI Thinking"}
        </h4>
        
        <button 
          onClick={(e) => {
            e.stopPropagation(); // Prevent double toggle
            setExpanded(!isExpanded);
          }}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-transform"
          aria-label={isExpanded ? "Collapse thinking" : "Expand thinking"}
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      
      <div
        style={{
          maxHeight: '250px',
          opacity: 1,
          overflow: 'auto',
          transition: 'all 0.3s ease',
          paddingLeft: '1.5rem',
          paddingRight: '0.5rem'
        }}
      >
        <div 
          ref={thinkingBoxRef}
          className="space-y-3 custom-scrollbar thinking-scroll"
          style={{
            maxHeight: '250px',
            overflowY: 'auto',
            paddingRight: '0.5rem'
          }}
        >
          <div 
            className={`p-3 border-l-2 ${borderColor} ${bgContentColor} rounded-r-sm transition-all duration-200`}
          >
            <pre className={`text-xs font-mono whitespace-pre-wrap ${textColor}`}>
              {displayContent}
              {streamingPhase === 'thinking' && (
                <span className={`animate-pulse ${cursorColor}`}>▌</span>
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div 
      className={`pl-4 mb-4 thinking-collapsed cursor-pointer ${textColor}`} 
      onClick={() => {
        setExpanded(true);
      }}
    >
      <div className="flex items-center gap-2 py-2">
        <Brain className={`w-4 h-4 ${thinkingTextColor}`} />
        <h4 className={`text-xs font-medium flex items-center flex-1 ${textColor}`}>
          AI Thinking Process
        </h4>
        
        <button 
          onClick={(e) => {
              e.stopPropagation(); // Prevent double toggle
              setExpanded(true);
          }}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Expand thinking"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
  
};

export default ThinkingPanel; 