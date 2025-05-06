"use client";

import { useSearchParams } from 'next/navigation';
import { AgentWorkspace } from '@/agent-workspace';
import { useAuthContext } from '@/context/AuthProvider';
import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';

function AgentWorkspaceContent() {
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get('service');
  const { isAuthenticated, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/signin?callbackUrl=/agent-workspace');
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="flex-1 h-full w-full overflow-hidden">
      <AgentWorkspace preloadedService={serviceParam || undefined} />
    </div>
  );
}

export default function AgentWorkspacePage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center h-full">Loading...</div>}>
      <AgentWorkspaceContent />
    </Suspense>
  );
} 