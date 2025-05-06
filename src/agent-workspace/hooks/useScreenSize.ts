import { useState, useEffect } from 'react';

// Define breakpoints for different screen sizes
export const MOBILE_BREAKPOINT = 640;
export const TABLET_BREAKPOINT = 768;
export const DESKTOP_BREAKPOINT = 1024;
export const LARGE_DESKTOP_BREAKPOINT = 1280;

export type ScreenMode = 'mobile' | 'tablet' | 'desktop' | 'large_desktop';

interface ScreenSizeHook {
  screenMode: ScreenMode;
  windowWidth: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
}

/**
 * Custom hook for managing screen size and responsive behavior
 */
export function useScreenSize(): ScreenSizeHook {
  // Initialize with default values
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  
  const [screenMode, setScreenMode] = useState<ScreenMode>(
    typeof window !== 'undefined' ? determineScreenMode(window.innerWidth) : 'desktop'
  );
  
  // Function to determine screen mode based on width
  function determineScreenMode(width: number): ScreenMode {
    if (width < MOBILE_BREAKPOINT) return 'mobile';
    if (width < TABLET_BREAKPOINT) return 'tablet';
    if (width < DESKTOP_BREAKPOINT) return 'desktop';
    return 'large_desktop';
  }
  
  // Update screen mode and width on resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      
      const newScreenMode = determineScreenMode(width);
      if (screenMode !== newScreenMode) {
        setScreenMode(newScreenMode);
      }
    };
    
    if (typeof window !== 'undefined') {
      // Force immediate check on mount
      handleResize();
      
      // Add resize event listeners
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
      };
    }
  }, [screenMode]);
  
  return {
    screenMode,
    windowWidth,
    isMobile: screenMode === 'mobile',
    isTablet: screenMode === 'tablet',
    isDesktop: screenMode === 'desktop',
    isLargeDesktop: screenMode === 'large_desktop'
  };
} 