"use client";

import { useSearchParams } from 'next/navigation';
import { AgentWorkspace } from '@/agent-workspace';
import { useAuthContext } from '@/context/AuthProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AgentWorkspacePage() {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get('service');
  const { isAuthenticated, loading } = useAuthContext();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated) {
      // Redirect to sign in if not authenticated
      router.push('/signin?callbackUrl=/agent-workspace');
      return;
    }
    
    setIsAuthChecking(false);
  }, [isAuthenticated, loading, router]);

  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <AgentWorkspace preloadedService={serviceParam || undefined} />
    </div>
  );
} 