import React, { useEffect, useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { AIResponseActions } from "./MessageActions";
import CodeBlock from "./CodeBlock";
import { useStreaming } from '@/context/MessageStateContext';

interface AIMessageProps {
  content: string | undefined;
  theme: string;
  responseContainerRef: React.RefObject<HTMLDivElement | null>;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
  onRegenerate?: () => void;
  metadata?: Record<string, any>;
  messageId: string;
  disableActionButtons?: boolean;
}

const AIMessage: React.FC<AIMessageProps> = ({ 
  content, 
  theme,  
  responseContainerRef, 
  onCopyCode, 
  copiedCode, 
  onRegenerate,
  metadata,
  messageId,
  disableActionButtons
}) => {
  // Force visibility to be true initially
  const [showLoading, setShowLoading] = useState(false);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);
  const [showActionButtons, setShowActionButtons] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [displayContent, setDisplayContent] = useState<string>('');

  // Add a ref to track if streaming is in progress to prevent multiple streaming processes
  const isStreamingRef = useRef(false);
  // Add a ref to track animation frame ID for cleanup
  const animationFrameRef = useRef<number | null>(null);

  // Get streaming context
  const { 
    currentPhase,
    id,
    completeAIResponse,
  } = useStreaming();

  // Stream AI response content
  useEffect(() => {
    // Reference to the animation frame for cleanup
    let animFrameId: number | null = null;
    
    // If the messageId is the same as the id and there's no content, we're still waiting
    if(messageId !== id) {
      // If this isn't the current message, just show the full content
      setDisplayContent(content || '');
      setShowLoading(false);
      setShowActionButtons(true);
    } else if (messageId === id && content && !isStreamingRef.current && currentPhase === 'response') {
      // Start streaming content if this is the current message and we have content
      setShowLoading(false);
      
      // Stream content with requestAnimationFrame for better performance
      const streamContent = () => {
        // Set streaming flag to prevent multiple streaming processes
        isStreamingRef.current = true;
        
        // Reset display content
        setDisplayContent('');
        
        // Prepare content for streaming
        const fullText = content || '';
        let currentIndex = 0;
        let lastUpdateTime = 0;
        
        // Define how many characters to add per update based on content length
        const getChunkSize = () => {
          const length = fullText.length;
          return length > 10000 ? 15 : length > 5000 ? 10 : length > 2000 ? 7 : 1;
        };
        
        const chunkSize = getChunkSize();
        const frameDelay = 16; // Aim for 60fps (approx 16ms between frames)
        
        // Animation function using requestAnimationFrame
        const updateText = (timestamp: number) => {
          if (!lastUpdateTime) lastUpdateTime = timestamp;
          
          const elapsed = timestamp - lastUpdateTime;
          
          // Only update if enough time has passed
          if (elapsed >= frameDelay && currentIndex < fullText.length) {
            // Calculate how many characters to add, considering elapsed time
            // This helps maintain consistent speed regardless of frame drops
            const charsToAdd = Math.min(
              Math.ceil(chunkSize * (elapsed / frameDelay)),
              fullText.length - currentIndex
            );
            
            currentIndex = Math.min(currentIndex + charsToAdd, fullText.length);
            setDisplayContent(fullText.slice(0, currentIndex));
            lastUpdateTime = timestamp;
          }
          
          // Continue animation if there's more text
          if (currentIndex < fullText.length) {
            animFrameId = requestAnimationFrame(updateText);
            animationFrameRef.current = animFrameId;
          } else {
            // Streaming complete
            setTimeout(() => {
              completeAIResponse();
              isStreamingRef.current = false;
              setShowActionButtons(true);
            }, 100);
          }
        };
        
        // Start the animation
        animFrameId = requestAnimationFrame(updateText);
        animationFrameRef.current = animFrameId;
      };
      
      // Start streaming content
      streamContent();
    } else if (messageId === id && !isStreamingRef.current && currentPhase === 'response' && !content) {
      // Reset display content
      setDisplayContent('');
      completeAIResponse();
    }
    
    // Cleanup function to cancel animation frame on unmount or dependency change
    return () => {
      // Cancel any ongoing animation frames
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Also cancel the local animation frame if it exists
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
      }
    };
  }, [messageId, id, content, completeAIResponse, currentPhase]);

 

  // The loading indicator that shows only the loading icon
  const renderLoadingIndicator = () => (
    <div className="py-3 response-indicator" data-ai-response-ready="true">
      <div className="inline-flex items-center justify-center w-full">
        <div className="w-4 h-4 border-2 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></div>
        <div className="w-3 h-3 border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mr-2"></div>
        <div className="w-2 h-2 border-2 border-t-green-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>
    </div>            
  );

  if (messageId === id && (currentPhase === "search" || currentPhase === "thinking" || !content)) {
    return null;
  }

  return (
    <div className="flex justify-start w-full max-w-[50rem] px-4 mt-3 mb-4 font-inter overflow-x-hidden ai-message-wrapper">
      <div
        ref={responseContainerRef}
        className={`py-4 px-6 rounded-xl w-full ai-response-container group ${
          theme === "dark" 
            ? "bg-gray-800/70 text-gray-100" 
            : "bg-white/85 text-gray-800"
        } transition-all duration-300 ease-in-out`}
        style={{
          opacity: 1, // Always visible
          visibility: 'visible', // Always visible
          transition: 'all 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
          minHeight: containerHeight ? `${containerHeight}px` : undefined,
          position: 'relative',
          boxShadow: theme === "dark" 
            ? '0 2px 10px rgba(0,0,0,0.12)' 
            : '0 2px 8px rgba(0,0,0,0.04)',
          border: theme === "dark" 
            ? '1px solid rgba(75, 85, 99, 0.3)' 
            : '1px solid rgba(229, 231, 235, 0.8)',
          width: '100%',
          // Add these properties to fix the scrollbar and stability issues
          transform: 'translateZ(0)',
          willChange: 'transform',
          overflow: 'hidden' // Hide any scrollbars that might appear
        }}
        data-ai-response="true"
        data-visible="true"
      >
        {(showLoading && !displayContent) ? (
          renderLoadingIndicator()
        ) : (
          <>
            <div 
              className="ai-response-content"
              ref={contentRef}
              style={{ overflow: 'hidden' }} // Hide any scrollbars that might appear
            >
              <style jsx global>{`
                .prose-no-scroll {
                  overflow: hidden !important;
                }
                .prose-no-scroll * {
                  overflow-y: hidden !important;
                }
                .prose-no-scroll pre {
                  overflow-x: auto !important;
                }
                
                /* Fix centering for AI messages */
                .ai-message-wrapper {
                  display: flex;
                  justify-content: center;
                  width: 100%;
                  margin: 0 auto;
                }
              `}</style>
              <ReactMarkdown
                className={`prose ${theme === "dark" ? "prose-invert" : ""} max-w-none ai-response-text prose-no-scroll`}
                components={{
                  p: ({node, ...props}) => <p className="mb-3 font-light text-opacity-90 tracking-normal leading-relaxed" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-2xl font-medium mt-6 mb-3 tracking-tight" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-medium mt-5 mb-2 tracking-tight" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-medium mt-4 mb-2 tracking-tight" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1 font-light leading-relaxed" {...props} />,
                  a: ({node, ...props}) => <a className="text-blue-500 hover:text-blue-600 font-normal transition-colors" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-gray-300 dark:border-gray-600 pl-3 italic my-3 font-light text-opacity-85" {...props} />,
                  pre: ({node, children, ...props}) => {
                    // If it's a pre element, we make sure it has proper spacing
                    return (
                      <pre {...props} style={{ margin: '1rem 0' }}>
                        {children}
                      </pre>
                    )
                  },
                  code: (props) => <CodeBlock {...props} theme={theme} onCopy={onCopyCode} copiedCode={copiedCode} />
                }}
              >
                {/* Use standard trimming to preserve code formatting */}
                {displayContent || ""}
              </ReactMarkdown>
              
              {currentPhase === 'response' && (
                <span className="animate-pulse text-blue-500 cursor-end">▌</span>
              )}
            </div>
            
              {/* Always show action buttons for better UX */}
          {showActionButtons && !isStreamingRef.current && !showLoading && !disableActionButtons && (messageId !== id || (messageId === id && currentPhase === "complete")) && (
            <AIResponseActions 
              content={displayContent || ""} 
              onRegenerate={onRegenerate}
              metadata={metadata}
            />
          )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIMessage; 