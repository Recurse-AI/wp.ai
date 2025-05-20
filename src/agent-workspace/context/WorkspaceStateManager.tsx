"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  websocketService, 
  WebSocketEventType, 
  WebSocketMessage 
} from '../utils/websocketService';
import { extractFilesFromHTMLLike } from '../utils/fileUtils';
import { useFileOperations } from './FileOperationsContext';

// Define types for workspace state
export interface WorkspaceState {
  workspaceId: string | null;
  isConnected: boolean;
  isProcessing: boolean;
  messages: Message[];
  streaming: StreamingState;
  thinking: {
    messageId: string | null;
    content: string;
    isVisible: boolean;
  };
  error: {
    messageId: string | null;
    content: string;
    isVisible: boolean;
  };
  toolCalls: ToolCall[];
  files: FileState[];
}

export interface StreamingState {
  isStreaming: boolean;
  messageId: string | null;
  content: string;
  tokens: string[];
  lastTokenTimestamp: number;
  chunkCount: number;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  relatedTo?: string;
  toolCalls?: string[];
}

export interface ToolCall {
  id: string;
  messageId: string;
  toolName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  parameters: any;
  result?: any;
  error?: string;
  timestamp: string;
}

export interface FileState {
  path: string;
  status: 'creating' | 'updating' | 'deleting' | 'created' | 'updated' | 'deleted';
  content?: string;
  timestamp: string;
}

// Define types for the context
interface WorkspaceStateContextProps {
  state: WorkspaceState;
  sendMessage: (content: string) => void;
  setWorkspaceId: (id: string) => void;
  clearMessages: () => void;
  executeToolCall: (toolName: string, parameters: any) => void;
  resetStreamingState: () => void;
}

// Create context
const WorkspaceStateContext = createContext<WorkspaceStateContextProps>({
  state: {
    workspaceId: null,
    isConnected: false,
    isProcessing: false,
    messages: [],
    streaming: {
      isStreaming: false,
      messageId: null,
      content: '',
      tokens: [],
      lastTokenTimestamp: 0,
      chunkCount: 0
    },
    thinking: {
      messageId: null,
      content: '',
      isVisible: false
    },
    error: {
      messageId: null,
      content: '',
      isVisible: false
    },
    toolCalls: [],
    files: []
  },
  sendMessage: () => {},
  setWorkspaceId: () => {},
  clearMessages: () => {},
  executeToolCall: () => {},
  resetStreamingState: () => {}
});

// Custom hook to use the workspace state
export const useWorkspaceState = () => useContext(WorkspaceStateContext);

