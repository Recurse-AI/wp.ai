'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

interface LoadingIndicatorProps {
  /**
   * The color of the loading bar
   * @default 'bg-blue-600'
   */
  color?: string;

  /**
   * The height of the loading bar in pixels
   * @default '3px'
   */
  height?: string;

  /**
   * The position of the loading bar
   * @default 'fixed top-0 left-0 z-50'
   */
  position?: string;

  /**
   * The animation duration in milliseconds
   * @default 500
   */
  duration?: number;
}

/**
 * Loading indicator component for navigation
 * Shows a progress bar at the top of the page during route transitions
 */
export default function LoadingIndicator({
  color = 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600',
  height = '3px',
  position = 'fixed top-0 left-0 z-50',
  duration = 500,
}: LoadingIndicatorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Create functions outside of useEffect to avoid closure issues
  const handleRouteChangeStart = useCallback(() => {
    setLoading(true);
    setProgress(0);
  }, []);

  const incrementProgress = useCallback(() => {
    setProgress((prevProgress) => {
      if (prevProgress >= 90) {
        // Max out at 90% while waiting for completion
        return 90;
      }
      
      // Slow down as we approach 90%
      const increment = prevProgress < 30 ? 10 : 
                       prevProgress < 60 ? 5 : 
                       prevProgress < 80 ? 2 : 1;
                       
      return prevProgress + increment;
    });
  }, []);

  const handleRouteChangeComplete = useCallback(() => {
    setProgress(100);
    
    // Reset after animation completes
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, duration);
  }, [duration]);

  useEffect(() => {
    let incrementTimer: NodeJS.Timeout;
    
    // Function to safely handle navigation start
    const safeHandleStart = () => {
      handleRouteChangeStart();
      // Start incrementing progress after a short delay
      incrementTimer = setInterval(incrementProgress, duration / 10);
    };

    // Use Next.js navigation events instead of modifying history directly
    // Define custom event listeners for navigation
    const startNavigation = () => {
      safeHandleStart();
    };

    const completeNavigation = () => {
      clearInterval(incrementTimer);
      handleRouteChangeComplete();
    };

    // Add event listeners for navigation events
    window.addEventListener('navigationStart', startNavigation);
    window.addEventListener('navigationComplete', completeNavigation);
    
    return () => {
      clearInterval(incrementTimer);
      window.removeEventListener('navigationStart', startNavigation);
      window.removeEventListener('navigationComplete', completeNavigation);
    };
  }, [handleRouteChangeStart, handleRouteChangeComplete, incrementProgress, duration]);

  if (!loading && progress === 0) {
    return null;
  }

  return (
    <div 
      className={`${position} w-full overflow-hidden`} 
      style={{ height }}
    >
      <div 
        className={`h-full ${color}`}
        style={{ 
          width: `${progress}%`,
          transition: `width ${duration}ms ease-in-out`,
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)'
        }}
      />
    </div>
  );
} 