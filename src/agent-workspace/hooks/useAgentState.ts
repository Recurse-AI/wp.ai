"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  AgentSessionState, 
  AgentMessage, 
  PanelLayout, 
  AgentFile, 
  FileNode 
} from '../types';
import { DEFAULT_PANEL_LAYOUT, DEFAULT_PLUGIN_STRUCTURE } from '../constants';
import { useAgentAPI } from './useAgentAPI';
import { toast } from 'react-hot-toast';
import { getSocketService } from '../utils/serviceFactory';
import { WebSocketEventType, WebSocketMessage } from '../utils/websocketService';
import { cleanWorkspace } from '../utils/workspaceUtils';

interface UseAgentStateProps {
  workspaceId?: string;
}

export function useAgentState({ workspaceId: initialWorkspaceId }: UseAgentStateProps = {}) {
  const [sessionState, setSessionState] = useState<AgentSessionState>({
    id: initialWorkspaceId || "",
    messages: [],
    files: {},
    isProcessing: false,
    previewMode: 'code',
    connectionStatus: 'connecting'
  });
  
  // Add the strictModeUnmountRef at the top level of the hook
  const strictModeUnmountRef = useRef(false);
  
  const {
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
  } = useAgentAPI();
  
  const pendingThinking = useRef<string>('');
  const pendingText = useRef<string>('');
  const connectionAttemptedRef = useRef(false);
  
  // Clean a specific workspace
  const cleanCurrentWorkspace = useCallback(() => {
    if (sessionState.id) {
      console.log(`Cleaning current workspace: ${sessionState.id}`);
      cleanWorkspace(sessionState.id);
      
      // Reset the session state
      setSessionState(prev => ({
        ...prev,
        messages: [],
        files: {},
        isProcessing: false,
        connectionStatus: 'disconnected',
        error: null
      }));
    }
  }, [sessionState.id]);
  
  // Clean a specific workspace by ID
  const cleanSpecificWorkspace = useCallback((workspaceId: string) => {
    if (workspaceId) {
      console.log(`Cleaning specific workspace: ${workspaceId}`);
      cleanWorkspace(workspaceId);
      
      // If this is the current workspace, reset the session state
      if (sessionState.id === workspaceId) {
        setSessionState(prev => ({
          ...prev,
          messages: [],
          files: {},
          isProcessing: false,
          connectionStatus: 'disconnected',
          error: null
        }));
      }
    }
  }, [sessionState.id]);
  
  // Update connection status when socket status changes
  useEffect(() => {
    setSessionState(prev => ({
      ...prev,
      connectionStatus: isSocketConnected ? 'connected' : connectionAttemptedRef.current ? 'disconnected' : 'connecting'
    }));
  }, [isSocketConnected]);
  
  // Initialize workspace or create a new one
  useEffect(() => {
    const initWorkspace = async () => {
      try {
        // Skip if we've already attempted connection or no workspace ID is provided
        if (connectionAttemptedRef.current || !initialWorkspaceId) {
          return;
        }
        
        connectionAttemptedRef.current = true;
        
        if (initialWorkspaceId) {
          // Only connect to workspace if we have a valid ID
          console.log(`Connecting to existing workspace: ${initialWorkspaceId}`);
          
          if (!initialWorkspaceId || initialWorkspaceId === 'undefined' || initialWorkspaceId === 'null') {
            throw new Error(`Invalid workspace ID: ${initialWorkspaceId}`);
          }
          
          await connectToWorkspace(initialWorkspaceId);
          
          console.log(`Successfully connected to workspace: ${initialWorkspaceId}`);
          setSessionState(prev => ({
            ...prev,
            id: initialWorkspaceId
          }));
        } else {
          // Instead of creating a new workspace here, we'll wait for explicit createWorkspace call
          // The workspace ID should come from the server via the API
          console.log("No workspace ID provided - waiting for explicit workspace creation");
        }
      } catch (err) {
        console.error('Error initializing workspace:', err);
        toast.error('Failed to initialize workspace');
        setSessionState(prev => ({
          ...prev,
          connectionStatus: 'error',
          error: err instanceof Error ? err.message : 'Unknown error occurred'
        }));
      }
    };
    
    initWorkspace();
  }, [initialWorkspaceId, connectToWorkspace]);
  
  // Set up WebSocket listeners for file updates
  useEffect(() => {
    const fileUpdateHandler = (data: WebSocketMessage) => {
      if (data.file) {
        const { id, path, content } = data.file;
        
        if (content !== undefined) {
          // Update files state by creating or updating the file
          setSessionState(prev => {
            // Split the path into parts
            const pathParts = path.split('/').filter(Boolean);
            const fileName = pathParts.pop() || '';
            
            // Create a new files object
            const newFiles = { ...prev.files };
            
            // Navigate to the correct folder, creating the path if needed
            let currentLevel = newFiles;
            pathParts.forEach(folder => {
              if (!currentLevel[folder]) {
                currentLevel[folder] = { type: 'folder', children: {} };
              } else if (currentLevel[folder].type !== 'folder') {
                // Convert to folder if it's not already
                currentLevel[folder] = { type: 'folder', children: {} };
              }
              currentLevel = currentLevel[folder].children!;
            });
            
            // Add or update the file
            currentLevel[fileName] = {
              type: 'file',
              content,
              language: getLanguageFromFileName(fileName),
            };
            
            return {
              ...prev,
              files: newFiles,
            };
          });
        }
      }
    };
    
    getSocketService().on(WebSocketEventType.FILE_UPDATE, fileUpdateHandler);
    
    return () => {
      getSocketService().removeListener(WebSocketEventType.FILE_UPDATE, fileUpdateHandler);
    };
  }, []);
  
  // Update processing state based on WebSocket events
  useEffect(() => {
    setSessionState(prev => ({
      ...prev,
      isProcessing
    }));
  }, [isProcessing]);
  
  // Display connection error
  useEffect(() => {
    if (error) {
      setSessionState(prev => ({
        ...prev,
        error
      }));
    }
  }, [error]);
  
  // Send a message to the agent
  const sendAgentMessage = useCallback(async (message: string) => {
    if (!sessionState.id) {
      toast.error('No active workspace');
      return;
    }
    
    console.log(`Sending message to workspace: ${sessionState.id}`);
    
    // Check connection status
    if (sessionState.connectionStatus === 'disconnected' || sessionState.connectionStatus === 'error') {
      // Try reconnecting before sending
      try {
        console.log(`Attempting to reconnect to workspace: ${sessionState.id}`);
        await connectToWorkspace(sessionState.id);
        
        // Wait a short time for the connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error('Failed to reconnect:', err);
        toast.error('Cannot send message: Failed to reconnect to server');
        return;
      }
    }
    
    // Add the user message to the state
    const userMessage: AgentMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    
    setSessionState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      error: null // Clear any previous errors
    }));
    
    // Reset pending message data
    pendingThinking.current = '';
    pendingText.current = '';
    
    // Define handlers for the streaming response
    const handleThinkingUpdate = (thinking: string) => {
      pendingThinking.current = thinking;
    };
    
    const handleTextUpdate = (text: string) => {
      // Store the complete response text, not just the latest chunk
      pendingText.current = text;
      
      // Update the session with the in-progress assistant message
      setSessionState(prev => {
        const existingMessages = [...prev.messages];
        const lastMessage = existingMessages[existingMessages.length - 1];
        
        // If the last message is already an assistant response, update it
        if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.id.includes('final')) {
          existingMessages[existingMessages.length - 1] = {
            ...lastMessage,
            content: text, // Use the complete text, not just the incremental update
          };
        } else {
          // Otherwise add a new assistant message
          existingMessages.push({
            id: uuidv4() + '_draft',
            role: 'assistant',
            content: text,
            timestamp: new Date(),
          });
        }
        
        return {
          ...prev,
          messages: existingMessages,
        };
      });
    };
    
    // Maximum retry count for sending a message
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount <= maxRetries) {
      try {
        // Send the message to the agent
        console.log(`Attempt ${retryCount + 1} to send message to workspace ${sessionState.id}`);
        
        const result = await sendMessage(
          sessionState.id,
          message,
          undefined, // code blocks
          handleThinkingUpdate,
          handleTextUpdate
        );
        
        // Finalize the message with the complete response
        setSessionState(prev => {
          const existingMessages = [...prev.messages];
          const assistantMessageIndex = existingMessages.findIndex(msg => 
            msg.role === 'assistant' && msg.id.includes('draft')
          );
          
          if (assistantMessageIndex !== -1) {
            // Replace the draft message with the final one
            existingMessages[assistantMessageIndex] = {
              id: result.messageId,
              role: 'assistant',
              content: pendingText.current,
              timestamp: new Date(),
            };
          } else {
            // Add the assistant message if it doesn't exist
            existingMessages.push({
              id: result.messageId,
              role: 'assistant',
              content: pendingText.current,
              timestamp: new Date(),
            });
          }
          
          return {
            ...prev,
            messages: existingMessages,
          };
        });
        
        // Success, break out of the retry loop
        break;
        
      } catch (err) {
        retryCount++;
        console.error(`Error sending message (attempt ${retryCount}/${maxRetries + 1}):`, err);
        
        if (retryCount <= maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 8000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Try to reconnect before retrying
          try {
            await connectToWorkspace(sessionState.id);
          } catch (connErr) {
            console.error('Failed to reconnect before retry:', connErr);
          }
        } else {
          // We've exhausted all retries
          toast.error('Failed to send message to agent after multiple attempts');
          
          // Update session with error state
          setSessionState(prev => ({
            ...prev,
            error: err instanceof Error ? err.message : 'Failed to send message to agent'
          }));
          return;
        }
      }
    }
  }, [sessionState.id, sessionState.connectionStatus, connectToWorkspace, sendMessage]);
  
  // Create a new file in the workspace
  const createNewFile = useCallback(async (path: string, content: string) => {
    if (!sessionState.id) {
      toast.error('No active workspace');
      return null;
    }
    
    try {
      const result = await createFile(sessionState.id, path, content);
      return result.fileId;
    } catch (err) {
      console.error('Error creating file:', err);
      toast.error('Failed to create file');
      return null;
    }
  }, [sessionState.id, createFile]);
  
  // Update an existing file
  const updateFile = useCallback(async (fileId: string, content: string) => {
    try {
      await updateFileContent(fileId, content);
      return true;
    } catch (err) {
      console.error('Error updating file:', err);
      toast.error('Failed to update file');
      return false;
    }
  }, [updateFileContent]);
  
  // Set the active file in the workspace
  const selectFile = useCallback(async (file: AgentFile) => {
    if (!sessionState.id) {
      toast.error('No active workspace');
      return;
    }
    
    try {
      await setActiveFile(sessionState.id, file.id);
      
      setSessionState(prev => ({
        ...prev,
        activeFile: file,
      }));
    } catch (err) {
      console.error('Error setting active file:', err);
    }
  }, [sessionState.id, setActiveFile]);
  
  // Helper to determine file language from filename
  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'php': 'php',
      'py': 'python',
      'rb': 'ruby',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'json': 'json',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
    };
    
    return extensionMap[extension] || 'plaintext';
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      // If this is the first cleanup in strict mode, just mark it and don't actually disconnect
      if (!strictModeUnmountRef.current) {
        strictModeUnmountRef.current = true;
        // In strict mode, React will run cleanup and setup functions twice
        // The first time isn't a real unmount, so don't fully disconnect
        console.log("Initial cleanup in development mode - not disconnecting WebSocket");
        return;
      }

      // This is either the second cleanup in strict mode or a real unmount in production
      console.log("Final cleanup - disconnecting WebSocket");
      // No need to clean up localStorage on unmount
      // Just close the WebSocket connection
      getSocketService().disconnect();
    };
  }, []);
  
  return {
    sessionState,
    isLoading,
    error,
    sendMessage: sendAgentMessage,
    createFile: createNewFile,
    updateFile,
    selectFile,
    reconnect: connectToWorkspace,
    cleanWorkspace: cleanCurrentWorkspace,
    cleanSpecificWorkspace,
  };
} 