"use client";

import React, { use } from 'react';
import AgentWorkspace from '@/agent-workspace/components/AgentWorkspace';
import { useAuthContext } from '@/context/AuthProvider';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AgentWorkspaceWithIdPage({
  params,
}: {
  params: any;
}) {
  // Unwrap params with React.use() as required by Next.js 15+
  const unwrappedParams = use(params) as { id: string };
  const { id } = unwrappedParams;
  const { isAuthenticated, loading } = useAuthContext();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    if (loading) return;
    
    if (!isAuthenticated) {
      // Redirect to sign in if not authenticated
      router.push(`/signin?callbackUrl=/agent-workspace/${id}`);
      return;
    }
    
    setIsAuthChecking(false);
  }, [isAuthenticated, loading, router, id]);

  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <AgentWorkspace workspaceId={id} />
    </div>
  );
} 