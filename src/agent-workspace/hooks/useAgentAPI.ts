"use client";

import { useState, useCallback } from 'react';
import { AgentMessage, AgentFile, FileNode } from '../types';
import { toast } from 'react-hot-toast';

export function useAgentAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to send a message to the agent
  const sendMessage = useCallback(async (
    message: string, 
    files: Record<string, FileNode>,
    onMessageReceived?: (message: AgentMessage) => void
  ): Promise<AgentMessage | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call your API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/agent/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message,
          files,
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from agent');
      }
      
      const data = await response.json();
      
      if (onMessageReceived) {
        onMessageReceived(data.message);
      }
      
      return data.message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      console.error('Agent API error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to generate code based on prompt
  const generateCode = useCallback(async (
    prompt: string,
    serviceId: string,
    onCodeGenerated?: (files: Record<string, FileNode>) => void
  ): Promise<Record<string, FileNode> | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call your API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/agent/generate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          prompt,
          serviceId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate code');
      }
      
      const data = await response.json();
      
      if (onCodeGenerated) {
        onCodeGenerated(data.files);
      }
      
      return data.files;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      console.error('Code generation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to save workspace to the server
  const saveWorkspace = useCallback(async (
    workspaceId: string,
    name: string,
    files: Record<string, FileNode>,
    messages: AgentMessage[]
  ): Promise<{ success: boolean; workspaceId?: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, this would call your API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          id: workspaceId,
          name,
          files,
          messages
        })
      });
      
      if (!response.ok) {
        // Check the content type before attempting to parse JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save workspace');
        } else {
          const errorText = await response.text();
          throw new Error(`Failed to save workspace: ${response.status} ${response.statusText}\n${errorText.substring(0, 100)}...`);
        }
      }
      
      // Check content type before attempting to parse JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error('Server did not return a valid JSON response');
      }
      
      toast.success('Workspace saved successfully');
      
      return { 
        success: true,
        workspaceId: data.workspaceId
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      console.error('Workspace save error:', err);
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    sendMessage,
    generateCode,
    saveWorkspace
  };
} 