"use client";

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { recordNavigation } from '@/utils/performanceMonitoring';

interface RoutePreloaderProps {
  /**
   * Routes to preload
   */
  routes: string[];
  
  /**
   * Delay before starting preloading (ms)
   * @default 2000
   */
  preloadDelay?: number;
  
  /**
   * Maximum number of routes to preload concurrently
   * @default 2
   */
  concurrency?: number;
  
  /**
   * Whether to disable preloading on slow connections
   * @default true
   */
  disableOnSlowConnection?: boolean;
  
  /**
   * Whether to disable preloading when the device is in data saver mode
   * @default true
   */
  respectDataSaver?: boolean;
  
  /**
   * Whether the component is enabled
   * @default true
   */
  enabled?: boolean;
}

/**
 * RoutePreloader - Intelligently preloads routes for faster navigation
 * 
 * This component uses the Next.js router prefetch mechanism to preload routes
 * after the main page has loaded, improving subsequent navigation performance.
 * 
 * It includes connection-aware throttling, concurrency limits, and delayed loading
 * to ensure the main page loads properly first.
 */
export default function RoutePreloader({
  routes,
  preloadDelay = 2000,
  concurrency = 2,
  disableOnSlowConnection = true,
  respectDataSaver = true,
  enabled = true
}: RoutePreloaderProps) {
  const router = useRouter();
  const hasPreloaded = useRef<Set<string>>(new Set());
  
  useEffect(() => {
    if (!enabled || !routes.length || typeof window === 'undefined') return;
    
    // Check connection conditions before preloading
    if (respectDataSaver && (navigator as any).connection?.saveData) {
      console.log('[RoutePreloader] Skipping preload - Data Saver enabled');
      return;
    }
    
    if (disableOnSlowConnection) {
      const connection = (navigator as any).connection;
      const isSlowConnection = connection && 
        (connection.effectiveType === 'slow-2g' || 
         connection.effectiveType === '2g' || 
         connection.downlink < 0.5);
         
      if (isSlowConnection) {
        console.log('[RoutePreloader] Skipping preload - Slow connection detected');
        return;
      }
    }
    
    // Filter out already preloaded routes
    const routesToPreload = routes.filter(route => !hasPreloaded.current.has(route));
    if (!routesToPreload.length) return;
    
    // Set up preloading with delay
    const preloadTimeout = setTimeout(() => {
      // Create a queue for controlled concurrency
      const preloadQueue = async () => {
        // Preload in batches based on concurrency limit
        for (let i = 0; i < routesToPreload.length; i += concurrency) {
          const batch = routesToPreload.slice(i, i + concurrency);
          
          // Preload batch concurrently
          await Promise.all(
            batch.map(async (route) => {
              try {
                const startTime = performance.now();
                console.log(`[RoutePreloader] Preloading route: ${route}`);
                
                // Use router to prefetch the route
                router.prefetch(route);
                
                // Mark as preloaded
                hasPreloaded.current.add(route);
                
                // Record performance metrics for the preload operation
                const duration = performance.now() - startTime;
                recordNavigation(route, duration, 'prefetch');
              } catch (err) {
                console.error(`[RoutePreloader] Failed to preload ${route}:`, err);
                
                // Still mark as attempted to avoid repeated failures
                hasPreloaded.current.add(route);
                
                // Record failed attempt with negative duration to indicate error
                recordNavigation(route, -1, 'prefetch');
              }
            })
          );
          
          // Small delay between batches to avoid overwhelming the browser
          if (i + concurrency < routesToPreload.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      };
      
      // Start preloading
      preloadQueue();
    }, preloadDelay);
    
    // Clean up if component unmounts before preloading starts
    return () => clearTimeout(preloadTimeout);
  }, [
    routes,
    router,
    preloadDelay,
    concurrency,
    disableOnSlowConnection,
    respectDataSaver,
    enabled
  ]);
  
  // This component doesn't render anything
  return null;
} 