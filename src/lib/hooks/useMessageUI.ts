import { useState, useEffect } from "react";

// Custom hook for window dimensions
export const useWindowDimensions = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    // Debounce function to prevent too many updates
    let debounceTimeout: NodeJS.Timeout | null = null;
    
    const updateDimensions = () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      debounceTimeout = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 100); // 100ms debounce
    };
    
    // Set initial dimensions once
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    // Add event listener for resize
    window.addEventListener('resize', updateDimensions);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, []);

  return windowSize;
};

// Custom hook for text streaming
export const useTextStreaming = (
  content: string | undefined, 
  isLatestMessage: boolean, 
  role: string | undefined, 
  status: string | undefined, 
  createdAt?: string
) => {
  const [displayText, setDisplayText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamComplete, setStreamComplete] = useState(false);

  // Update streaming state when message changes
  useEffect(() => {
    if (status === 'delivered' && role === 'assistant' && !streamComplete && isLatestMessage) {
      // Check if it's an old message
      const isOldMessage = createdAt && new Date(createdAt).getTime() < Date.now() - 5000;
      
      if (!isOldMessage) {
        setIsStreaming(true);
        setStreamComplete(false);
        setDisplayText("");
      } else {
        // For old messages, don't stream
        setIsStreaming(false);
        setStreamComplete(true);
        setDisplayText(content || "");
      }
    } else if (status === 'delivered' && role === 'assistant' && !isLatestMessage) {
      // For non-latest messages, don't stream
      setIsStreaming(false);
      setStreamComplete(true);
      setDisplayText(content || "");
    }
  }, [status, role, createdAt, streamComplete, isLatestMessage, content]);

  // Stream text effect for assistant messages
  useEffect(() => {
    if (isStreaming && role === 'assistant' && status === 'delivered' && isLatestMessage) {
      let index = 0;
      const messageContent = content || "";
      const length = messageContent.length;
      
      // Adjust processing speed based on message length
      const baseSpeed = 5; // Base speed in milliseconds
      const chunkSize = length > 2000 ? 5 : length > 1000 ? 3 : 1;

      const interval = setInterval(() => {
        setDisplayText(messageContent.slice(0, index));
        index += chunkSize;

        if (index > messageContent.length) {
          clearInterval(interval);
          setStreamComplete(true);
          setIsStreaming(false);
        }
      }, baseSpeed);

      return () => clearInterval(interval);
    }
  }, [isStreaming, content, role, status, isLatestMessage]);

  return { displayText, isStreaming, streamComplete, setIsStreaming, setStreamComplete };
};

// Helper function to find the closest scrollable parent element
export const findScrollableParent = (element: HTMLElement | null): HTMLElement | null => {
  if (!element) return null;
  
  let parent = element.parentElement;
  
  while (parent) {
    const hasScrollableContent = parent.scrollHeight > parent.clientHeight;
    const isScrollable = getComputedStyle(parent).overflowY !== 'hidden' && hasScrollableContent;
    
    if (isScrollable) {
      return parent;
    }
    
    parent = parent.parentElement;
  }
  
  return null;
}; 