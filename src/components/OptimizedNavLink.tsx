"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { recordNavigation } from '@/utils/performanceMonitoring';

interface OptimizedNavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  prefetch?: boolean;
  trackPerformance?: boolean;
  ariaLabel?: string;
  scroll?: boolean;
  replace?: boolean;
  target?: string;
  priority?: boolean;
}

/**
 * OptimizedNavLink is a performance-optimized version of Next.js Link
 * It uses direct router navigation for faster internal page changes
 * while maintaining the Link component's features.
 */
export default function OptimizedNavLink({
  href,
  children,
  className,
  onClick,
  prefetch = true,
  trackPerformance = true,
  ariaLabel,
  scroll = true,
  replace = false,
  target,
  priority = false,
  ...props
}: OptimizedNavLinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const startTimeRef = useRef<number>(0);
  
  // Performance tracking
  const trackNavigationStart = useCallback(() => {
    if (!trackPerformance) return;
    startTimeRef.current = performance.now();
    console.log(`[Navigation] Starting navigation to ${href}`);
  }, [href, trackPerformance]);
  
  const trackNavigationEnd = useCallback(() => {
    if (!trackPerformance || !startTimeRef.current) return;
    const duration = performance.now() - startTimeRef.current;
    
    // Use the performance monitoring system
    recordNavigation(href, duration, replace ? 'replace' : 'push');
    
    console.log(`[Navigation] Completed navigation to ${href} in ${duration.toFixed(2)}ms`);
    startTimeRef.current = 0;
  }, [href, trackPerformance, replace]);

  // Prefetch route if enabled
  useEffect(() => {
    if (prefetch && 
        router && 
        typeof window !== 'undefined' && 
        !href.startsWith('http') && 
        !href.startsWith('//')) {
      // Simple prefetch - Next.js router handles the options internally
      router.prefetch(href);
    }
  }, [href, prefetch, router, priority]);
  
  // Handle fast navigation for internal links
  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't intercept if modifier keys are pressed or it's an external link
    if (
      e.ctrlKey || 
      e.metaKey || 
      e.altKey || 
      e.shiftKey || 
      (target && target !== '_self') ||
      href.startsWith('http') || 
      href.startsWith('//')
    ) {
      if (onClick) onClick(e);
      return;
    }
    
    e.preventDefault();
    if (onClick) onClick(e);
    
    // Set navigating state and track start time
    setIsNavigating(true);
    trackNavigationStart();
    
    // Use direct router navigation for better performance
    if (replace) {
      router.replace(href);
    } else {
      router.push(href);
    }
    
    if (scroll) {
      window.scrollTo(0, 0);
    }
    
    // Reset state and track performance after navigation
    window.setTimeout(() => {
      setIsNavigating(false);
      trackNavigationEnd();
    }, 100);
  }, [href, onClick, replace, router, scroll, target, trackNavigationEnd, trackNavigationStart]);
  
  // For accessibility and UI feedback
  const linkClasses = cn(
    className,
    isNavigating && 'opacity-80 pointer-events-none'
  );
  
  return (
    <Link
      href={href}
      className={linkClasses}
      onClick={handleClick}
      prefetch={prefetch}
      aria-label={ariaLabel}
      target={target}
      {...props}
    >
      {children}
    </Link>
  );
} 