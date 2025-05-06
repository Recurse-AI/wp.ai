"use client";

import { useEffect, Suspense } from 'react';
import Providers from './Providers';
import ErrorBoundary from '../ErrorBoundary';
import { initPerformanceMonitoring } from '@/utils/performanceMonitoring';
import RoutePreloader from '@/components/RoutePreloader';
import dynamic from 'next/dynamic';

// Dynamic import for OptimizedNavLink to use in the entire app
// This makes it available globally while avoiding circular dependencies
const OptimizedNavLink = dynamic(
  () => import('@/components/OptimizedNavLink'),
  { ssr: false }
);

// Critical routes to preload for better navigation
const CRITICAL_ROUTES = [
  '/agent-workspace',
  '/chat',
  '/',
  '/signin',
  '/signup'
];

// Loading component for Suspense fallback
function PageLoading() {
  return (
    <div className="h-full flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // Initialize performance monitoring
  useEffect(() => {
    // Initialize performance monitoring
    initPerformanceMonitoring();
    
    // Make the OptimizedNavLink available globally
    if (typeof window !== 'undefined') {
      (window as any).OptimizedNavLink = OptimizedNavLink;
    }
  }, []);

  return (
    <ErrorBoundary>
      <Providers>
        <div className="flex flex-col flex-1 h-full">
          <Suspense fallback={<PageLoading />}>
            {children}
          </Suspense>
          
          {/* Preload critical routes for faster navigation */}
          <RoutePreloader 
            routes={CRITICAL_ROUTES}
            preloadDelay={2000} // Decreased from 3000 for faster preloading
            concurrency={2}
          />
        </div>
      </Providers>
    </ErrorBoundary>
  );
} 