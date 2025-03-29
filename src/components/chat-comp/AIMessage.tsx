import React, { useEffect, useState, useRef } from "react";
import { AIResponseActions } from "./MessageActions";
import MarkdownContent from "./MarkdownContent";
import { useChatSocket } from "@/context/ChatSocketContext";
import { useTheme } from "@/context/ThemeProvider";

interface AIMessageProps {
  content: string | undefined;
  responseContainerRef: React.RefObject<HTMLDivElement | null>;
  onCopyCode: (code: string) => void;
  isCodeCopied: (code: string) => boolean;
  onRegenerate?: () => Promise<void>;
  isLatestMessage?: boolean;
  isFinalResponse?: boolean;
}

const AIMessage: React.FC<AIMessageProps> = ({ 
  content, 
  responseContainerRef, 
  onCopyCode,
  isCodeCopied,
  onRegenerate,
  isLatestMessage = false,
  isFinalResponse = false
}) => {
  // Local state for streaming effect
  const contentRef = useRef<HTMLDivElement>(null);
  const { isLoading } = useChatSocket();
  
  const { theme } = useTheme();
  
  // If no content to display at all, don't render
  if (!content) {
    return null;
  }


  return (
    <div className={`flex justify-start w-full max-w-[50rem] px-4 mt-3 mb-4 font-inter overflow-x-hidden ai-message-wrapper ${
      isLatestMessage ? 'latest-message' : ''
    } ${isFinalResponse ? 'final-response' : ''}`}
    >
      <div
        ref={responseContainerRef}
        className={`py-4 px-2 w-full ai-response-container group ${
          theme === "dark" 
            ? "text-gray-100" 
            : "text-gray-800"
        } transition-all duration-300 ease-in-out ${
          isLoading ? 'streaming-active' : ''
        } ${isFinalResponse ? 'final-active' : ''}`}
        style={{
          opacity: 1,
          visibility: 'visible',
          transition: 'all 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
          position: 'relative',
          width: '100%',
          transform: 'translateZ(0)',
          willChange: 'transform',
          overflow: 'hidden',
          background: 'transparent'
        }}
        data-ai-response="true"
        data-visible="true"
        data-complete={!isLoading ? "true" : "false"}
        data-final={isFinalResponse ? "true" : "false"}
      >
        <div 
          className="message-content flex flex-col w-full"
          ref={contentRef}
        >
          {/* Final response badge */}
          {isFinalResponse && !isLoading && (
            <div className="final-badge text-xs px-2 py-1 mb-2 rounded inline-flex items-center text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 w-fit">
              <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
              Final Response
            </div>
          )}
          
          {/* Main content with markdown */}
          <div 
            className={`markup-content w-full font-normal text-base overflow-visible relative ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}
          >
            <MarkdownContent
              content={content || ""}
              onCopyCode={onCopyCode}
              isCodeCopied={isCodeCopied}
              className={`${isFinalResponse ? 'final-markdown' : ''}`}
            />
          </div>
          
          {/* Action buttons */}
          {!isLoading && content && (
            <div className="action-buttons ai-response-actions relative w-full mt-2 mb-1 flex justify-start">
              <AIResponseActions
                content={content || ""}
                onRegenerate={onRegenerate}
              />
            </div>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        /* Ensure action buttons are visible */
        .ai-response-actions {
          opacity: 0.9 !important;
          visibility: visible !important;
          display: flex !important;
        }
        
        /* Enhance visibility on hover */
        .group:hover .ai-response-actions {
          opacity: 1 !important;
        }
        
        /* Latest message styling */
        .latest-message {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
        
        /* Streaming animation - removed any color effects */
        .streaming-active {
          background: transparent !important;
          box-shadow: none !important;
        }
        
        /* Final response styling */
        .final-active {
          border-left: 2px solid ${theme === "dark" ? "#10b981" : "#34d399"};
          padding-left: 0.5rem;
        }
        
        .final-markdown {
          position: relative;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AIMessage; 