'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Type imports moved to a dedicated imports section
import {
  WebSocketStatus,
  SearchResultsData,
  ErrorData
} from '@/utils/socket';
import TokenManager from '@/lib/tokenManager';
import { MessageGroup } from '@/lib/types/chat';

// =============================================================================
// Constants and types
// =============================================================================


// WebSocket message types for better readability
const WS_MESSAGES = {
  CONNECTION_ESTABLISHED: 'connection_established',
  USER_MESSAGE: 'user_message',
  CLIENT_INFO: 'client_info',
  CLIENT_INFO_RECEIVED: 'client_info_received',
  CLIENT_INFO_UPDATED: 'client_info_updated',
  NEW_CONVERSATION: 'new_conversation',
  PROCESSING_STARTED: 'processing_started',
  WEB_SEARCH_STATUS: 'web_search_status',
  VECTOR_SEARCH_STATUS: 'vector_search_status',
  EMBEDDING_STATUS: 'embedding_status',
  AI_RESPONSE_STATUS: 'ai_response_status',
  CREATE_CONVERSATION: 'create_conversation',
  CONVERSATION_INFO: 'conversation_info',
  GET_CONVERSATION: 'get_conversation',
  ERROR: 'error',
  CONNECTION_REPLACED: 'connection_replaced',
  CONNECTION_TIMEOUT: 'connection_timeout',
  PONG: 'pong'
};




// Define SendMessageOptions interface with clear documentation
interface SendMessageOptions {
  /** Message content to send */
  message: string;
  /** Message group ID (optional) */
  message_group_id?: string;
  /** Additional options for message processing */
  options?: {
    /** Whether to use vector search */
    do_vector_search?: boolean;
    /** Whether to use web search */
    do_web_search?: boolean;
    /** Whether to show extended thinking steps */
    extended_thinking?: boolean;
    /** Max tokens for extended thinking */
    extended_thinking_budget?: number;
    /** AI provider name */
    provider_name?: string;
    /** Model name */
    model_name?: string;
    /** Temperature for generation */
    temperature?: number;
    /** Max tokens in response */
    max_tokens?: number;
    /** Top-p sampling parameter */
    top_p?: number;
    /** Frequency penalty */
    frequency_penalty?: number;
    /** Presence penalty */
    presence_penalty?: number;
    /** Stop tokens for generation */
    stop?: string[];
  };
}

// Chat socket context interface with proper typing
interface ChatSocketContextProps {
  // Connection state
  connected: boolean;
  connecting: boolean;
  connectionStatus: WebSocketStatus;
  conversationId: string | null;
  

  
  // Socket operations
  connect: (conversationId?: string, sessionId?: string) => void;
  disconnect: () => void;
  sendMessage: (options: SendMessageOptions) => Promise<boolean>;
  cancelResponse: () => void;
  getConversationHistory: (conversationId: string) => void;
  createConversation: (title?: string, metadata?: Record<string, any>) => boolean;
  
  // Message group management
  messageGroups: MessageGroup[];
  responseWorkflowMaintainState: ResponseWorkflowMaintainState;
  isLoading: boolean;
  clearConversation: () => void;
}


interface ResponseWorkflowMaintainState {
  id: string;
  user_content: string;
  ai_content: string;
  created_at: string;
  updated_at: string;
  status: string;
  conversation_id: string;
  message_group_id: string;
  options: Record<string, any>;
  web_search: {
    status: string;
    results: any[];
    index: number;
    total: number;
    summary: string;
  };
  vector_search: {
    status: string;
    results: any[];
    index: number;
    total: number;
    summary: string;
  };
  system_content: string;
  processing_steps: {
    vector_search: 'running' | 'awaiting_results' | 'processing_summary' | 'completed' | 'failed' | 'skipped';
    web_search: 'running' | 'completed' | 'failed' | 'skipped';
    thinking: 'running' | 'skipped' | 'failed' | 'completed';
    ai_response: 'running' | 'completed' | 'failed' | 'skipped';
  }
}