// Provider component
export const WorkspaceStateProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [state, setState] = useState<WorkspaceState>({
    workspaceId: null,
    isConnected: false,
    isProcessing: false,
    messages: [],
    streaming: {
      isStreaming: false,
      messageId: null,
      content: '',
      tokens: [],
      lastTokenTimestamp: 0,
      chunkCount: 0
    },
    thinking: {
      messageId: null,
      content: '',
      isVisible: false
    },
    error: {
      messageId: null,
      content: '',
      isVisible: false
    },
    toolCalls: [],
    files: []
  });

  const { addOperation, updateOperation } = useFileOperations();
  
  // Set workspace ID and establish connection
  const setWorkspaceId = useCallback((id: string) => {
    setState(prev => ({ ...prev, workspaceId: id }));
    websocketService.connect(id);
  }, []);

  // Clear all messages
  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      messages: [],
      streaming: {
        isStreaming: false,
        messageId: null,
        content: '',
        tokens: [],
        lastTokenTimestamp: 0,
        chunkCount: 0
      },
      thinking: {
        messageId: null,
        content: '',
        isVisible: false
      },
      error: {
        messageId: null,
        content: '',
        isVisible: false
      },
      toolCalls: []
    }));
  }, []);

  // Reset streaming state
  const resetStreamingState = useCallback(() => {
    setState(prev => ({
      ...prev,
      streaming: {
        isStreaming: false,
        messageId: null,
        content: '',
        tokens: [],
        lastTokenTimestamp: 0,
        chunkCount: 0
      }
    }));
  }, []);

  // Send a message to the backend
  const sendMessage = useCallback((content: string) => {
    if (!state.workspaceId) {
      console.error('Cannot send message: No workspace ID set');
      return;
    }
    
    const newMessageId = uuidv4();
    
    // Check if there's streaming content that needs to be saved first
    // This preserves any incomplete streaming response when a new message is sent
    setState(prev => {
      // If we have streaming content, create a message from it
      if (prev.streaming.isStreaming && prev.streaming.content) {
        // Create a message from the streaming content
        const streamingMessage: Message = {
          id: prev.streaming.messageId || uuidv4(),
          sender: 'assistant',
          content: prev.streaming.content,
          timestamp: new Date().toISOString()
        };
        
        // Check if this message already exists in the messages array
        const messageExists = prev.messages.some(msg => 
          msg.id === streamingMessage.id || 
          (msg.sender === 'assistant' && msg.content === streamingMessage.content)
        );
        
        // Update state with new message and user message
        return {
          ...prev,
          // Add the streaming message if it doesn't exist
          messages: [
            ...(messageExists ? prev.messages : [...prev.messages, streamingMessage]),
            // Add the new user message
            {
              id: newMessageId,
              sender: 'user',
              content,
              timestamp: new Date().toISOString()
            }
          ],
          isProcessing: true,
          // Reset streaming state
          streaming: {
            isStreaming: false,
            messageId: null,
            content: '',
            tokens: [],
            lastTokenTimestamp: 0,
            chunkCount: 0
          }
        };
      }
      
      // If there's no streaming content, just add the user message normally
      return {
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: newMessageId,
            sender: 'user',
            content,
            timestamp: new Date().toISOString()
          }
        ],
        isProcessing: true,
        // Reset streaming state
        streaming: {
          isStreaming: false,
          messageId: null,
          content: '',
          tokens: [],
          lastTokenTimestamp: 0,
          chunkCount: 0
        }
      };
    });
    
    // Send the message via WebSocket
    websocketService.send({
      type: 'user_message',
      message: content,
      message_id: newMessageId,
      workspace_id: state.workspaceId
    });
  }, [state.workspaceId]);

  // Execute a tool call
  const executeToolCall = useCallback((toolName: string, parameters: any) => {
    if (!state.workspaceId) {
      console.error('Cannot execute tool: No workspace ID set');
      return;
    }
    
    // Generate a unique ID for this tool call
    const toolId = uuidv4();
    
    // Add the tool call to state
    setState(prev => ({
      ...prev,
      toolCalls: [
        ...prev.toolCalls,
        {
          id: toolId,
          messageId: '',
          toolName,
          status: 'pending',
          parameters,
          timestamp: new Date().toISOString()
        }
      ]
    }));
    
    // Send the tool request via WebSocket
    websocketService.send({
      type: 'tool_name',
      tool_name: toolName,
      parameters,
      tool_id: toolId,
      workspace_id: state.workspaceId
    });
  }, [state.workspaceId]);

  // Handle connection status changes
  useEffect(() => {
    const handleConnectionStatus = (data: { status: 'connecting' | 'connected' | 'disconnected' | 'error' }) => {
      setState(prev => ({
        ...prev,
        isConnected: data.status === 'connected'
      }));
    };
    
    websocketService.on('connection_status_change', handleConnectionStatus);
    
    return () => {
      websocketService.off('connection_status_change', handleConnectionStatus);
    };
  }, []);

  // Update the WebSocketMessage interface to add the custom properties needed for our context
  interface ExtendedWebSocketMessage extends WebSocketMessage {
    related_to?: string;
  }

  // Set up WebSocket event handlers
  useEffect(() => {
    if (!state.workspaceId) return;
    
    // Handle new messages
    const handleNewMessage = (data: WebSocketMessage) => {
      if (data.sender && data.text) {
        // Create a new message object
        const newMessage = {
          id: data.message_id || uuidv4(),
          sender: data.sender as 'user' | 'assistant' | 'system',
          content: data.text,
          timestamp: data.timestamp || new Date().toISOString(),
          relatedTo: (data as ExtendedWebSocketMessage).related_to
        };
        
        // Add new message to state
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, newMessage],
          // If this is a complete message, reset streaming state
          streaming: data.sender === 'assistant' ? {
            isStreaming: false,
            messageId: null,
            content: '',
            tokens: [],
            lastTokenTimestamp: 0,
            chunkCount: 0
          } : prev.streaming
        }));
        
        // If this is an assistant message, check for file references
        if (data.sender === 'assistant') {
          // Extract files from text
          const extractedFiles = extractFilesFromHTMLLike(data.text);
          
          // Process extracted files
          if (extractedFiles && Object.keys(extractedFiles).length > 0) {
            Object.entries(extractedFiles).forEach(([path, fileData]) => {
              // Add a file operation for each file
              addOperation({
                path,
                type: 'file',
                status: 'created'
              });
              
              // Add to files state
              setState(prev => ({
                ...prev,
                files: [
                  ...prev.files,
                  {
                    path,
                    status: 'created',
                    content: typeof fileData === 'object' && fileData.content ? fileData.content : '',
                    timestamp: new Date().toISOString()
                  }
                ]
              }));
            });
          }
        }
      }
    };
    
    // Handle processing status updates
    const handleProcessingStatus = (data: WebSocketMessage) => {
      if (data.status) {
        setState(prev => ({
          ...prev,
          isProcessing: data.status === 'processing'
        }));
      }
    };
    
    // Handle thinking updates
    const handleThinkingUpdate = (data: WebSocketMessage) => {
      if (data.thinking) {
        setState(prev => ({
          ...prev,
          thinking: {
            messageId: data.message_id || null,
            content: data.thinking || '',
            isVisible: true
          }
        }));
      }
    };
    
    // Handle error messages
    const handleError = (data: WebSocketMessage) => {
      if (data.error) {
        let errorMessage = '';
        
        if (typeof data.error === 'string') {
          errorMessage = data.error;
        } else if (typeof data.error === 'object' && data.error !== null) {
          // Safely handle object errors by checking if error is an object and has message property
          const errorObj = data.error as unknown as { message?: string };
          errorMessage = errorObj.message || 'An error occurred';
        } else {
          errorMessage = 'An error occurred';
        }
        
        setState(prev => ({
          ...prev,
          error: {
            messageId: data.message_id || null,
            content: errorMessage,
            isVisible: true
          },
          isProcessing: false,
          // Reset streaming state when there's an error
          streaming: {
            isStreaming: false,
            messageId: null,
            content: '',
            tokens: [],
            lastTokenTimestamp: 0,
            chunkCount: 0
          }
        }));
      }
    };
    
    // Handle tool calls
    const handleToolStatus = (data: WebSocketMessage) => {
      if (data.tool_id && data.tool_name && data.status) {
        setState(prev => ({
          ...prev,
          toolCalls: prev.toolCalls.map(tool => 
            tool.id === data.tool_id 
              ? { 
                  ...tool, 
                  status: data.status as 'pending' | 'running' | 'completed' | 'failed',
                  result: data.result,
                  error: typeof data.error === 'string' 
                    ? data.error 
                    : typeof data.error === 'object' && data.error !== null
                      ? (data.error as unknown as { message?: string }).message || JSON.stringify(data.error)
                      : undefined,
                  messageId: data.message_id || tool.messageId
                } 
              : tool
          )
        }));
      }
    };
    
    // Handle file actions
    const handleFileAction = (data: any) => {
      if (data.action_type && data.path) {
        // Map backend action types to frontend statuses
        const actionStatusMap: Record<string, FileState['status']> = {
          'create': 'creating',
          'update': 'updating',
          'delete': 'deleting'
        };
        
        const statusMap: Record<string, FileState['status']> = {
          'create': 'created',
          'update': 'updated',
          'delete': 'deleted'
        };
        
        // Get the appropriate status
        const status = actionStatusMap[data.action_type] || 'created';
        const finalStatus = statusMap[data.action_type] || 'created';
        
        // Update file operations
        addOperation({
          path: data.path,
          type: 'file',
          status
        });
        
        // Add to files state
        setState(prev => ({
          ...prev,
          files: [
            ...prev.files.filter(f => f.path !== data.path),
            {
              path: data.path,
              status,
              timestamp: data.timestamp || new Date().toISOString()
            }
          ]
        }));
        
        // Update file status after a delay to simulate completion
        setTimeout(() => {
          updateOperation(data.path, finalStatus);
          
          setState(prev => ({
            ...prev,
            files: prev.files.map(file => 
              file.path === data.path
                ? { ...file, status: finalStatus }
                : file
            )
          }));
        }, 1500);
      }
    };

    // Handle text streaming chunks
    const handleTextChunk = (data: WebSocketMessage) => {
      // Only process if this is a text chunk
      if (data.type === WebSocketEventType.TEXT || data.type === 'text') {
        const chunkContent = data.content || '';
        if (!chunkContent) return;
        
        setState(prev => {
          const messageId = data.message_id || prev.streaming.messageId || uuidv4();
          const newContent = prev.streaming.content + chunkContent;
          const newToken = { text: chunkContent, timestamp: Date.now() };

          // Update streaming state
          return {
            ...prev,
            streaming: {
              isStreaming: true,
              messageId,
              content: newContent,
              tokens: [...prev.streaming.tokens, chunkContent],
              lastTokenTimestamp: Date.now(),
              chunkCount: prev.streaming.chunkCount + 1
            }
          };
        });
      }
    };

    // Handle stream complete events
    const handleStreamComplete = (data: WebSocketMessage) => {
      if (data.type === WebSocketEventType.COMPLETE || data.type === 'complete' || data.type === 'process_complete') {
        // Stream is complete, add the complete message to permanent storage
        setState(prev => {
          // Only proceed if we have streaming content
          if (!prev.streaming.content) return prev;
          
          // Create a new message with the complete content
          const messageId = data.message_id || prev.streaming.messageId || uuidv4();
          const finalMessage: Message = {
            id: messageId,
            sender: 'assistant',
            content: prev.streaming.content,
            timestamp: data.timestamp || new Date().toISOString()
          };
          
          // Find if this message already exists in messages array
          const messageExists = prev.messages.some(msg => 
            msg.id === messageId || 
            (msg.sender === 'assistant' && msg.content === prev.streaming.content)
          );
          
          // Return updated state
          return {
            ...prev,
            // Add message if it doesn't exist already
            messages: messageExists ? prev.messages : [...prev.messages, finalMessage],
            // Reset streaming state
            streaming: {
              isStreaming: false,
              messageId: null,
              content: '',
              tokens: [],
              lastTokenTimestamp: 0,
              chunkCount: 0
            },
            isProcessing: false
          };
        });
      }
    };
    
    // Register all event handlers
    websocketService.on(WebSocketEventType.NEW_MESSAGE, handleNewMessage);
    websocketService.on(WebSocketEventType.PROCESSING_STATUS, handleProcessingStatus);
    websocketService.on(WebSocketEventType.THINKING_UPDATE, handleThinkingUpdate);
    websocketService.on(WebSocketEventType.ERROR, handleError);
    websocketService.on(WebSocketEventType.TOOL_STATUS_UPDATE, handleToolStatus);
    websocketService.on('file_action', handleFileAction);
    
    // Add handlers for streaming text chunks
    websocketService.on(WebSocketEventType.TEXT, handleTextChunk);
    websocketService.on('text', handleTextChunk);
    
    // Add handlers for stream completion
    websocketService.on(WebSocketEventType.COMPLETE, handleStreamComplete);
    websocketService.on('complete', handleStreamComplete);
    websocketService.on('process_complete', handleStreamComplete);
    
    // Clean up event handlers when the component unmounts or workspace ID changes
    return () => {
      websocketService.off(WebSocketEventType.NEW_MESSAGE, handleNewMessage);
      websocketService.off(WebSocketEventType.PROCESSING_STATUS, handleProcessingStatus);
      websocketService.off(WebSocketEventType.THINKING_UPDATE, handleThinkingUpdate);
      websocketService.off(WebSocketEventType.ERROR, handleError);
      websocketService.off(WebSocketEventType.TOOL_STATUS_UPDATE, handleToolStatus);
      websocketService.off('file_action', handleFileAction);
      
      // Remove streaming handlers
      websocketService.off(WebSocketEventType.TEXT, handleTextChunk);
      websocketService.off('text', handleTextChunk);
      websocketService.off(WebSocketEventType.COMPLETE, handleStreamComplete);
      websocketService.off('complete', handleStreamComplete);
      websocketService.off('process_complete', handleStreamComplete);
    };
  }, [state.workspaceId, addOperation, updateOperation]);

  // Provide the context to children
  return (
    <WorkspaceStateContext.Provider 
      value={{ 
        state,
        sendMessage,
        setWorkspaceId,
        clearMessages,
        executeToolCall,
        resetStreamingState
      }}
    >
      {children}
    </WorkspaceStateContext.Provider>
  );
};

export default WorkspaceStateProvider; 