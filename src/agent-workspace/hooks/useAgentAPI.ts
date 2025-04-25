"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { AgentMessage, FileNode, AgentFile } from '../types';
import { toast } from 'react-hot-toast';
import { getApiService, getSocketService } from '../utils/serviceFactory';
import { WebSocketEventType, WebSocketMessage } from '../utils/websocketService';

export function useAgentAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const messageListeners = useRef<Record<string, ((data: WebSocketMessage) => void)[]>>({});
  const reconnectCountRef = useRef(0);
  const maxReconnectAttempts = 3;

  // Handle WebSocket events
  useEffect(() => {
    // Process status handler
    const processingStatusHandler = (data: WebSocketMessage) => {
      if (data.status === 'started') {
        setIsProcessing(true);
      } else if (data.status === 'completed' || data.status === 'failed') {
        setIsProcessing(false);
      }
    };

    // AI error handler
    const aiErrorHandler = (data: WebSocketMessage) => {
      if (data.error) {
        setError(data.error.message);
        toast.error(`Error: ${data.error.message}`);
        setIsProcessing(false);
      }
    };

    // Connection established handler
    const connectionEstablishedHandler = (data: WebSocketMessage) => {
      console.log(`Connection established for workspace: ${data.workspace_id}`);
      setIsSocketConnected(true);
      reconnectCountRef.current = 0;
      
      // If we have a workspace ID in the message, make sure it's set as current
      if (data.workspace_id) {
        setCurrentWorkspaceId(data.workspace_id);
      }
    };

    // Reconnect failed handler
    const reconnectFailedHandler = (data: any) => {
      setIsSocketConnected(false);
      setError('Connection to agent server lost');
      toast.error('Connection to agent server lost. Please reload the page.');
    };

    // Add event listeners
    const socketService = getSocketService();
    socketService.on(WebSocketEventType.PROCESSING_STATUS, processingStatusHandler);
    socketService.on(WebSocketEventType.AI_ERROR, aiErrorHandler);
    socketService.on(WebSocketEventType.CONNECTION_ESTABLISHED, connectionEstablishedHandler);
    socketService.on('reconnect_failed', reconnectFailedHandler);

    // Cleanup on unmount
    return () => {
      socketService.removeListener(WebSocketEventType.PROCESSING_STATUS, processingStatusHandler);
      socketService.removeListener(WebSocketEventType.AI_ERROR, aiErrorHandler);
      socketService.removeListener(WebSocketEventType.CONNECTION_ESTABLISHED, connectionEstablishedHandler);
      socketService.removeListener('reconnect_failed', reconnectFailedHandler);
    };
  }, []);

  // Connect to workspace WebSocket
  const connectToWorkspace = useCallback(async (workspaceId: string, retry = true): Promise<void> => {
    if (!workspaceId) {
      console.error('Cannot connect to workspace: Invalid workspace ID');
      setError('Invalid workspace ID');
      throw new Error('Invalid workspace ID');
    }
    
    // Get a reference to the socket service once for all operations
    const socketService = getSocketService();
    
    // Check if we're already connected to this workspace
    if (socketService.isConnectedToWorkspace(workspaceId)) {
      console.log(`Already connected to workspace: ${workspaceId}`);
      setIsSocketConnected(true);
      setCurrentWorkspaceId(workspaceId);
      return;
    }
    
    // If we need to switch workspaces, disconnect from the current one first
    if (currentWorkspaceId && currentWorkspaceId !== workspaceId) {
      console.log(`Switching workspace connection from ${currentWorkspaceId} to ${workspaceId}`);
      // No need to explicitly disconnect - the WebSocketService.connect method will handle this
    }
    
    try {
      console.log(`Attempting to connect to workspace: ${workspaceId}`);
      
      // The WebSocketService now handles duplicate connection attempts internally
      await socketService.connect(workspaceId);
      
      console.log(`Successfully connected to workspace: ${workspaceId}`);
      setCurrentWorkspaceId(workspaceId);
      setIsSocketConnected(true);
      reconnectCountRef.current = 0;
    } catch (err) {
      console.error('Failed to connect to workspace:', err);
      setIsSocketConnected(false);
      
      // Implement retry logic
      if (retry && reconnectCountRef.current < maxReconnectAttempts) {
        reconnectCountRef.current += 1;
        const delay = Math.min(1000 * Math.pow(2, reconnectCountRef.current), 8000);
        
        console.log(`Retrying connection to workspace (${reconnectCountRef.current}/${maxReconnectAttempts})...`);
        
        // Return a promise that resolves when the retry succeeds or rejects after all retries fail
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            try {
              await connectToWorkspace(workspaceId, true);
              resolve();
            } catch (e) {
              if (reconnectCountRef.current >= maxReconnectAttempts) {
                const errorMsg = 'Failed to connect to workspace after multiple attempts';
                setError(errorMsg);
                toast.error('Connection error. Please check your network and reload the page.');
                reject(new Error(errorMsg));
              } else {
                reject(e);
              }
            }
          }, delay);
        });
      } else {
        setError('Failed to connect to workspace');
        throw err;
      }
    }
  }, [currentWorkspaceId, maxReconnectAttempts]);

  // Create a new workspace
  const createWorkspace = useCallback(async (
    name: string,
    description?: string,
    metadata?: Record<string, any>
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Creating new workspace with name: ${name}`);
      
      const result = await getApiService().createWorkspace({
        name,
        description,
        metadata
      });
      
      // Log the full response for debugging
      console.log('API response for workspace creation:', result);
      
      // Ensure we have a valid workspace ID before proceeding
      if (!result) {
        throw new Error('Server returned no response when creating workspace');
      }
      
      if (!result.workspaceId) {
        // Log more details about the response structure
        console.error('Server response missing workspaceId:', result);
        throw new Error(`Server response doesn't contain a workspace ID. Response keys: ${Object.keys(result).join(', ')}`);
      }
      
      console.log(`Server returned workspace ID: ${result.workspaceId}`);
      
      // Connect to the workspace WebSocket only if we have a valid ID
      if (result.workspaceId) {
        try {
          await connectToWorkspace(result.workspaceId);
          console.log(`Successfully connected to workspace: ${result.workspaceId}`);
        } catch (connErr) {
          console.error(`Failed to connect to workspace ${result.workspaceId}:`, connErr);
          // Continue despite connection error - we can try to reconnect later
          // The ID is still valid even if connection failed
        }
      }
      
      return result.workspaceId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error(`Error creating workspace: ${errorMessage}`);
      
      // Check if its a network error
      if (err instanceof Error && (err.message.includes('network') || err.message.includes('fetch'))) {
        console.error('Network error detected - is the backend server running?');
        setError('Network error: Unable to reach the server. Please check if the backend is running.');
        toast.error('Network error: Unable to reach the server');
      } else {
        setError(errorMessage);
        toast.error(`Error: ${errorMessage}`);
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connectToWorkspace]);

  // Function to send a message to the agent
  const sendMessage = useCallback(async (
    workspaceId: string,
    message: string, 
    codeBlocks?: { language: string; code: string }[],
    onThinkingUpdate?: (thinking: string) => void,
    onTextUpdate?: (text: string) => void
  ): Promise<{ messageId: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Ensure we're connected to the workspace
      if (!getSocketService().isConnectedToWorkspace(workspaceId)) {
        await connectToWorkspace(workspaceId);
      }
      
      // Set up message-specific listeners if callbacks provided
      if (onThinkingUpdate || onTextUpdate) {
        const thinkingHandler = (data: WebSocketMessage) => {
          if (data.message_id && data.thinking && onThinkingUpdate) {
            onThinkingUpdate(data.thinking);
          }
        };
        
        const textHandler = (data: WebSocketMessage) => {
          if (data.message_id && data.text && onTextUpdate) {
            onTextUpdate(data.text);
          }
        };
        
        // Add event listeners
        getSocketService().on(WebSocketEventType.THINKING_UPDATE, thinkingHandler);
        getSocketService().on(WebSocketEventType.TEXT_UPDATE, textHandler);
        
        // Store the listeners for later removal
        if (!messageListeners.current[WebSocketEventType.THINKING_UPDATE]) {
          messageListeners.current[WebSocketEventType.THINKING_UPDATE] = [];
        }
        if (!messageListeners.current[WebSocketEventType.TEXT_UPDATE]) {
          messageListeners.current[WebSocketEventType.TEXT_UPDATE] = [];
        }
        
        messageListeners.current[WebSocketEventType.THINKING_UPDATE].push(thinkingHandler);
        messageListeners.current[WebSocketEventType.TEXT_UPDATE].push(textHandler);
      }
      
      // Send the message to the agent
      const result = await getApiService().sendMessage(workspaceId, {
        message,
        codeBlocks
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connectToWorkspace]);

  // Create a file in the workspace
  const createFile = useCallback(async (
    workspaceId: string,
    path: string,
    content: string
  ): Promise<{ fileId: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await getApiService().createFile(workspaceId, path, content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update file content
  const updateFileContent = useCallback(async (
    fileId: string,
    content: string
  ): Promise<{ success: boolean }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await getApiService().updateFileContent(fileId, content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error: ${errorMessage}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set active file in workspace
  const setActiveFile = useCallback(async (
    workspaceId: string,
    fileId: string
  ): Promise<{ success: boolean }> => {
    setError(null);
    
    try {
      return await getApiService().setActiveFile(workspaceId, fileId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Failed to set active file:', err);
      return { success: false };
    }
  }, []);

  // Cleanup function to remove all message listeners
  const cleanupMessageListeners = useCallback(() => {
    Object.entries(messageListeners.current).forEach(([eventType, listeners]) => {
      listeners.forEach(listener => {
        getSocketService().removeListener(eventType, listener);
      });
    });
    
    // Reset the listeners
    messageListeners.current = {};
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupMessageListeners();
      
      // Disconnect from WebSocket if connected
      if (currentWorkspaceId) {
        getSocketService().disconnect();
      }
    };
  }, [currentWorkspaceId, cleanupMessageListeners]);

  // Check WebSocket connection status periodically
  useEffect(() => {
    if (!currentWorkspaceId) return;
    
    // Track consecutive connection check failures to avoid triggering on temporary glitches
    let consecutiveFailures = 0;
    const requiredFailures = 2; // Require multiple consecutive failures before reconnecting
    
    const checkConnectionInterval = setInterval(() => {
      const isConnected = getSocketService().isConnectedToWorkspace(currentWorkspaceId);
      
      // If connected, reset the failure counter
      if (isConnected) {
        consecutiveFailures = 0;
        
        // Ensure state reflects connected status
        if (!isSocketConnected) {
          setIsSocketConnected(true);
        }
        return;
      }
      
      // Only count as a failure if we were previously connected
      if (isSocketConnected) {
        consecutiveFailures++;
        console.log(`Connection check failure ${consecutiveFailures}/${requiredFailures}`);
        
        // Only attempt reconnection after multiple consecutive failures
        if (consecutiveFailures >= requiredFailures) {
          setIsSocketConnected(false);
          console.log('WebSocket connection lost, attempting to reconnect...');
          
          if (reconnectCountRef.current < maxReconnectAttempts) {
            // Add a delay before reconnection to avoid race conditions
            setTimeout(() => {
              connectToWorkspace(currentWorkspaceId, true).catch(console.error);
            }, 1000);
          }
        }
      }
    }, 10000); // Check every 10 seconds
    
    return () => {
      clearInterval(checkConnectionInterval);
    };
  }, [currentWorkspaceId, isSocketConnected, connectToWorkspace, maxReconnectAttempts]);

  return {
    isLoading,
    isProcessing,
    error,
    isSocketConnected,
    createWorkspace,
    connectToWorkspace,
    sendMessage,
    createFile,
    updateFileContent,
    setActiveFile,
    cleanupMessageListeners
  };
} 