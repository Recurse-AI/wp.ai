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
import { 
  processAttachedFolders, 
  saveFilesToLocalStorage, 
  loadFilesFromLocalStorage,
  updateFileInStructure,
  extractFilesFromMessage,
  extractWordPressPlugin
} from '../utils/fileUtils';
import { FiAlertTriangle } from 'react-icons/fi';

interface UseAgentStateProps {
  workspaceId?: string;
}

// Define API response types
interface ApiMessageResponse {
  id: string;
  role: string;
  content: string;
  timestamp: string;
  code_blocks?: Array<{ id?: string; language: string; code: string }>;
  metadata?: {
    thinking?: string;
    status?: string;
  };
}

// Type guards for response types
function isApiMessagesArray(response: unknown): response is ApiMessageResponse[] {
  return Array.isArray(response);
}

function isApiMessagesObject(response: unknown): response is { messages: ApiMessageResponse[] } {
  return typeof response === 'object' && response !== null && 'messages' in response && 
    Array.isArray((response as any).messages);
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
  
  // Store the complete thinking text to prevent truncation during streaming
  const pendingThinking = useRef<string>('');
  const pendingText = useRef<string>('');
  const connectionAttemptedRef = useRef(false);
  const thinkingCollapsedRef = useRef(false);
  const currentlyProcessingFile = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Ref to track the last time we showed a timeout toast to prevent duplicates
  const lastTimeoutToastRef = useRef<number>(0);
  
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

  // Add a new function to process attached folders in messages
  const processAttachedFoldersInMessages = useCallback((messages: AgentMessage[]) => {
    // Check each assistant message for attached folders
    const latestMessage = messages[messages.length - 1];
    if (!latestMessage || latestMessage.role !== 'assistant') return;

    console.log('Processing attached folders in message:', latestMessage.id);
    
    // Extract attached folders
    const attachments = latestMessage.attachments || {};
    if (Object.keys(attachments).length > 0) {
      console.log('Found attachments:', Object.keys(attachments));
      
      const folderPaths = Object.keys(attachments);
      const folderContents = attachments;
      
      // Process the folders into file structure
      const updatedFiles = processAttachedFolders(
        sessionState.files,
        folderPaths,
        folderContents
      );
      
      // Update state with the new files
      setSessionState(prev => ({
        ...prev,
        files: updatedFiles
      }));
      
      // Save to localStorage if we have a session ID
      if (sessionState.id) {
        saveFilesToLocalStorage(sessionState.id, updatedFiles);
      }
    }
    
    // Check for WordPress plugin-related content
    if (latestMessage.content.includes('WordPress') && 
        (latestMessage.content.includes('Plugin') || latestMessage.content.includes('plugin'))) {
      
      console.log('Processing WordPress plugin content from message:', latestMessage.id);
      
      // First check for <PROJECT_STRUCTURE> tag
      const hasProjectStructure = /<PROJECT_STRUCTURE>[\s\S]*?<\/PROJECT_STRUCTURE>/i.test(latestMessage.content);
      
      // Then check for <FILE> or <file> tags
      const hasFileTags = /<(?:FILE|file)\s+path="[^"]+">[\s\S]*?<\/(?:FILE|file)>/i.test(latestMessage.content);
      
      // If we have structured content, use the WordPress plugin extractor
      if (hasProjectStructure || hasFileTags) {
        // Extract plugin files
        const updatedFiles = extractWordPressPlugin(latestMessage.content, sessionState.files);
        
        // If we extracted files, update the state
        if (Object.keys(updatedFiles).length > 0) {
          console.log('Extracted WordPress plugin files:', Object.keys(updatedFiles));
          setSessionState(prev => ({
            ...prev,
            files: updatedFiles
          }));
          
          // Add metadata to the message to indicate file information should be hidden in the UI
          if (latestMessage.metadata) {
            latestMessage.metadata.hideFileContent = true;
          } else {
            latestMessage.metadata = { hideFileContent: true };
          }
          
          if (sessionState.id) {
            saveFilesToLocalStorage(sessionState.id, updatedFiles);
          }
        }
      } else {
        // Fall back to the generic extractor if no specific structure found
        console.log('No structured content found, using generic extractor');
        
        // Extract files from general content
        const updatedFiles = extractFilesFromMessage(latestMessage.content, sessionState.files);
        
        // If we extracted files, update the state
        if (Object.keys(updatedFiles).length > 0) {
          setSessionState(prev => ({
            ...prev,
            files: updatedFiles
          }));
          
          if (sessionState.id) {
            saveFilesToLocalStorage(sessionState.id, updatedFiles);
          }
        }
      }
    } else {
      // For non-WordPress specific content, use the generic extractor
      console.log('Processing generic file content from message:', latestMessage.id);
      
      // Extract files from general content
      const updatedFiles = extractFilesFromMessage(latestMessage.content, sessionState.files);
      
      // If we extracted files, update the state
      if (Object.keys(updatedFiles).length > 0) {
        setSessionState(prev => ({
          ...prev,
          files: updatedFiles
        }));
        
        if (sessionState.id) {
          saveFilesToLocalStorage(sessionState.id, updatedFiles);
        }
      }
    }
  }, [sessionState.files, sessionState.id]);

  // Process content of messages for code snippets and file structure
  const processCodeInMessages = useCallback((messages: AgentMessage[]) => {
    // Only process assistant messages
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    if (assistantMessages.length === 0) return;
    
    // Get the most recent assistant message
    const latestMessage = assistantMessages[assistantMessages.length - 1];
    
    // Skip processing if the message has no content
    if (!latestMessage.content) return;
    
    // Check for WordPress plugin-related content
    if (latestMessage.content.includes('WordPress') && 
        (latestMessage.content.includes('Plugin') || latestMessage.content.includes('plugin'))) {
      
      console.log('Processing WordPress plugin content from message:', latestMessage.id);
      
      // Extract plugin files
      const updatedFiles = extractWordPressPlugin(latestMessage.content, sessionState.files);
      
      // If we extracted files, update the state
      if (Object.keys(updatedFiles).length > 0) {
        setSessionState(prev => ({
          ...prev,
          files: updatedFiles
        }));
        
        if (sessionState.id) {
          saveFilesToLocalStorage(sessionState.id, updatedFiles);
        }
      }
    } else {
      // For non-WordPress specific content, use the generic extractor
      console.log('Processing generic file content from message:', latestMessage.id);
      
      // Extract files from general content
      const updatedFiles = extractFilesFromMessage(latestMessage.content, sessionState.files);
      
      // If we extracted files, update the state
      if (Object.keys(updatedFiles).length > 0) {
        setSessionState(prev => ({
          ...prev,
          files: updatedFiles
        }));
        
        if (sessionState.id) {
          saveFilesToLocalStorage(sessionState.id, updatedFiles);
        }
      }
    }
  }, [sessionState.files, sessionState.id]);

  // Fetch messages from the backend API
  const fetchMessagesFromBackend = useCallback(async (workspaceId: string) => {
    try {
      console.log(`Fetching messages for workspace: ${workspaceId}`);
      const response = await getApiService().getMessages(workspaceId);
      
      if (response) {
        let messagesArray: any[] = [];
        
        // Handle different response formats
        if (isApiMessagesArray(response)) {
          messagesArray = response;
        } else if (isApiMessagesObject(response)) {
          messagesArray = response.messages;
        } else {
          console.warn('Unexpected messages format from API:', response);
          return [];
        }
        
        // Convert the backend message format to our frontend format
        // Backend: ApiMessageResponse -> Frontend: AgentMessage
        const formattedMessages: AgentMessage[] = messagesArray.map(msg => ({
          id: msg.id,
          role: msg.role as AgentMessage['role'], // Cast to expected role type
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
        
        // Process attached folders in the messages
        processAttachedFoldersInMessages(formattedMessages);
        
        // Process code and files in messages
        setTimeout(() => {
          processCodeInMessages(formattedMessages);
        }, 500);
        
        return formattedMessages;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching messages from backend:', error);
      return [];
    }
  }, [processAttachedFoldersInMessages, processCodeInMessages]);
  
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
  
  // Listen for WebSocket events
  useEffect(() => {
    if (!sessionState.id) return;
    
    // Setup file update handler
    const handleFileUpdate = (data: any) => {
      if (!data.file) return;
      
      const { id, path, content } = data.file;
      console.log(`File update received: ${path}`);
      
      // Track which file is currently being processed
      currentlyProcessingFile.current = path;
      
      // Update files state with the new file
      setSessionState(prev => {
        // Split path components
        const pathParts = path.split('/');
        const fileName = pathParts.pop() || '';
        const directory = pathParts.join('/');
        
        // Create a deep copy of the current files
        const updatedFiles = JSON.parse(JSON.stringify(prev.files));
        
        // Helper function to ensure directory exists and get reference to it
        const ensureDirectory = (dirPath: string) => {
          if (!dirPath) return updatedFiles;
          
          const parts = dirPath.split('/');
          let current = updatedFiles;
          
          // Create each directory in path if it doesn't exist
          for (const part of parts) {
            if (!current[part]) {
              current[part] = { type: 'folder', children: {} };
            } else if (current[part].type !== 'folder') {
              // Convert to folder if needed
              current[part] = { type: 'folder', children: {} };
            }
            current = current[part].children!;
          }
          
          return current;
        };
        
        // Get reference to directory where file should be added/updated
        const targetDir = ensureDirectory(directory);
        
        // Determine file extension for language
        const getLanguageFromExtension = (filename: string) => {
          const ext = filename.split('.').pop()?.toLowerCase();
          if (!ext) return 'text';
          
          switch(ext) {
            case 'php': return 'php';
            case 'js': case 'jsx': return 'javascript';
            case 'ts': case 'tsx': return 'typescript';
            case 'html': return 'html';
            case 'css': return 'css';
            case 'json': return 'json';
            case 'md': return 'markdown';
            default: return 'text';
          }
        };
        
        // Add or update file
        targetDir[fileName] = {
          type: 'file',
          content: content || '',
          language: getLanguageFromExtension(fileName)
        };
        
        return {
          ...prev,
          files: updatedFiles
        };
      });
      
      // Clear the processing file after a short delay
      setTimeout(() => {
        if (currentlyProcessingFile.current === path) {
          currentlyProcessingFile.current = null;
        }
      }, 2000);
    };
    
    // Add handler for operation timeouts
    const handleOperationTimeout = (data: any) => {
      if (data.operation_id) {
        console.warn(`Operation timed out: ${data.operation_id}`);
        
        // Skip showing UI errors and toasts for ping operations
        if (data.operation_id.startsWith('ping-')) {
          console.log(`Ignoring timeout for ping operation: ${data.operation_id}`);
          return;
        }
        
        // Also skip showing UI errors and toasts for non-critical operations
        // Like background checks, status updates, or health checks
        if (data.operation_id.includes('check') || 
            data.operation_id.includes('status') || 
            data.operation_id.includes('health')) {
          console.log(`Ignoring timeout for non-critical operation: ${data.operation_id}`);
          return;
        }
        
        // Update UI state to show error
        setSessionState(prev => ({
          ...prev,
          isProcessing: false,
          error: "Operation timed out. Please try again."
        }));
        
        // Check if we've shown a timeout toast recently (within the last 2 minutes)
        // Extended from 60s to 120s to reduce frequency
        const now = Date.now();
        const timeSinceLastToast = now - lastTimeoutToastRef.current;
        
        // Only show a toast if we haven't shown one recently AND it's a user-initiated operation
        if (timeSinceLastToast > 120000 && 
            (data.operation_id.includes('message') || data.operation_id.includes('user'))) {
          // Show toast notification to user with consistent styling
          toast.error(
            "Your request is taking too long. Please try again.", 
            {
              id: 'operation-timeout-global',
              duration: 60000, // 1 minute duration
              style: {
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderLeft: '4px solid #ef4444',
                color: '#7f1d1d',
                padding: '16px',
              }
            }
          );
          
          // Update the last toast timestamp
          lastTimeoutToastRef.current = now;
        } else {
          console.log(`Suppressed timeout toast. Last shown ${Math.round(timeSinceLastToast/1000)}s ago.`);
        }
      }
    };
    
    // Listen for reconnect failures
    const handleReconnectFailed = (data: any) => {
      console.error("Reconnection failed:", data);
      
      setSessionState(prev => ({
        ...prev,
        connectionStatus: 'error',
        error: "Connection to server lost and cannot be reestablished."
      }));
      
      // Show a more detailed error toast only if we're not already showing connection issues
      // This prevents duplicate connection error messages
      if (lastTimeoutToastRef.current === 0 || (Date.now() - lastTimeoutToastRef.current > 120000)) {
        // Show a more detailed error toast with clear instructions
        toast.error(
          "Connection to server lost. Please reload the page to reconnect.", 
          {
            id: 'reconnect-failed',
            duration: 180000, // 3 minutes instead of never expiring
            style: {
              background: '#fee2e2',
              border: '1px solid #ef4444',
              borderLeft: '4px solid #ef4444',
              color: '#7f1d1d',
              padding: '16px',
            }
          }
        );
        
        // Update the last toast timestamp
        lastTimeoutToastRef.current = Date.now();
      }
    };
    
    // Cleanup previous listeners first to prevent duplicates
    getSocketService().removeListener(WebSocketEventType.FILE_UPDATE, handleFileUpdate);
    getSocketService().removeListener('operation_timeout', handleOperationTimeout);
    getSocketService().removeListener('reconnect_failed', handleReconnectFailed);
    
    // Add event listener for file updates
    getSocketService().on(WebSocketEventType.FILE_UPDATE, handleFileUpdate);
    
    // Add event listener for operation timeouts
    getSocketService().on('operation_timeout', handleOperationTimeout);
    
    // Add event listener for reconnect failures
    getSocketService().on('reconnect_failed', handleReconnectFailed);
    
    // Clean up
    return () => {
      getSocketService().removeListener(WebSocketEventType.FILE_UPDATE, handleFileUpdate);
      getSocketService().removeListener('operation_timeout', handleOperationTimeout);
      getSocketService().removeListener('reconnect_failed', handleReconnectFailed);
    };
  }, [sessionState.id]);
  
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
        // Append to the previous thinking instead of replacing it
        // This ensures we maintain the complete thinking text
        pendingThinking.current += thinking;
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
              thinking: pendingThinking.current
            };
          }
          
          return {
            ...prev,
            messages: updatedMessages
          };
        });
      };
      
      const onTextUpdate = (text: string) => {
        // Append to the pending text instead of replacing it
        pendingText.current += text;
        
        setSessionState(prev => {
          // Find and update the last assistant message
          const updatedMessages = [...prev.messages];
          const lastAssistantIndex = updatedMessages.findIndex(
            m => m.role === 'assistant' && m.status === 'processing'
          );
          
          if (lastAssistantIndex !== -1) {
            // Always use the full accumulated text from pendingText
            // This ensures we always render the complete response
            updatedMessages[lastAssistantIndex] = {
              ...updatedMessages[lastAssistantIndex],
              content: pendingText.current === '' ? 'Thinking...' : pendingText.current,
              status: 'processing' // Ensure status remains 'processing' while streaming
            };
          }
          
          return {
            ...prev,
            messages: updatedMessages,
            isProcessing: true // Ensure processing flag is set while streaming
          };
        });
        
        // Trigger markdown processing after a slight delay
        if (containerRef.current) {
          setTimeout(() => {
            try {
              const event = new Event('content-updated');
              containerRef.current?.dispatchEvent(event);
            } catch (error) {
              console.error('Error dispatching content-updated event:', error);
            }
          }, 10);
        }
      };
      
      // Create operation timeout handler
      const handleTimeout = () => {
        console.warn("Message sending operation timed out");
        setSessionState(prev => {
          // Find and update the last assistant message
          const updatedMessages = [...prev.messages];
          const lastAssistantIndex = updatedMessages.findIndex(
            m => m.role === 'assistant' && m.status === 'processing'
          );
          
          if (lastAssistantIndex !== -1) {
            updatedMessages[lastAssistantIndex] = {
              ...updatedMessages[lastAssistantIndex],
              content: "The operation timed out. Please try again.",
              status: 'error'
            };
          }
          
          return {
            ...prev,
            isProcessing: false,
            messages: updatedMessages,
            error: "Message processing timed out"
          };
        });
        
        toast.error("Your request is taking too long. Please try again.", {
          duration: 5000
        });
      };
      
      // Set up an overall timeout for the operation (2 minutes)
      const timeoutId = setTimeout(handleTimeout, 120000);
      
      // Send the message via the API with available callbacks
      // Make sure we're only passing parameters the API expects
      const result = await apiSendMessage(
        sessionState.id,
        message,
        codeBlocks,
        onThinkingUpdate,
        onTextUpdate
      );
      
      // Clear the timeout if request completed successfully
      clearTimeout(timeoutId);
      
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
          
          // Process attached folders in the response
          const assistantMessage = updatedMessages[lastAssistantIndex];
          if (assistantMessage.content) {
            const folderPattern = /Folder: ([^\n]+)\nContents of directory:/g;
            const folderMatches = [...assistantMessage.content.matchAll(folderPattern)];
            
            if (folderMatches.length > 0) {
              processAttachedFoldersInMessages([assistantMessage]);
            }
            
            // Process code snippets and WordPress files
            setTimeout(() => {
              processCodeInMessages(updatedMessages);
            }, 500);
          }
          
          // Dispatch an event to notify components that the message is complete
          if (updatedMessages[lastAssistantIndex].id) {
            const messageId = updatedMessages[lastAssistantIndex].id;
            const thinkingCompletedEvent = new CustomEvent<ThinkingCompletedEventDetail>('thinking-completed', {
              detail: { messageId }
            });
            window.dispatchEvent(thinkingCompletedEvent);
            
            // Clear thinking buffer for this message in the WebSocket service
            // to prevent memory leaks
            getSocketService().clearThinkingBuffer(messageId);
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
      setSessionState(prev => {
        // Find and update the last assistant message to show error
        const updatedMessages = [...prev.messages];
        const lastAssistantIndex = updatedMessages.findIndex(
          m => m.role === 'assistant' && m.status === 'processing'
        );
        
        if (lastAssistantIndex !== -1) {
          updatedMessages[lastAssistantIndex] = {
            ...updatedMessages[lastAssistantIndex],
            content: "Error: " + (err instanceof Error ? err.message : String(err)),
            status: 'error'
          };
        }
        
        return {
          ...prev,
          isProcessing: false,
          messages: updatedMessages,
          error: err instanceof Error ? err.message : String(err)
        };
      });
      
      return undefined;
    }
  }, [sessionState.id, apiSendMessage, processAttachedFoldersInMessages, processCodeInMessages]);
  
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
      // Check if fileId is empty or not a string
      if (!fileId || typeof fileId !== 'string') {
        console.error(`Invalid fileId: "${fileId}". Expected a non-empty string.`);
        return false;
      }
      
      // Find the file in sessionState.files
      if (fileId.startsWith('file-')) {
        // For path-based IDs (file-path/to/file.ext), extract the path
        const filePath = fileId.substring(5); // Remove 'file-' prefix
        
        // Update UI to show selected file
        setSessionState(prev => {
          // Find the file in the files structure
          const findFileInStructure = (path: string, files: Record<string, FileNode>): AgentFile | null => {
            const pathParts = path.split('/');
            const fileName = pathParts.pop();
            
            if (!fileName) return null;
            
            // Navigate to the directory containing the file
            let currentLevel = files;
            for (let i = 0; i < pathParts.length; i++) {
              const part = pathParts[i];
              if (!currentLevel[part] || currentLevel[part].type !== 'folder' || !currentLevel[part].children) {
                return null;
              }
              currentLevel = currentLevel[part].children!;
            }
            
            // Find the file in the directory
            if (currentLevel[fileName] && currentLevel[fileName].type === 'file') {
              return {
                id: fileId,
                name: fileName,
                path: filePath,
                content: currentLevel[fileName].content || '',
                language: currentLevel[fileName].language || 'text',
                lastModified: new Date()
              };
            }
            
            return null;
          };
          
          const foundFile = findFileInStructure(filePath, prev.files);
          
          if (foundFile) {
            return {
              ...prev,
              activeFile: foundFile
            };
          }
          
          return prev;
        });
        
        // Skip API call for path-based IDs completely
        return true;
      } else {
        // For UUID-format IDs, directly call the API
        const result = await setActiveFile(sessionState.id, fileId);
        return result?.success || false;
      }
    } catch (err) {
      console.error('Error selecting file:', err);
      return false;
    }
  }, [sessionState.id, sessionState.files, setActiveFile]);
  
  // Set up containerRef for processing markdown
  useEffect(() => {
    if (containerRef.current) {
      // Force markdown processing when content is updated
      const processMarkdown = () => {
        try {
          // Process markdown lists, code blocks, and other elements
          const paragraphs = containerRef.current?.querySelectorAll('p');
          paragraphs?.forEach(p => {
            const text = p.innerHTML;
            if (text.trim().startsWith('- ')) {
              const ul = document.createElement('ul');
              ul.className = 'list-disc pl-6 my-2';
              const items = text.split('- ').filter(Boolean);
              
              items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'my-1';
                li.innerHTML = item.trim();
                ul.appendChild(li);
              });
              
              p.parentNode?.replaceChild(ul, p);
            }
          });
        } catch (error) {
          console.error("Error processing markdown:", error);
        }
      };

      // Process immediately and set up a mutation observer
      processMarkdown();
      
      // Create mutation observer to watch for content changes
      const observer = new MutationObserver(mutations => {
        processMarkdown();
      });
      
      // Start observing content changes
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true
      });
      
      return () => {
        observer.disconnect();
      };
    }
  }, [containerRef.current]);
  
  // Load files from localStorage on initial load
  useEffect(() => {
    if (sessionState.id && Object.keys(sessionState.files).length === 0) {
      const savedFiles = loadFilesFromLocalStorage(sessionState.id);
      if (Object.keys(savedFiles).length > 0) {
        setSessionState(prev => ({
          ...prev,
          files: savedFiles
        }));
      }
    }
  }, [sessionState.id, sessionState.files]);
  
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
    shouldCollapseThinking: thinkingCollapsedRef.current,
    currentlyProcessingFile: currentlyProcessingFile.current,
    containerRef
  };
} 