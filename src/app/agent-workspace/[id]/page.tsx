"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import AgentWorkspace from '@/agent-workspace/components/AgentWorkspace';
import { useWorkspaceHistory } from '@/agent-workspace/hooks/useWorkspaceHistory';

// Define message interface
interface Message {
  id: string;
  workspace: string;
  sender: string;
  text: string;
  tools_invoked: any[];
  timestamp: string;
}

// Define workspace history interface
interface WorkspaceHistory {
  workspace_id: string;
  workspace_name: string;
  messages: Message[];
  count: number;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<WorkspaceHistory | null>(null);


  // Use our history hook for loading workspace data
  const { 
    history: workspaceHistory,
    loading: historyLoading,
    error: historyError,
    fetchWorkspaceHistory
  } = useWorkspaceHistory(workspaceId);

 

  useEffect(() => {
    // Don't proceed if not authenticated
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workspaceId)) {
      setLoading(false);
      return;
    }

    // Fetch workspace history when the component mounts
    const loadWorkspaceHistory = async () => {
      try {
        await fetchWorkspaceHistory(workspaceId);
      } catch (err: any) {
        console.error('Error loading workspace history:', err);
      
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceHistory();
  }, [workspaceId, fetchWorkspaceHistory]);

  // Update local history when the hook data changes
  useEffect(() => {
    if (workspaceHistory) {
      setHistory(workspaceHistory);
    }
    if (!historyLoading) {
      setLoading(false);
    }
  }, [workspaceHistory, historyLoading]);




  // Regular loading state
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-primary/20 bg-primary/10 p-6 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <h2 className="mt-4 text-xl font-semibold">Loading Workspace</h2>
          <p className="mt-2 text-muted-foreground">Retrieving your conversation history...</p>
        </div>
      </div>
    );
  }


  // Pass the preloaded history to the AgentWorkspace component
  return <AgentWorkspace 
    workspaceId={workspaceId} 
    preloadedService=""
    preloadedHistory={history}
  />;
} 