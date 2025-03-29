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

