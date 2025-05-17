"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import AgentWorkspace from '@/agent-workspace/components/AgentWorkspace';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function WorkspacePage() {
  const params = useParams();
  const workspaceId = params.id as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workspaceId)) {
      setError('Invalid workspace ID format');
    }
  }, [workspaceId]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-destructive bg-destructive/10 p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-xl font-semibold">Workspace Error</h2>
          <p className="mt-2 text-muted-foreground">{error}</p>
          <Link 
            href="/"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return <AgentWorkspace workspaceId={workspaceId} />;
} 