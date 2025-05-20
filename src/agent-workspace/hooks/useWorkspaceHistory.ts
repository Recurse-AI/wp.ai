import { useState, useEffect, useCallback } from 'react';
import apiClient from '../utils/apiClient';

export interface Message {
  id: string;
  workspace: string;
  sender: string;
  text: string;
  tools_invoked: any[];
  timestamp: string;
}

export interface Workspace {
  id: string;
  name: string;
  user: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_activity: string;
}

export interface WorkspaceHistory {
  workspace_id: string;
  workspace_name: string;
  messages: Message[];
  count: number;
}

export interface UserWorkspaces {
  workspaces: Workspace[];
  count: number;
}

/**
 * Custom hook for fetching workspace history data and user workspaces
 */
export const useWorkspaceHistory = (workspaceId?: string) => {
  const [history, setHistory] = useState<WorkspaceHistory | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches message history for a specific workspace
   */
  const fetchWorkspaceHistory = useCallback(async (workspaceId: string) => {
    if (!workspaceId) return;

    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching workspace history with URL:', `/api/workspace/agent-workspace/${workspaceId}/history/`);
      
      const response = await apiClient.get(`/api/workspace/agent-workspace/${workspaceId}/history/`);
      
      if (response.data.success) {
        setHistory(response.data);
      } else {
        setError(response.data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error fetching workspace history:', err);
      setError('Failed to load workspace history');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetches all workspaces for the current user
   */
  const fetchUserWorkspaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`/api/workspace/agent-workspace/user-workspaces/`);
      
      if (response.data.success) {
        setWorkspaces(response.data.workspaces);
      } else {
        setError(response.data.error || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error fetching user workspaces:', err);
      setError('Failed to load user workspaces');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Deletes a workspace by ID
   */
  const deleteWorkspace = useCallback(async (workspaceIdToDelete: string) => {
    if (!workspaceIdToDelete) return false;
    
    // Prevent deletion of the active workspace
    if (workspaceIdToDelete === workspaceId) {
      setError('Cannot delete the currently active workspace');
      return false;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.delete(`/api/workspace/agent-workspace/${workspaceIdToDelete}/delete/`);
      
      if (response.data.success) {
        // Update workspaces list by removing the deleted workspace
        setWorkspaces(prevWorkspaces => 
          prevWorkspaces.filter(workspace => workspace.id !== workspaceIdToDelete)
        );
        return true;
      } else {
        setError(response.data.error || 'Failed to delete workspace');
        return false;
      }
    } catch (err) {
      console.error('Error deleting workspace:', err);
      setError('Failed to delete workspace');
      return false;
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Load workspace history when ID is provided
  useEffect(() => {
    if (workspaceId) {
      fetchWorkspaceHistory(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceHistory]);

  return {
    history,
    workspaces,
    loading,
    error,
    fetchWorkspaceHistory,
    fetchUserWorkspaces,
    deleteWorkspace
  };
}; 