// =============================================================================
// Helper functions
// =============================================================================

/**
 * Generate and manage session IDs
 * Creates a new session ID if none exists or retrieves from localStorage
 */
const getSessionId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let sessionId = localStorage.getItem('chatSessionId');
  
  if (!sessionId) {
    sessionId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    localStorage.setItem('chatSessionId', sessionId);
  }
  
  return sessionId;
};

/**
 * Create a WebSocket URL with appropriate parameters
 */
const createWebSocketUrl = (
  conversationId: string | undefined, 
  token: string, 
  sessionId: string
): string => {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const endpoint = conversationId ? `chat/${conversationId}/` : 'chat/';
  
  const host = process.env.NODE_ENV === 'production' 
    ? window.location.host
    : 'localhost:8000';
    
  // Create a safe session ID for WebSocket group name
  const safeSessionId = sessionId.replace(/[^\w\-\.]/g, '_');
  
  return `${wsProtocol}://${host}/ws/${endpoint}?token=${encodeURIComponent(token)}&session_id=${safeSessionId}`;
};

// Create the context with undefined as default value
const ChatSocketContext = createContext<ChatSocketContextProps | undefined>(undefined);

// =============================================================================
// Provider Component
// =============================================================================

export const ChatSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Socket state
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>('disconnected');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const sessionId = useRef<string>(typeof window !== 'undefined' ? getSessionId() : '');
  const searchParams = useSearchParams();
  const router = useRouter();
  // Message group state
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([]);
  const [messageGroup, setMessageGroup] = useState<MessageGroup | null>(null);
  const [pendingMessages, setPendingMessages] = useState<Array<any>>([]);
  const [responseWorkflowMaintainState, setResponseWorkflowMaintainState] = useState<ResponseWorkflowMaintainState>({
    id: '',
    user_content: '',
    ai_content: '',
    created_at: '',
    updated_at: '',
    status: '',
    conversation_id: '',
    message_group_id: '',
    options: {},
    web_search: {
      status: '',
      results: [],
      index: 0,
      total: 0,
      summary: ''
    },
    vector_search: {
      status: '',
      results: [],
      index: 0,
      total: 0,
      summary: ''
    },
    system_content: '',
    processing_steps: {
      vector_search: 'skipped',
      web_search: 'skipped',
      thinking: 'skipped',
      ai_response: 'skipped'
    }
  })
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for managing async operations
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelayMs = 2000;


  useEffect(() => {
    console.log('messageGroups', messageGroups);
  }, [messageGroups]);

  
  // -------------------------------------------------------------------------
  // reset functions
  // -------------------------------------------------------------------------
  const resetWorkflow = useCallback(() => {
    setResponseWorkflowMaintainState({
      id: '',
      user_content: '',
      ai_content: '',
      created_at: '',
      updated_at: '',
      status: '',
      conversation_id: '',
      message_group_id: '',
      options: {},
      web_search: {
        status: '',
        results: [],
        index: 0,
        total: 0,
        summary: ''
      },
      vector_search: {
        status: '',
        results: [],
        index: 0,
        total: 0,
        summary: ''
      },
      system_content: '',
      processing_steps: {
        vector_search: 'skipped',
        web_search: 'skipped',
        thinking: 'skipped',
        ai_response: 'skipped'
      }
    });
    setIsLoading(false);
  }, []);

  /**
   * Disconnect WebSocket connection
   */
  const disconnect = useCallback(() => {
    console.log('Disconnecting WebSocket connection');
    
    // Mark as disconnecting before actual close to prevent race conditions
    setConnected(false);
    setConnectionStatus('disconnected');
    
    // Clear the ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    // Close the socket if it exists
    if (socket) {
      try {
        // Only close if it's actually open
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close(1000, 'User disconnected');
        }
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      
      // Clear the socket reference
      setSocket(null);
    }
    
    // Reset conversation state - this is important to prevent 
    // old conversation data from displaying in a new conversation
    setMessageGroups([]);
    resetWorkflow();
    
    // Don't clear the conversationId from localStorage on normal disconnect
    // The currentConversationId should only be cleared when explicitly starting a new conversation
  }, [socket, resetWorkflow]);
  
  // -------------------------------------------------------------------------
  // Connection Management
  // -------------------------------------------------------------------------
  
  /**
   * Establish WebSocket connection to the server
   */
  const connect = useCallback(async (convoId?: string, sessId?: string) => {
    // Don't connect if we're already connecting
    if (connecting) {
      console.log('Already connecting, ignoring additional connect call');
      return;
    }
    
    // If already connected and the socket is open, check if we're already on the right conversation
    if (connected && socket?.readyState === WebSocket.OPEN) {
      const currentConvoId = conversationId;
      
      // If we're connecting to the same conversation we're already connected to, do nothing
      if (convoId && currentConvoId === convoId) {
        console.log(`Already connected to conversation ${convoId}, no need to reconnect`);
        return;
      }
      
      // If connecting to a different conversation, disconnect properly first
      if (convoId && currentConvoId !== convoId) {
        console.log(`Switching from conversation ${currentConvoId} to ${convoId}`);
        
        // Full disconnect to ensure clean slate
        disconnect();
        
        // Add a small delay before reconnecting to avoid race conditions
        console.log('Waiting before connecting to new conversation...');
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Set state to connecting to prevent multiple connection attempts
    console.log('Starting WebSocket connection');
    setConnecting(true);
    
    try {
      // Get authentication token
      const token = await TokenManager.getToken() || localStorage.getItem('token')
      if (!token) {
        console.error('Failed to get authentication token');
        setConnecting(false);
        return;
      }
      
      // Determine if we're creating a new conversation
      const isCreatingNewConversation = convoId === undefined;
      
      // If creating a new conversation, clear existing ID from localStorage
      if (isCreatingNewConversation) {
        console.log('Creating new conversation, removing any stored conversation ID');
        localStorage.removeItem('currentConversationId');
      }
      
      // For existing conversations, use the provided ID
      const targetConversationId = convoId || undefined;
      const targetSessionId = sessId || sessionId.current;
      
      // Log connection details
      if (targetConversationId) {
        console.log(`Connecting to existing conversation: ${targetConversationId}`);
      } else {
        console.log('Connecting to create a new conversation');
      }
      
      // Create WebSocket URL
      const wsUrl = createWebSocketUrl(targetConversationId, token, targetSessionId);
      
      // Create new WebSocket connection
      const ws = new WebSocket(wsUrl);
      
      // Set up event handlers
      ws.onopen = () => {
        console.log('WebSocket connection established');
        setConnectionStatus('connected');
        setConnected(true);
        setConnecting(false);
        reconnectAttemptRef.current = 0;
        
        // Start ping interval to keep connection alive
        startPingInterval(ws);
        
        // Store the WebSocket instance for later use
        setSocket(ws);
        
        // If connecting to an existing conversation, request its data
        if (targetConversationId) {
          try {
            console.log('Requesting initial data for conversation:', targetConversationId);
            ws.send(JSON.stringify({
              type: WS_MESSAGES.GET_CONVERSATION,
              conversation_id: targetConversationId
            }));
          } catch (error) {
            console.error('Error requesting initial conversation data:', error);
          }
        }
        
        // Process any pending messages that were queued while connecting
        if (pendingMessages.length > 0) {
          console.log(`Processing ${pendingMessages.length} pending messages`);
          
          // Create a local copy of the pending messages to process
          const messagesToProcess = [...pendingMessages];
          
          // Clear pending messages list first to prevent re-processing
          setPendingMessages([]);
          
          // Now process each message
          messagesToProcess.forEach(payload => {
            try {
              ws.send(JSON.stringify(payload));
            } catch (error) {
              console.error('Error sending pending message:', error);
            }
          });
        }
      };
      
      ws.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
        setConnectionStatus('disconnected');
        setConnected(false);
        
        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        
        // Only attempt to reconnect if not explicitly disconnected
        // and not a code 4010 (connection replaced)
        if (event.code !== 4010) {
          handleConnectionClosed(event);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('error');
      };
      
      ws.onmessage = (event) => handleWebSocketMessage(event);
      
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setConnecting(false);
      setConnectionStatus('error');
    }
  }, [connecting, connected, conversationId, disconnect, pendingMessages, socket]);

  /**
   * Set up a ping interval to keep the connection alive
   */
  const startPingInterval = useCallback((ws: WebSocket) => {
    // Clear any existing interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    // Set up new ping interval (every 30 seconds)
    pingIntervalRef.current = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }, []);

  /**
   * Handle WebSocket connection closure and reconnect if appropriate
   */
  const handleConnectionClosed = useCallback((event: CloseEvent) => {
    // Don't reconnect for specific close codes
    if (
      event.code === 1000 || // Normal closure
      event.code === 4001 || // Auth failed
      event.code === 4003 || // Access denied
      event.code === 4010    // Connection replaced
    ) {
      setConnecting(false);
      return;
    }
    
    // Attempt reconnection if under max attempts
    if (reconnectAttemptRef.current < maxReconnectAttempts) {
      reconnectAttemptRef.current += 1;
      const delay = reconnectDelayMs * reconnectAttemptRef.current;
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptRef.current}/${maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (!connected && !connecting) {
          // Use the last known conversation ID
          const storedConversationId = localStorage.getItem('currentConversationId');
          // Re-establish connection
          setConnecting(true);
          // We call connect in the next tick to avoid circular dependency
          setTimeout(() => connect(storedConversationId || undefined), 0);
        }
      }, delay);
    } else {
      console.log('Max reconnection attempts reached');
      setConnecting(false);
    }
  }, [connected, connecting]);

  /**
   * Handle incoming WebSocket messages
   */
  const handleWebSocketMessage = useCallback(async (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Process message based on type
      switch (data.type) {
        case WS_MESSAGES.CONNECTION_ESTABLISHED:
          handleConnectionEstablishedMessage(data);
          break;
          
        case WS_MESSAGES.USER_MESSAGE:
        
          const newMessageGroup = {
            id: data.message_group_id,
            user_content: data.message,
            ai_content: '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'processing',
            conversation_id: data.conversation_id,
            message_group_id: data.message_group_id,
            metadata: data.metadata
          } as MessageGroup;

          setResponseWorkflowMaintainState(prevState => ({
            ...prevState,
            message_group_id: data.message_group_id,
            metadata: {
              ...data.metadata //
            }
          }));
          
          // Add to messageGroups array
          setMessageGroups(prevGroups => [...prevGroups, newMessageGroup]);

          break;
          
        case WS_MESSAGES.PROCESSING_STARTED:
          handleProcessingStarted(data);
          break;
          
        case WS_MESSAGES.WEB_SEARCH_STATUS:
          handleWebSearchStatus(data);
          break;
          
        case WS_MESSAGES.VECTOR_SEARCH_STATUS:
          handleVectorSearchStatus(data);
          break;
          
        case WS_MESSAGES.EMBEDDING_STATUS:
          handleEmbeddingStatus(data);
          break;
          
        case WS_MESSAGES.AI_RESPONSE_STATUS:
          handleAIResponseStatus(data);
          break;
          
        case WS_MESSAGES.CONVERSATION_INFO:
          handleConversationInfo(data);
          break;
          
        case WS_MESSAGES.ERROR:
          handleErrorMessage(data);
          break;
          
        case WS_MESSAGES.CONNECTION_REPLACED:
          handleConnectionReplaced();
          break;
          
        case WS_MESSAGES.CONNECTION_TIMEOUT:
          handleConnectionTimeout();
          break;
          
        case WS_MESSAGES.PONG:
          // Silently acknowledge pong responses
          break;
          
        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }, [messageGroup, messageGroups, resetWorkflow]);
  
  /**
   * Handle WebSocket message for connection established
   */
  const handleConnectionEstablishedMessage = useCallback((data: any) => {
    // Process the connection established message
    console.log('Connection established message received:', data);
    setConversationId(data.conversation_id);
    
    // Store conversation ID in localStorage for persistence across refreshes
    if (data.conversation_id) {
      localStorage.setItem('currentConversationId', data.conversation_id);
    }

    // Check if we're on the main chat page - we shouldn't redirect if we are
    const currentPath = window.location.pathname;
    const isMainChatPage = currentPath === '/chat' || currentPath === '/chat/';
    
    // Only redirect if:
    // 1. Not on the main chat page
    // 2. Not already on a specific chat page
    // 3. Not already has an ID in the URL params
    if (!isMainChatPage && !currentPath.match(/^\/chat\/[^\/]+\/?$/) && !searchParams.get('id')) {
      console.log(`Redirecting to conversation page: /chat/${data.conversation_id}`);
      router.push(`/chat/${data.conversation_id}`);
    } else {
      console.log(`Not redirecting - current path: ${currentPath}, is main chat page: ${isMainChatPage}`);
    }
    
    // If this is a brand new conversation, initialize empty message groups
    if (data.is_new_conversation) {
      setMessageGroups([]);
    }
    
    // Important: Don't try to use the socket here - it will be handled by the onopen handler
    // This message handler runs after the message is received, but the socket ref might not be updated yet
  }, [searchParams, router]);
  
  /**
   * Handle processing started message
   */
  const handleProcessingStarted = useCallback((data: any) => {
    setIsLoading(true);
    
    // Update ResponseWorkflowMaintainState
    setResponseWorkflowMaintainState(prevState => ({
      ...prevState,
      status: 'processing',
      processing_steps: {
        ...prevState.processing_steps,
        // Initialize all steps to appropriate starting states
        web_search: data.options?.do_web_search ? 'running' : 'skipped',
        vector_search: data.options?.do_vector_search ? 'running' : 'skipped',
        thinking: data.options?.extended_thinking ? 'running' : 'skipped',
        ai_response: 'skipped' // Will be set to running when AI generation starts
      }
    }));
    
  }, []);
  
  /**
   * Handle web search status updates
   */
  const handleWebSearchStatus = useCallback((data: SearchResultsData) => {
    // Use type assertion to access status property
    const status = (data as any).status || '';
    const results = data.results || [];
    
    if (status === 'started') {
      // Update ResponseWorkflowMaintainState
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        status: 'searching_web',
        web_search: {
          ...prevState.web_search,
          status: 'started'
        },
        processing_steps: {
          ...prevState.processing_steps,
          web_search: 'running'
        }
      }));
    } else if (status === 'completed' && results.length > 0) {
      // Update with search results
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        web_search: {
          ...prevState.web_search,
          status: 'completed',
          results: results
        },
        processing_steps: {
          ...prevState.processing_steps,
          web_search: 'completed'
        }
      }));
    } else if (status === 'web_search_partial_result') {
      // Update ResponseWorkflowMaintainState with partial search results
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        web_search: {
          ...prevState.web_search,
          status: 'partial_result',
          results: [...prevState.web_search.results, data.result],
          index: data.index ?? 0,
          total: data.total ?? 0
        },
        processing_steps: {
          ...prevState.processing_steps,
          web_search: 'running'
        }
      }));
    } else if (status === 'skipped') {
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        web_search: {
          ...prevState.web_search,
          status: 'skipped'
        },
        processing_steps: {
          ...prevState.processing_steps,
          web_search: 'skipped'
        }
      }));
    } else if (status === 'failed') {
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        web_search: {
          ...prevState.web_search,
          status: 'failed'
        },
        processing_steps: {
          ...prevState.processing_steps,
          web_search: 'failed'
        }
      }));
    }
  }, []);
  
  /**
   * Handle vector search status updates
   */
  const handleVectorSearchStatus = useCallback((data: SearchResultsData) => {
    // Use type assertion to access status property
    const status = (data as any).status || '';
    const results = data.results || [];
    
    if (status === 'started') {
      // Update ResponseWorkflowMaintainState
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        status: 'searching_context',
        vector_search: {
          ...prevState.vector_search,
          status: 'started'
        },
        processing_steps: {
          ...prevState.processing_steps,
          vector_search: 'running'
        }
      }));
    } else if (status === 'completed' && results.length > 0) {
      // Update with vector search results
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        vector_search: {
          ...prevState.vector_search,
          status: 'completed',
          results: results
        },
        processing_steps: {
          ...prevState.processing_steps,
          vector_search: 'completed'
        }
      }));
    } else if (status === 'skipped') {
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        vector_search: {
          ...prevState.vector_search,
          status: 'skipped'
        },
        processing_steps: {
          ...prevState.processing_steps,
          vector_search: 'skipped'
        }
      }));
    } else if (status === 'failed') {
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        vector_search: {
          ...prevState.vector_search,
          status: 'failed'
        },
        processing_steps: {
          ...prevState.processing_steps,
          vector_search: 'failed'
        }
      }));
    } else if (status === 'awaiting_results') {
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        vector_search: {
          ...prevState.vector_search,
          status: 'awaiting_results'
        },
        processing_steps: {
          ...prevState.processing_steps,
          vector_search: 'awaiting_results'
        }
      }));
    }
  }, []);

  /**
   * Handle embedding status updates
   */
  const handleEmbeddingStatus = useCallback((data: any) => {
    // Use type assertion to access status property
    const status = (data as any).status || '';
    const results = data.results || [];
    const content = data.content || '';

    if (status === 'vector_search_data') {
      // Update ResponseWorkflowMaintainState
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        vector_search: {
          ...prevState.vector_search,
          results: results,
          status: 'embedding_started'
        },
        processing_steps: {
          ...prevState.processing_steps,
          vector_search: 'processing_summary'
        }
      }));
    }
    else if (status === 'started') {
      console.log('embedding started');
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        processing_steps: {
          ...prevState.processing_steps,
          vector_search: 'processing_summary'
        }
      }));
    } else if (status === 'embedding_partial') {
      // Handle partial embedding content
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        vector_search: {
          ...prevState.vector_search,
          status: 'embedding_in_progress',
          summary: prevState.vector_search.summary + content
        },
        processing_steps: {
          ...prevState.processing_steps,
          vector_search: 'processing_summary'
        }
      }));
    } else if (status === 'embedding_processed') {
      // Handle completed embedding with context
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        vector_search: {
          ...prevState.vector_search,
          status: 'embedding_completed',
          summary: prevState.vector_search.summary + content
        },
        processing_steps: {
          ...prevState.processing_steps,
          vector_search: 'completed'
        }
      }));
    } else if (status === 'completed' && results.length > 0) {
      // Update with embedding results
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        status: 'embedding_results_ready',
        vector_search: {
          ...prevState.vector_search,
          status: 'completed'
        },
        processing_steps: {
          ...prevState.processing_steps,
          vector_search: 'completed'
        }
      }));
    } else if (status === 'failed') {
      setResponseWorkflowMaintainState(prevState => ({
        ...prevState,
        vector_search: {
          ...prevState.vector_search,
          status: 'failed'
        },
        processing_steps: {
          ...prevState.processing_steps,
          vector_search: 'failed'
        }
      }));
    }
  }, []);
  
  /**
   * Handle AI response status updates
   */
  const handleAIResponseStatus = useCallback((data: any) => {
    const { status } = data;
    
    switch (status) {
      case 'generation_started':
        setIsLoading(true);
        // Update ResponseWorkflowMaintainState
        setResponseWorkflowMaintainState(prevState => ({
          ...prevState,
          status: 'generating',
          processing_steps: {
            ...prevState.processing_steps,
            ai_response: 'running'
          }
        }));
        break;
        
      case 'token':
        if ('token' in data) {
          // Also update the local messageGroup state with the token
          setResponseWorkflowMaintainState(prevState => ({
            ...prevState,
            ai_content: prevState.ai_content + data.token,
            processing_steps: {
              ...prevState.processing_steps,
              ai_response: 'running'
            }
          }));
        }
        break;
      
      case 'thinking_partial_result':
        if ('content' in data) {
          setResponseWorkflowMaintainState(prevState => ({
            ...prevState,
            system_content: prevState.system_content + data.content,
            processing_steps: {
              ...prevState.processing_steps,
              thinking: 'running'
            }
          }));
        }
        break;
        
      case 'thinking_completed':
        setResponseWorkflowMaintainState(prevState => ({
          ...prevState,
          processing_steps: {
            ...prevState.processing_steps,
            thinking: 'completed'
          }
        }));
        break;
        
      case 'generation_completed':
        setIsLoading(false);
        
        // Update message group with final content
        if ('message_group' in data && data.message_group) {
          const updatedMessageGroup = {
            ...data.message_group,
            id: data.message_group_id
          };
          
          // Update the current message group
          setMessageGroup(updatedMessageGroup);
          
          // Update ResponseWorkflowMaintainState
          setResponseWorkflowMaintainState(prevState => {
            return {
              ...prevState,
              status: 'completed',
              processing_steps: {
                ...prevState.processing_steps,
                ai_response: 'completed'
              }
            };
          });
        }
        break;
        
      case 'error':
        setIsLoading(false);        
        // Update ResponseWorkflowMaintainState with error status
        setResponseWorkflowMaintainState(prevState => {
          // Determine which step failed based on the error data
          const updatedProcessingSteps = { ...prevState.processing_steps };
          
          // Check if error data specifies which step failed
          if (data.error_source === 'thinking') {
            updatedProcessingSteps.thinking = 'failed';
          } else if (data.error_source === 'web_search') {
            updatedProcessingSteps.web_search = 'failed';
          } else if (data.error_source === 'vector_search') {
            updatedProcessingSteps.vector_search = 'failed';
          } else {
            // Default to AI response error if source not specified
            updatedProcessingSteps.ai_response = 'failed';
          }
          
          return {
            ...prevState,
            status: 'error',
            processing_steps: updatedProcessingSteps
          };
        });
        break;
    }
  }, [setMessageGroups]);
  
  /**
   * Handle conversation information
   */
  const handleConversationInfo = useCallback((data: any) => {
    console.log('handleConversationInfo', data);
    if (data.message_groups) {
      setMessageGroups(data.message_groups);
    }
  }, []);
  
  /**
   * Handle error messages from server
   */
  const handleErrorMessage = useCallback((data: ErrorData) => {
    console.error('Server error:', data.message);
    // Update ResponseWorkflowMaintainState with error status
    setResponseWorkflowMaintainState(prevState => ({
      ...prevState,
      status: 'error'
    }));
  }, []);
  
  /**
   * Handle connection replaced message
   */
  const handleConnectionReplaced = useCallback(() => {
    disconnect();
    // Could show a notification that another client took over
  }, [disconnect]);
  
  /**
   * Handle connection timeout message
   */
  const handleConnectionTimeout = useCallback(() => {
    disconnect();
    // Could show a notification about inactivity timeout
  }, [disconnect]);
  
  // -------------------------------------------------------------------------
  // User Actions
  // -------------------------------------------------------------------------
  
  /**
   * Send a user message through the WebSocket
   */
  const sendMessage = useCallback(async (options: any): Promise<boolean> => {
    
    // Prepare message payload
    const payload = {
      type: 'message',
      message: options.message,
      options: {
        do_web_search: options.do_web_search,
        do_vector_search: options.do_vector_search,
        provider_name: options.provider_name,
        model_name: options.model_name,
        temperature: options.temperature,
        max_tokens: options.max_tokens,
        top_p: options.top_p,
        extended_thinking: options.extended_thinking,
        extended_thinking_budget: options.extended_thinking_budget,
        frequency_penalty: options.frequency_penalty,
        presence_penalty: options.presence_penalty,
        stop: options.stop
      }
    };

    resetWorkflow();

    if(messageGroup !== null) {
      const findIndex = messageGroups.findIndex(group => group.id === messageGroup.id);
      if (findIndex >= 0) {
        messageGroups[findIndex] = messageGroup;
        setMessageGroups([...messageGroups]); // Ensure proper state update with a new array
      }
      setMessageGroup(null);
    }

    // Check if this message is already in pendingMessages to prevent duplicate queuing
    const isDuplicate = pendingMessages.some(msg => 
      msg.message === payload.message && 
      msg.options.model_name === payload.options.model_name
    );

    // If socket isn't connected yet, queue the message if it's not a duplicate
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      if (!isDuplicate) {
        console.log('WebSocket not connected, queueing message');
        setPendingMessages(prev => [...prev, payload]);
      } else {
        console.log('Message already queued, skipping duplicate');
      }
      // Return true since we've accepted the message (just queued it)
      return true;
    }
    
    try {
      // Send the message
      socket.send(JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [socket, messageGroup, messageGroups, resetWorkflow, pendingMessages]);
  
  /**
   * Cancel the current AI response
   */
  const cancelResponse = useCallback(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }
    
    try {
   
        socket.send(JSON.stringify({
          command: 'cancel'
        }));
        
        // Update local state to reflect cancellation
        setIsLoading(false);
        resetWorkflow();
    } catch (error) {
      console.error('Error canceling response:', error);
    }
  }, [socket, conversationId, resetWorkflow]);
  
  /**
   * Retrieve conversation history
   */
  const getConversationHistory = useCallback((convoId: string) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }
    
    try {
      socket.send(JSON.stringify({
        type: WS_MESSAGES.GET_CONVERSATION,
        conversation_id: convoId
      }));
    } catch (error) {
      console.error('Error requesting conversation history:', error);
    }
  }, [socket]);
  
  /**
   * Create a new conversation
   */
  const createConversation = useCallback((title?: string, metadata?: Record<string, any>): boolean => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }
    
    try {
      // Clear any existing conversation ID from localStorage to ensure we create a new one
      localStorage.removeItem('currentConversationId');
      
      socket.send(JSON.stringify({
        type: WS_MESSAGES.CREATE_CONVERSATION,
        title,
        metadata
      }));
      
      return true;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return false;
    }
  }, [socket]);
  
  /**
   * Clear the current conversation
   */
  const clearConversation = useCallback(() => {
    setMessageGroups([]);
    
    // Remove the conversation ID from localStorage
    localStorage.removeItem('currentConversationId');
    
    // If connected, create a new conversation
    if (socket && socket.readyState === WebSocket.OPEN) {
      createConversation();
    }
  }, [socket, createConversation]);
  
  // -------------------------------------------------------------------------
  // Lifecycle Effects
  // -------------------------------------------------------------------------
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [socket]);

  // -------------------------------------------------------------------------
  // Context Provider
  // -------------------------------------------------------------------------
  
  const contextValue: ChatSocketContextProps = {
    connected,
    connecting,
    connectionStatus,
    conversationId,
    connect,
    disconnect,
    sendMessage,
    cancelResponse,
    getConversationHistory,
    createConversation,
    messageGroups,
    responseWorkflowMaintainState,
    isLoading,
    clearConversation
  };
  
  return (
    <ChatSocketContext.Provider value={contextValue}>
      {children}
    </ChatSocketContext.Provider>
  );
};

// =============================================================================
// Custom Hook
// =============================================================================

export const useChatSocket = (): ChatSocketContextProps => {
  const context = useContext(ChatSocketContext);
  
  if (context === undefined) {
    throw new Error('useChatSocket must be used within a ChatSocketProvider');
  }
  
  return context;
};

export default ChatSocketContext;
  