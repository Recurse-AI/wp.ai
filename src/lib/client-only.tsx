'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

// This component ensures content is only rendered on the client side
// which helps prevent hydration mismatch errors
export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // On the server or during first render, return the fallback
  if (!isClient) {
    return <>{fallback}</>;
  }

  // On the client, render children with hydration warning suppressed
  return <div suppressHydrationWarning>{children}</div>;
} 