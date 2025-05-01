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
import { getSocketService, WebSocketEventType } from '../utils/websocketService';
import { cleanWorkspace } from '../utils/workspaceUtils';
import { getApiService } from '../utils/serviceFactory';

interface UseAgentStateProps {
  workspaceId?: string;
}

// Define custom event interface for TypeScript
interface ThinkingCompletedEventDetail {
  messageId: string;
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
    sendMessage: apiSendMessage,
    createFile,
    updateFileContent,
    setActiveFile,
    createWordPressPlugin,
    createWordPressTheme
  } = useAgentAPI();
  
  const pendingThinking = useRef<string>('');
  const pendingText = useRef<string>('');
  const connectionAttemptedRef = useRef(false);
  const thinkingCollapsedRef = useRef(false);
  
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

  // Fetch messages from the backend API
  const fetchMessagesFromBackend = useCallback(async (workspaceId: string) => {
    try {
      console.log(`Fetching messages for workspace: ${workspaceId}`);
      const response = await getApiService().getMessages(workspaceId);
      
      if (response) {
        let messagesArray: any[] = [];
        
        // Handle different response formats
        if (Array.isArray(response)) {
          messagesArray = response;
        } else if (response.messages && Array.isArray(response.messages)) {
          messagesArray = response.messages;
        } else {
          console.warn('Unexpected messages format from API:', response);
          return [];
        }
        
        // Convert the backend message format to our frontend format
        const formattedMessages: AgentMessage[] = messagesArray.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          // Convert timestamp to Date object
          timestamp: new Date(msg.timestamp),
          codeBlocks: msg.code_blocks?.map((block: any) => ({
            id: block.id || uuidv4(),
            language: block.language,
            code: block.code
          })) || [],
          thinking: msg.metadata?.thinking || '',
          status: msg.metadata?.status || 'completed'
        }));
        
        console.log(`Loaded ${formattedMessages.length} messages from backend`);
        
        return formattedMessages;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching messages from backend:', error);
      return [];
    }
  }, []);
  
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
          
          // First connect to the WebSocket
          await connectToWorkspace(initialWorkspaceId);
          
          // Then fetch messages from the backend
          const messages = await fetchMessagesFromBackend(initialWorkspaceId);
          
          console.log(`Successfully connected to workspace: ${initialWorkspaceId}`);
          setSessionState(prev => ({
            ...prev,
            id: initialWorkspaceId,
            messages: messages
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
          error: err instanceof Error ? err.message : String(err)
        }));
      }
    };
    
    initWorkspace();
  }, [initialWorkspaceId, connectToWorkspace, fetchMessagesFromBackend]);
  
  // Wrapper for sending messages that updates local state
  const sendMessage = useCallback(async (
    message: string,
    codeBlocks?: { language: string; code: string }[]
  ): Promise<string | undefined> => {
    if (!sessionState.id) {
      console.error('Cannot send message: No active workspace');
      return undefined;
    }
    
    try {
      // Reset thinking and pending text
      pendingThinking.current = '';
      pendingText.current = '';
      thinkingCollapsedRef.current = false;
      
      // Set processing state
      setSessionState(prev => ({
        ...prev,
        isProcessing: true,
        error: null
      }));
      
      // Add user message to state immediately for UI feedback
      const userMessage: AgentMessage = {
        id: uuidv4(),
        role: 'user',
        content: message,
        timestamp: new Date(),
        codeBlocks: codeBlocks?.map(block => ({
          id: uuidv4(),
          language: block.language,
          code: block.code
        })) || [],
        status: 'completed'
      };
      
      // Create a placeholder assistant message
      const assistantMessage: AgentMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        thinking: '',
        status: 'processing'
      };
      
      // Update state with both messages
      setSessionState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage, assistantMessage]
      }));
      
      // Define callback handlers for stream updates
      const onThinkingUpdate = (thinking: string) => {
        pendingThinking.current = thinking;
        thinkingCollapsedRef.current = false;
        
        setSessionState(prev => {
          // Find and update the last assistant message
          const updatedMessages = [...prev.messages];
          const lastAssistantIndex = updatedMessages.findIndex(
            m => m.role === 'assistant' && m.status === 'processing'
          );
          
          if (lastAssistantIndex !== -1) {
            updatedMessages[lastAssistantIndex] = {
              ...updatedMessages[lastAssistantIndex],
              thinking
            };
          }
          
          return {
            ...prev,
            messages: updatedMessages
          };
        });
      };
      
      const onTextUpdate = (text: string) => {
        pendingText.current += text;
        
        setSessionState(prev => {
          // Find and update the last assistant message
          const updatedMessages = [...prev.messages];
          const lastAssistantIndex = updatedMessages.findIndex(
            m => m.role === 'assistant' && m.status === 'processing'
          );
          
          if (lastAssistantIndex !== -1) {
            updatedMessages[lastAssistantIndex] = {
              ...updatedMessages[lastAssistantIndex],
              content: pendingText.current
            };
          }
          
          return {
            ...prev,
            messages: updatedMessages
          };
        });
      };
      
      // Send the message via the API with available callbacks
      // Make sure we're only passing parameters the API expects
      const result = await apiSendMessage(
        sessionState.id,
        message,
        codeBlocks,
        onThinkingUpdate,
        onTextUpdate
      );
      
      // Don't auto-collapse thinking when completed - REMOVED: thinkingCollapsedRef.current = true;
      
      // Mark the assistant message as completed
      setSessionState(prev => {
        const updatedMessages = [...prev.messages];
        const lastAssistantIndex = updatedMessages.findIndex(
          m => m.role === 'assistant' && m.status === 'processing'
        );
        
        if (lastAssistantIndex !== -1) {
          updatedMessages[lastAssistantIndex] = {
            ...updatedMessages[lastAssistantIndex],
            status: 'completed'
          };
          
          // Dispatch an event to notify components that the message is complete
          // but don't request collapsing the thinking section
          if (updatedMessages[lastAssistantIndex].id) {
            const thinkingCompletedEvent = new CustomEvent<ThinkingCompletedEventDetail>('thinking-completed', {
              detail: { messageId: updatedMessages[lastAssistantIndex].id }
            });
            window.dispatchEvent(thinkingCompletedEvent);
          }
        }
        
        return {
          ...prev,
          isProcessing: false,
          messages: updatedMessages
        };
      });
      
      return result?.messageId;
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Update error state
      setSessionState(prev => ({
        ...prev,
        isProcessing: false,
        error: err instanceof Error ? err.message : String(err)
      }));
      
      return undefined;
    }
  }, [sessionState.id, apiSendMessage]);
  
  // Function to reconnect to the current workspace
  const reconnect = useCallback(async () => {
    if (!sessionState.id) {
      console.error('Cannot reconnect: No active workspace');
      return false;
    }
    
    try {
      // First reconnect WebSocket
      await connectToWorkspace(sessionState.id);
      
      // Then fetch messages from the backend
      const messages = await fetchMessagesFromBackend(sessionState.id);
      
      // Update state with fetched messages
      setSessionState(prev => ({
        ...prev,
        messages: messages,
        connectionStatus: 'connected'
      }));
      
      return true;
    } catch (err) {
      console.error('Error reconnecting to workspace:', err);
      setSessionState(prev => ({
        ...prev,
        connectionStatus: 'error',
        error: err instanceof Error ? err.message : String(err)
      }));
      return false;
    }
  }, [sessionState.id, connectToWorkspace, fetchMessagesFromBackend]);
  
  // Create a file in the workspace
  const createFileNode = useCallback(async (
    path: string,
    content: string,
    type: 'file' | 'folder' = 'file',
    language?: string
  ): Promise<string | undefined> => {
    if (!sessionState.id) {
      console.error('Cannot create file: No active workspace');
      return undefined;
    }
    
    try {
      // Call the API to create the file
      const result = await createFile(
        sessionState.id,
        path,
        content
      );
      
      if (result?.fileId) {
        // Update local files state - but should come from server update
        // This is just for immediate UI feedback
        return result.fileId;
      }
      
      return undefined;
    } catch (err) {
      console.error('Error creating file:', err);
      return undefined;
    }
  }, [sessionState.id, createFile]);
  
  // Update a file in the workspace
  const updateFile = useCallback(async (
    fileId: string,
    content: string
  ): Promise<boolean> => {
    if (!sessionState.id) {
      console.error('Cannot update file: No active workspace');
      return false;
    }
    
    try {
      // Call the API to update the file
      const result = await updateFileContent(sessionState.id + '/' + fileId, content);
      return result?.success || false;
    } catch (err) {
      console.error('Error updating file:', err);
      return false;
    }
  }, [sessionState.id, updateFileContent]);
  
  // Select a file in the workspace
  const selectFile = useCallback(async (
    fileId: string
  ): Promise<boolean> => {
    if (!sessionState.id) {
      console.error('Cannot select file: No active workspace');
      return false;
    }
    
    try {
      // Call the API to set the active file
      const result = await setActiveFile(sessionState.id, fileId);
      return result?.success || false;
    } catch (err) {
      console.error('Error selecting file:', err);
      return false;
    }
  }, [sessionState.id, setActiveFile]);
  
  // Return the hook state and methods
  return {
    sessionState,
    isLoading: isLoading,
    error,
    sendMessage,
    createFile: createFileNode,
    updateFile,
    selectFile,
    reconnect,
    cleanWorkspace: cleanCurrentWorkspace,
    cleanSpecificWorkspace,
    shouldCollapseThinking: thinkingCollapsedRef.current
  };
} 