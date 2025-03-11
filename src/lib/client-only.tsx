'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// This component ensures content is only rendered on the client side
// and handles hydration mismatches
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Set a small delay to ensure proper hydration
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Show fallback or loading state during server-side rendering and initial mount
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {fallback || (
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <div className="w-12 h-12 bg-blue-400/20 rounded-full"></div>
            <div className="h-4 w-24 bg-blue-400/20 rounded"></div>
          </div>
        )}
      </div>
    );
  }

  // On the client, render children with hydration warning suppressed
  return <div suppressHydrationWarning>{children}</div>;
} 