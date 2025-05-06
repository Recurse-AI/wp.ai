"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { AgentMessage, FileNode, AgentFile } from '../types';
import { toast } from 'react-hot-toast';
import { getApiService, getSocketService } from '../utils/serviceFactory';
import { WebSocketEventType, WebSocketMessage } from '../utils/websocketService';
import { agentAPI } from '../utils/apiService';
import { v4 as uuidv4 } from 'uuid';

export function useAgentAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const currentWorkspaceIdRef = useRef<string | null>(null);
  const reconnectCountRef = useRef(0);
  const maxReconnectAttempts = 3;
  const activeTool = useRef<string | null>(null);
  const messageListeners = useRef<Record<string, ((...args: any[]) => void)[]>>({});

  // Add message listener helper function
  const addMessageListener = useCallback((eventType: string, listener: (...args: any[]) => void) => {
    getSocketService().on(eventType, listener);
    
    if (!messageListeners.current[eventType]) {
      messageListeners.current[eventType] = [];
    }
    
    messageListeners.current[eventType].push(listener);
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
        currentWorkspaceIdRef.current = data.workspace_id;
      }
    };

    // Reconnect failed handler
    const reconnectFailedHandler = (data: any) => {
      setIsSocketConnected(false);
      setError('Connection to agent server lost');
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
      currentWorkspaceIdRef.current = workspaceId;
      return;
    }
    
    // If we need to switch workspaces, disconnect from the current one first
    if (currentWorkspaceIdRef.current && currentWorkspaceIdRef.current !== workspaceId) {
      console.log(`Switching workspace connection from ${currentWorkspaceIdRef.current} to ${workspaceId}`);
      // No need to explicitly disconnect - the WebSocketService.connect method will handle this
    }
    
    try {
      console.log(`Attempting to connect to workspace: ${workspaceId}`);
      
      // The WebSocketService now handles duplicate connection attempts internally
      await socketService.connect(workspaceId);
      
      console.log(`Successfully connected to workspace: ${workspaceId}`);
      currentWorkspaceIdRef.current = workspaceId;
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
                // Only show toast for critical connection failures, not intermediate ones
                if (!retry) {
                  toast.error('Connection error. Please check your network and reload the page.');
                }
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
  }, [maxReconnectAttempts]);

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
        // Keep this critical error toast since it's important for users to know
        toast.error('Network error: Unable to reach the server');
      } else {
        setError(errorMessage);
        // Keep critical error information but don't show for common cases
        if (!errorMessage.includes('timeout') && !errorMessage.includes('connection')) {
          toast.error(`Error: ${errorMessage}`);
        }
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [connectToWorkspace]);

  // Send a message to the agent and handle streaming responses
  const sendMessage = useCallback(async (
    workspaceId: string,
    message: string,
    codeBlocks?: { language: string; code: string }[],
    onThinkingUpdate?: (thinking: string) => void,
    onTextUpdate?: (text: string) => void
  ): Promise<{ messageId?: string }> => {
    try {
      console.log(`Sending message to workspace: ${workspaceId}`);
      
      // Set current workspace ID for tracking
      currentWorkspaceIdRef.current = workspaceId;
      
      // Set loading state
      setIsLoading(true);
      setIsProcessing(true);
      setError(null);
      
      // Connect to workspace via WebSocket if not already connected
      const socketService = getSocketService();
      if (!socketService.isConnectedToWorkspace(workspaceId)) {
        console.log(`Not connected to workspace ${workspaceId}, connecting now...`);
        try {
          await socketService.connect(workspaceId);
          console.log(`Successfully connected to workspace ${workspaceId}`);
        } catch (connErr) {
          console.error(`Failed to connect to workspace ${workspaceId}:`, connErr);
          throw new Error(`WebSocket connection failed: ${connErr instanceof Error ? connErr.message : String(connErr)}`);
        }
      } else {
        console.log(`Already connected to workspace ${workspaceId}`);
      }
      
      // Create message event listeners
      // Remove existing listeners first to prevent duplicates
      cleanupMessageListeners();
      
      let messageId: string | undefined;
      let completeResponse = '';
      let completeThinking = '';
      
      // Add event listener for processing status
      const processingListener = (data: any) => {
        console.log('Received processing status:', data);
        
        if (data.message_id) {
          messageId = data.message_id;
        }
        
        setIsProcessing(data.is_processing);
        
        if (data.has_error) {
          const errorMsg = data.error_message || 'An error occurred while processing your request';
          setError(errorMsg);
          toast.error(`Error: ${errorMsg}`);
        }
      };
      addMessageListener(WebSocketEventType.PROCESSING_STATUS, processingListener);
      
      // Add event listener for thinking updates
      const thinkingListener = (data: any) => {
        if (data.thinking && onThinkingUpdate) {
          // Append to complete thinking for context
          completeThinking += data.thinking;
          
          // Call the callback with the update
          onThinkingUpdate(data.thinking);
        }
      };
      addMessageListener(WebSocketEventType.THINKING_UPDATE, thinkingListener);
      
      // Add event listener for text updates
      const textListener = (data: any) => {
        if (data.text && onTextUpdate) {
          // Append to complete response
          completeResponse += data.text;
          
          // Call the callback with just the update chunk
          onTextUpdate(data.text);
        }
      };
      addMessageListener(WebSocketEventType.TEXT_UPDATE, textListener);
      
      // Add event listener for AI errors
      const errorListener = (data: any) => {
        if (data.error) {
          const errorMessage = typeof data.error === 'string' 
            ? data.error 
            : data.error.message || 'Unknown error';
            
          setError(errorMessage);
          toast.error(`Error: ${errorMessage}`);
          setIsProcessing(false);
        }
      };
      addMessageListener(WebSocketEventType.AI_ERROR, errorListener);
      
      // Add event listener for agent responses
      const agentResponseListener = (data: any) => {
        console.log('Received agent response:', data);
        
        // If we get a direct response (not streaming), store it
        if (data.response && typeof data.response === 'string') {
          completeResponse = data.response;
          
          // If we have an onTextUpdate callback, call it with the complete response
          if (onTextUpdate) {
            onTextUpdate(data.response);
          }
        }
        
        // Response complete, reset processing state
        setIsProcessing(false);
        
        // Clear the active tool
        activeTool.current = null;
      };
      addMessageListener(WebSocketEventType.AGENT_RESPONSE, agentResponseListener);
      
      // Add event listener for tool results
      const toolResultListener = (data: any) => {
        console.log('Received tool result:', data);
        
        // Update active tool for UI feedback
        if (data.tool_name) {
          activeTool.current = data.tool_name;
          
          // Show tool being called in the thinking as well
          if (onThinkingUpdate) {
            const toolMessage = `\n\nCalling tool: ${data.tool_name}\n`;
            completeThinking += toolMessage;
            onThinkingUpdate(toolMessage);
            
            // If we have a result, add that to thinking too
            if (data.result) {
              let resultStr = '';
              try {
                // Format the result for display
                if (typeof data.result === 'string') {
                  resultStr = data.result;
                } else {
                  resultStr = JSON.stringify(data.result, null, 2);
                }
                
                const resultMessage = `\nTool result:\n${resultStr}\n`;
                completeThinking += resultMessage;
                onThinkingUpdate(resultMessage);
              } catch (e) {
                // Just log any errors during result formatting, don't interrupt the process
                console.error('Error formatting tool result:', e);
              }
            }
          }
          
          // Clear active tool after a brief delay
          setTimeout(() => {
            if (activeTool.current === data.tool_name) {
              activeTool.current = null;
            }
          }, 2000);
        }
      };
      addMessageListener(WebSocketEventType.TOOL_RESULT, toolResultListener);
      
      // Add event listener for file updates
      const fileUpdateListener = (data: any) => {
        console.log('Received file update:', data);
        
        // Add file update to thinking if available
        if (data.file && onThinkingUpdate) {
          const fileUpdateMessage = `\nFile updated: ${data.file.path}\n`;
          completeThinking += fileUpdateMessage;
          onThinkingUpdate(fileUpdateMessage);
        }
      };
      addMessageListener(WebSocketEventType.FILE_UPDATE, fileUpdateListener);
      
      // Progress timeout - if no update in 60 seconds, show a warning but don't fail
      const progressTimeout = setTimeout(() => {
        if (isProcessing) {
          console.warn('No progress updates received for 60 seconds');
          if (onThinkingUpdate) {
            const timeoutMsg = '\n\nThe operation is taking longer than expected. Still processing...\n';
            completeThinking += timeoutMsg;
            onThinkingUpdate(timeoutMsg);
          }
        }
      }, 60000);
      
      // Send the message via WebSocket with retry on failure
      const sendMessageWithRetry = async (retries = 1): Promise<void> => {
        const success = socketService.send({
          type: 'query_agent',
          query: message,
          mode: 'chat'
        });
        
        if (!success && retries > 0) {
          console.log(`Failed to send message, retrying (${retries} attempts left)...`);
          
          // Wait briefly before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check connection and reconnect if needed
          if (!socketService.isConnectedToWorkspace(workspaceId)) {
            try {
              console.log('Reconnecting to workspace before retry...');
              await socketService.connect(workspaceId);
            } catch (err) {
              console.error('Reconnection failed:', err);
            }
          }
          
          // Retry send
          return sendMessageWithRetry(retries - 1);
        } else if (!success) {
          throw new Error('Failed to send message via WebSocket after retries');
        }
      };
      
      // Send the message with retry
      await sendMessageWithRetry(2);
      
      // Clean up the timeout when done or on error
      clearTimeout(progressTimeout);
      
      return { messageId };
    } catch (err) {
      console.error('Error sending message via WebSocket:', err);
      
      setError(err instanceof Error ? err.message : `${err}`);
      setIsProcessing(false);
      setIsLoading(false);
      
      // Notify user about the error
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addMessageListener, cleanupMessageListeners]);

  // Create a file in the workspace
  const createFile = useCallback(async (
    workspaceId: string,
    path: string,
    content: string
  ): Promise<{ fileId: string }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await getApiService().createFile(workspaceId, { path, content });
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

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupMessageListeners();
      
      // Disconnect from WebSocket if connected
      if (currentWorkspaceIdRef.current) {
        getSocketService().disconnect();
      }
    };
  }, [cleanupMessageListeners]);

  // Check WebSocket connection status periodically
  useEffect(() => {
    if (!currentWorkspaceIdRef.current) return;
    
    // Track consecutive connection check failures to avoid triggering on temporary glitches
    let consecutiveFailures = 0;
    const failureThreshold = 3; // Number of consecutive failures before trying to reconnect
    
    const checkConnectionInterval = setInterval(() => {
      const isConnected = getSocketService().isConnectedToWorkspace(currentWorkspaceIdRef.current || '');
      
      // If connected, reset the failure counter
      if (isConnected) {
        consecutiveFailures = 0;
        if (!isSocketConnected) {
          setIsSocketConnected(true);
        }
      } else {
        // Not connected, increment counter
        consecutiveFailures++;
        
        if (isSocketConnected) {
          setIsSocketConnected(false);
        }
        
        // Only try to reconnect after multiple consecutive failures to avoid
        // unnecessary reconnection attempts on temporary network glitches
        if (consecutiveFailures >= failureThreshold) {
          console.log(`${consecutiveFailures} consecutive connection failures detected. Attempting reconnect...`);
          
          // Only try to reconnect if we're not already at the maximum attempts
          if (reconnectCountRef.current < maxReconnectAttempts) {
            reconnectCountRef.current++;
            
            // Add a delay before reconnection to avoid race conditions
            setTimeout(() => {
              if (currentWorkspaceIdRef.current) {
                connectToWorkspace(currentWorkspaceIdRef.current, true).catch(console.error);
              }
            }, 1000);
          }
          
          // Reset counter after attempting
          consecutiveFailures = 0;
        }
      }
    }, 5000); // Check every 5 seconds
    
    return () => {
      clearInterval(checkConnectionInterval);
    };
  }, [currentWorkspaceIdRef.current, isSocketConnected, connectToWorkspace, maxReconnectAttempts]);

  // WordPress-specific methods
  const createWordPressPlugin = useCallback(async (
    prompt: string,
    pluginInfo: {
      slug: string;
      name?: string;
      description?: string;
      version?: string;
      author?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!currentWorkspaceIdRef.current) {
        throw new Error('No active workspace. Please create or select a workspace first.');
      }
      
      const result = await getApiService().createWordPressPlugin(currentWorkspaceIdRef.current, {
        prompt,
        ...pluginInfo
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error creating WordPress plugin: ${errorMessage}`);
      toast.error(`Failed to create WordPress plugin: ${errorMessage}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspaceIdRef.current]);
  
  const createWordPressTheme = useCallback(async (
    prompt: string,
    themeInfo: {
      slug: string;
      name?: string;
      description?: string;
      version?: string;
      author?: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!currentWorkspaceIdRef.current) {
        throw new Error('No active workspace. Please create or select a workspace first.');
      }
      
      const result = await getApiService().createWordPressTheme(currentWorkspaceIdRef.current, {
        prompt,
        ...themeInfo
      });
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error creating WordPress theme: ${errorMessage}`);
      toast.error(`Failed to create WordPress theme: ${errorMessage}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspaceIdRef.current]);
  
  const downloadWordPressPackage = useCallback(async () => {
    try {
      if (!currentWorkspaceIdRef.current) {
        throw new Error('No active workspace. Please create or select a workspace first.');
      }
      
      const result = await getApiService().downloadWordPressPackage(currentWorkspaceIdRef.current);
      
      // Create a download link for the ZIP file
      if (result && result.downloadUrl) {
        const downloadLink = document.createElement('a');
        downloadLink.href = result.downloadUrl;
        downloadLink.download = result.fileName || 'wordpress-package.zip';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        toast.success('WordPress package downloaded successfully');
        return true;
      } else {
        throw new Error('Download URL not provided in the response');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error downloading WordPress package: ${errorMessage}`);
      toast.error(`Failed to download WordPress package: ${errorMessage}`);
      return false;
    }
  }, [currentWorkspaceIdRef.current]);
  
  const deployToWordPressSite = useCallback(async (
    siteInfo: {
      url: string;
      username: string;
      password: string;
    }
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!currentWorkspaceIdRef.current) {
        throw new Error('No active workspace. Please create or select a workspace first.');
      }
      
      const result = await getApiService().deployToWordPressSite(currentWorkspaceIdRef.current, siteInfo);
      
      if (result && result.success) {
        toast.success(`Successfully deployed to ${siteInfo.url}`);
        return true;
      } else {
        throw new Error(result.error || 'Deployment failed');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(`Error deploying to WordPress site: ${errorMessage}`);
      toast.error(`Failed to deploy to WordPress site: ${errorMessage}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspaceIdRef.current]);

  return {
    isLoading,
    isProcessing,
    error,
    isSocketConnected: getSocketService().isConnectedToWorkspace(currentWorkspaceIdRef.current || ''),
    createWorkspace,
    connectToWorkspace,
    sendMessage,
    createFile,
    updateFileContent,
    setActiveFile,
    cleanupMessageListeners,
    createWPPlugin: agentAPI.createWPPlugin.bind(agentAPI),
    generatePluginWithAI: agentAPI.generatePluginWithAI.bind(agentAPI),
    // WordPress-specific methods
    createWordPressPlugin,
    createWordPressTheme,
    downloadWordPressPackage,
    deployToWordPressSite,
    activeTool: activeTool.current
  };
} 