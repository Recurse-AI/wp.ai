"use client";

import { EventEmitter } from "events";
import { v4 as uuidv4 } from 'uuid';
import TokenManager from "@/lib/tokenManager";
import axios from "axios";



export enum WebSocketEventType {
  CONNECTION_ESTABLISHED = "connection_established",
  PROCESSING_STATUS = "processing_status",
  THINKING_UPDATE = "thinking_update",
  TEXT_UPDATE = "text_update",
  AI_ERROR = "ai_error",
  FILE_UPDATE = "file_update", 
  FILE_EDIT_NOTIFICATION = "file_edit_notification",
  USER_ACTIVITY_NOTIFICATION = "user_activity_notification",
  AGENT_RESPONSE = "agent_response",
  TOOL_RESULT = "tool_result",
  TOOL_STATUS_UPDATE = "tool_status_update",
  WORKSPACE_HISTORY = "workspace_history",
  AVAILABLE_TOOLS = "available_tools",
  WORKSPACE_CREATED = "workspace_created",
  MESSAGE_UPDATE = "message_update",
  STREAM_COMPLETE = "stream_complete",
  
  // Additional events from the backend that need to be handled
  ERROR_UPDATE = "error_update",
  QUERY_AGENT = "query_agent",
  MESSAGE_STATUS = "message_status",
  USER_MESSAGE = "user_message",
  MESSAGE_RECEIVED = "message_received",
  ASSISTANT_RESPONSE = "assistant_response",
  TOOL_CALL = "tool_call",
  TOOL_COMPLETE = "tool_complete",
  TOOL_ERROR = "tool_error",
  TOOL_REQUEST = "tool_request",
  BLOCK_START = "block_start",
  BLOCK_STOP = "block_stop",
  COMPLETE = "complete",
  THINKING = "thinking",
  TEXT = "text",
  ERROR = "error"
}

export enum ToolStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed"
}

export interface WebSocketMessage {
  type: WebSocketEventType | string;
  workspace_id?: string;
  status?: string;
  user_id?: string;
  message_id?: string;
  thinking?: string;
  text?: string;
  error?: {
    message: string;
    details?: any;
  };
  file?: {
    id: string;
    path: string;
    content?: string;
  };
  edit?: {
    file_id: string;
    path: string;
    edit_type: "create" | "update" | "delete";
    user_id: string;
  };
  activity?: {
    user_id: string;
    action: string;
    details?: any;
  };
  tool_name?: string;
  tool_id?: string;
  tool_status?: ToolStatus;
  result?: any;
  query?: string;
  response?: string;
  mode?: string;
  history?: any[];
  tools?: any[];
  workspace?: {
    id: string;
    name: string;
    created_at?: string;
  };
  role?: string;
  content?: string;
  content_type?: string;
  operation_id?: string;
  timestamp?: string;
  sender?: string;
  is_processing?: boolean;
}

// Constants
const CONNECTION_TIMEOUT_MS = 10000;
const OPERATION_TIMEOUT_MS = 30000;
const MAX_RECONNECT_ATTEMPTS = 5;

// Define a better type for the message stream data
interface MessageStreamData {
  content: string;
  messageId?: string;
  workspaceId?: string | null;
}

export class WebSocketService extends EventEmitter {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private workspaceId: string | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private forcedReconnect = false;
  private apiBaseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL || '';
  private wsBaseUrl: string = process.env.NEXT_PUBLIC_WS_URL || '';
  private lastMessageReceived: number | null = null;
  private connectingPromise: Promise<void> | null = null;
  private pendingOperations = new Map<string, number>();
  private operationTimeouts = new Map<string, NodeJS.Timeout>();
  private messageQueue: WebSocketMessage[] = [];
  private toolStatus = new Map<string, ToolStatus>();
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'connecting';
  private messageStreams: Map<string, MessageStreamData> = new Map<string, MessageStreamData>();
  
  constructor() {
    super();
    this.setMaxListeners(100);
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''; 
    this.wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || '';
    this.messageStreams = new Map<string, MessageStreamData>();
  }
  
  /**
   * Get the current connection status
   */
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    return this.connectionStatus;
  }
  
  /**
   * Creates a workspace with a frontend-generated ID for smoother UI transitions
   * @param workspaceName Name of the workspace
   * @returns Promise with the workspace object
   */
  async createWorkspaceWithId(workspaceName: string): Promise<{id: string, name: string}> {
    if (typeof window === 'undefined') {
      throw new Error('Cannot create workspace on server side');
    }

    // Generate a UUID for the workspace ID
    const workspaceId = uuidv4();
    
    // Get token for authentication
    let token = TokenManager.getToken();
    if (!token) {
      token = localStorage.getItem('token') || '';
      if (!token) {
        throw new Error('Authentication token not found');
      }
    }

    try {
      // Call API to create workspace with the frontend-generated ID
      const response = await axios.post(`${this.apiBaseUrl}/api/workspace/workspaces/`, {
        id: workspaceId,
        name: workspaceName || `Workspace ${new Date().toLocaleString()}`
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('response', response);

      const workspace = response.data;
      
      // Pre-establish websocket connection for smoother experience
      this.connect(workspace.id);
      
      return workspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error;
    }
  }
  
  connect(workspaceId: string): Promise<void> {
    // First check if we're already connected to this workspace
    if (this.isConnected && this.workspaceId === workspaceId && this.socket?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    
    // Check if a connection attempt is already in progress
    if (this.connectingPromise && this.workspaceId === workspaceId) {
      return this.connectingPromise;
    }
    
    // Update connection status to connecting
    this.connectionStatus = 'connecting';
    this.emit('connection_status_change', { status: this.connectionStatus });
    
    this.connectingPromise = new Promise<void>((resolve, reject) => {
      if (!workspaceId || workspaceId === 'undefined' || workspaceId === 'null') {
        const error = {
          message: 'Invalid workspace ID provided',
          details: { workspaceId },
          timestamp: new Date().toISOString()
        };
        this.connectingPromise = null;
        reject(error);
        return;
      }
      
      this.disconnect(false);
      this.workspaceId = workspaceId;
      
      const baseWsUrl = this.getWebSocketBaseUrl();
      const url = `${baseWsUrl}/ws/workspace/${workspaceId}/`;
      
      try {
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
        }
        
        this.connectionTimeout = setTimeout(() => {
          if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
            const timeoutError = {
              message: 'WebSocket connection timeout',
              url,
              details: { workspaceId },
              timestamp: new Date().toISOString()
            };
            this.disconnect(false);
            this.connectingPromise = null;
            reject(timeoutError);
          }
        }, CONNECTION_TIMEOUT_MS);
        
        let token = TokenManager.getToken();
        if (typeof window !== 'undefined' && !token) {
          token = localStorage.getItem('token') || '';
        }
        
        let authUrl = url;
        if (token) {
          authUrl = `${url}?token=${encodeURIComponent(token)}`;
        }
        
        this.socket = new WebSocket(authUrl);
        
        this.socket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Update connection status to connected
          this.connectionStatus = 'connected';
          this.emit('connection_status_change', { status: this.connectionStatus });
          
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          this.lastMessageReceived = Date.now();
          
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
          }
          
          this.emit(WebSocketEventType.CONNECTION_ESTABLISHED, {
            type: WebSocketEventType.CONNECTION_ESTABLISHED,
            workspace_id: this.workspaceId,
            timestamp: new Date().toISOString()
          });
          
          this.processMessageQueue();
          
          this.connectingPromise = null;
          this.forcedReconnect = false;
          
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          try {
            this.lastMessageReceived = Date.now();
            console.log('Received message:', event.data);
            
           
            const data: WebSocketMessage = JSON.parse(event.data);
            
            this.reconnectAttempts = 0;
            
            // Handle tool status updates
            if (data.type === WebSocketEventType.TOOL_RESULT && data.tool_id) {
              this.updateToolStatus(data.tool_id, ToolStatus.COMPLETED);
            }
            
            // Special handling for processing status updates
            if (data.type === WebSocketEventType.PROCESSING_STATUS || 
                data.type === 'processing_status' || 
                data.type === 'message_status') {
              console.log('Processing status update:', data);
              
              // Extract the processing state
              const isProcessing = data.status === 'processing' || data.is_processing === true;
              
              // Emit processing status event
              this.emit('processing_status', {
                ...data,
                type: WebSocketEventType.PROCESSING_STATUS,
                is_processing: isProcessing
              });
              
              // If processing is completed, also emit a complete event to ensure response is shown
              if (!isProcessing && data.status === 'completed') {
                this.emit('complete', {
                  type: 'complete',
                  content: 'Process completed with all tool calls'
                });
              }
              
              // Also emit the original message
              this.emit(data.type, data);
              this.emit('message', data);
              
              return;
            }
            
            // Special handling for new_message events
            if (data.type === 'new_message') {
              console.log('Received new_message:', data);
              
              // For all new_message events, make sure to forward them to listeners
              this.emit(data.type, data);
              this.emit('message', data);
              
              // Additional handling for assistant messages
              if (data.sender === 'assistant') {
                const responseData = {
                  ...data,
                  type: WebSocketEventType.AGENT_RESPONSE,
                  content: data.text,
                };
                this.emit(WebSocketEventType.AGENT_RESPONSE, responseData);
              }
              
              // Mark the operation as complete
              if (data.operation_id) {
                this.completeOperation(data.operation_id);
              }
              
              return;
            }
            
            // Special handling for Anthropic message types
            if (data.type === 'block_start') {
              console.log('Received block_start:', data);
              
              // Add workspace_id to the block_start events if not present
              const blockStartData = {
                ...data,
                workspace_id: data.workspace_id || this.workspaceId || null
              };
              
              // Transform to appropriate format for the frontend
              if (data.content_type === 'thinking') {
                // Start a new thinking block
                this.emit('thinking_start', blockStartData);
              } else if (data.content_type === 'text') {
                // Start a new text response block
                this.emit('text_start', blockStartData);
              }
              
              // Emit the original event too
              this.emit(data.type, blockStartData);
              this.emit('message', blockStartData);
              
              if (data.operation_id) {
                this.completeOperation(data.operation_id);
              }
              return;
            }
            
            if (data.type === 'block_stop') {
              console.log('Received block_stop:', data);
              
              // Add workspace_id to the block_stop events if not present
              const blockStopData = {
                ...data,
                workspace_id: data.workspace_id || this.workspaceId || null
              };
              
              // Check for accumulated thinking stream if this is the end of a thinking block
              const thinkingStreamId = `thinking_${this.workspaceId}`;
              const thinkingStream = this.messageStreams.get(thinkingStreamId);
              
              if (thinkingStream && thinkingStream.content) {
                // Emit a complete thinking content event
                const completeThinkingEvent = {
                  type: WebSocketEventType.STREAM_COMPLETE,
                  message_id: thinkingStream.messageId || uuidv4(),
                  content: thinkingStream.content,
                  content_type: 'thinking',
                  workspace_id: blockStopData.workspace_id,
                  timestamp: new Date().toISOString()
                };
                
                console.log('Emitting stream_complete for thinking:', completeThinkingEvent);
                this.emit(WebSocketEventType.STREAM_COMPLETE, completeThinkingEvent);
                
                // Clear the thinking stream
                this.messageStreams.delete(thinkingStreamId);
              }
              
              // Check for accumulated text stream
              const textStreamId = `text_${this.workspaceId}`;
              const textStream = this.messageStreams.get(textStreamId);
              
              if (textStream && textStream.content) {
                // For text streams, we wait for the complete event to emit the full text
                console.log('Text stream exists and will be emitted on complete event');
              }
              
              // Emit the block_stop event
              this.emit(data.type, blockStopData);
              this.emit('message', blockStopData);
              
              if (data.operation_id) {
                this.completeOperation(data.operation_id);
              }
              return;
            }
            
            if (data.type === 'thinking') {
              console.log('Received thinking:', data);
              
              // Add workspace_id to the thinking content if not present
              const thinkingData = {
                ...data,
                type: WebSocketEventType.THINKING_UPDATE,
                thinking: data.content || '',
                workspace_id: data.workspace_id || this.workspaceId || null
              };
              
              // Accumulate the thinking content
              const streamId = `thinking_${this.workspaceId}`;
              const currentStream = this.messageStreams.get(streamId) || {
                content: '',
                workspaceId: thinkingData.workspace_id
              };
              currentStream.content += thinkingData.content || '';
              
              // Store the message ID for later use
              if (data.message_id && !currentStream.messageId) {
                currentStream.messageId = data.message_id;
              }
              
              // Update the stream
              this.messageStreams.set(streamId, currentStream as MessageStreamData);
              
              // Emit both the original thinking event and the converted update event
              this.emit(data.type, thinkingData);
              this.emit(WebSocketEventType.THINKING_UPDATE, thinkingData);
              this.emit('message', thinkingData);
              
              if (data.operation_id) {
                this.completeOperation(data.operation_id);
              }
              return;
            }
            
            if (data.type === 'text') {
              console.log('Received text:', data);
              
              // Add workspace_id to the text content if not present
              const textData = {
                ...data,
                type: WebSocketEventType.TEXT_UPDATE,
                text: data.content || '',
                workspace_id: data.workspace_id || this.workspaceId || null
              };
              
              // Accumulate the text content with proper typing
              const streamId = `text_${this.workspaceId}`;
              const currentStream = this.messageStreams.get(streamId) || { 
                content: '', 
                workspaceId: textData.workspace_id
              };
              
              // Update the content
              currentStream.content += textData.content || '';
              
              // Store the message ID for later use (with proper type check)
              if (data.message_id && !currentStream.messageId) {
                currentStream.messageId = data.message_id;
              }
              
              // Update the stream with the correct type
              this.messageStreams.set(streamId, currentStream as MessageStreamData);
              
              // Still emit the individual events for other listeners
              this.emit(data.type, textData);
              this.emit(WebSocketEventType.TEXT_UPDATE, textData);
              this.emit('message', textData);
              
              if (data.operation_id) {
                this.completeOperation(data.operation_id);
              }
              return;
            }
            
            if (data.type === 'complete') {
              console.log('Received complete:', data);
              
              // Add workspace_id to the complete event if not present
              const completeData = {
                ...data,
                workspace_id: data.workspace_id || this.workspaceId || null
              };
              
              // Get the current active text stream
              const streamId = `text_${this.workspaceId}`;
              const currentStream = this.messageStreams.get(streamId);
              
              if (currentStream && currentStream.content) {
                // Emit a complete text content event with the accumulated content
                const completeTextEvent = {
                  type: WebSocketEventType.STREAM_COMPLETE,
                  message_id: currentStream.messageId || uuidv4(),
                  content: currentStream.content,
                  content_type: 'text',
                  workspace_id: completeData.workspace_id,
                  timestamp: new Date().toISOString()
                };
                
                console.log('Emitting stream_complete for text:', completeTextEvent);
                this.emit(WebSocketEventType.STREAM_COMPLETE, completeTextEvent);
                
                // Clear the stream
                this.messageStreams.delete(streamId);
              }
              
              // Emit the complete event
              this.emit(data.type, completeData);
              this.emit('message', completeData);
              
              if (data.operation_id) {
                this.completeOperation(data.operation_id);
              }
              return;
            }
            
            // Special handling for thinking updates - convert to regular message type
            // This will prevent errors on the backend when it tries to handle thinking_update
            if (data.type === WebSocketEventType.THINKING_UPDATE) {
              // Convert to text_update for internal processing
              const thinkingData = {
                ...data,
                type: WebSocketEventType.TEXT_UPDATE,
                text: data.thinking || '',
                role: 'thinking',
                workspace_id: data.workspace_id || this.workspaceId || null
              };
              
              // Emit both the original thinking event and the converted text event
              this.emit(WebSocketEventType.THINKING_UPDATE, data);
              this.emit(WebSocketEventType.TEXT_UPDATE, thinkingData);
              this.emit('message', thinkingData);
              
              // Skip default emit for thinking_update since we handled it specially
              if (data.operation_id) {
                this.completeOperation(data.operation_id);
              }
              return;
            }
            
            if (data.operation_id) {
              this.completeOperation(data.operation_id);
            }
            
            // Default event emission for anything we didn't handle specially
            this.emit(data.type, data);
            this.emit('message', data);
          } catch (err) {
            console.error('Error processing WebSocket message:', err);
          }
        };
        
        this.socket.onerror = (error) => {
          const detailedError = {
            message: 'WebSocket connection error',
            url: authUrl.replace(/token=([^&]+)/, 'token=REDACTED'),
            details: error,
            timestamp: new Date().toISOString()
          };
          
          // Set connection status to disconnected on error
          this.connectionStatus = 'disconnected';
          this.emit('connection_status_change', { status: this.connectionStatus });
          
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          if (!this.isConnected) {
            this.connectingPromise = null;
            reject(detailedError);
          }
        };
        
        this.socket.onclose = (event) => {
          const wasConnected = this.isConnected;
          this.isConnected = false;
          
          // Update connection status to disconnected
          this.connectionStatus = 'disconnected';
          this.emit('connection_status_change', { status: this.connectionStatus });
          
          this.connectingPromise = null;
          
          if (wasConnected) {
            this.emit('disconnect', {
              type: 'disconnect',
              reason: event.reason || 'WebSocket closed',
              code: event.code,
              timestamp: new Date().toISOString()
            });
          }
          
          // If we're forcing a reconnect, don't emit reconnect_failed
          if (this.forcedReconnect) {
            return;
          }
          
          const cleanDisconnect = event.code === 1000 || event.code === 1001;
          
          if (!cleanDisconnect && wasConnected && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            this.scheduleReconnect();
          } else if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && !cleanDisconnect) {
            this.emit('reconnect_failed', { 
              type: 'reconnect_failed',
              timestamp: new Date().toISOString(),
              details: {
                attempts: this.reconnectAttempts,
                workspace_id: this.workspaceId,
                closeEvent: {
                  code: event.code,
                  reason: event.reason,
                  wasClean: event.wasClean
                }
              }
            });
            
            this.clearAllPendingOperations();
          }
        };
      } catch (err) {
        const connectionError = {
          message: 'Failed to create WebSocket connection',
          url,
          error: err,
          timestamp: new Date().toISOString()
        };
        
        // Update connection status to error
        this.connectionStatus = 'error';
        this.emit('connection_status_change', { status: this.connectionStatus }); 
        
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        this.connectingPromise = null;
        reject(connectionError);
      }
    });
    
    return this.connectingPromise;
  }
  
  disconnect(resetWorkspaceId = true): void {
    this.clearAllPendingOperations();
    this.connectingPromise = null;
    
    // Update connection status to disconnected
    this.connectionStatus = 'disconnected';
    this.emit('connection_status_change', { status: this.connectionStatus });
    
    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
        try {
          this.socket.close(1000, 'Client initiated disconnect');
        } catch (err) {
          console.error('Error closing WebSocket:', err);
        }
      }
      
      this.socket = null;
    }
    
    this.isConnected = false;
    
    if (resetWorkspaceId && !this.forcedReconnect) {
      this.workspaceId = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
  
  isConnectedToWorkspace(workspaceId: string): boolean {
    if (!workspaceId || workspaceId === 'undefined' || workspaceId === 'null') {
      return false;
    }
    
    const basicCheck = this.isConnected && 
                      this.socket?.readyState === WebSocket.OPEN;
    
    const workspaceMatch = this.workspaceId === workspaceId;
    
    return basicCheck && workspaceMatch;
  }
  
  cleanWorkspace(workspaceId: string): void {
    if (!workspaceId) return;
    
    if (typeof window !== 'undefined') {
      const workspacePrefix = `workspace-${workspaceId}`;
      
      Object.keys(localStorage).forEach(key => {
        if (key.includes(workspaceId) || key.startsWith(workspacePrefix)) {
          localStorage.removeItem(key);
        }
      });
      
      if (this.workspaceId === workspaceId) {
        this.disconnect();
      }
    }
  }
  
  private scheduleReconnect(): void {
    // Don't schedule multiple reconnects
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Update connection status to connecting during reconnect
    this.connectionStatus = 'connecting';
    this.emit('connection_status_change', { status: this.connectionStatus });
    
    // Don't attempt reconnect if already connected or connecting
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      return;
    }
    
    if (this.socket?.readyState === WebSocket.CONNECTING) {
      return;
    }
    
    // Don't attempt to reconnect without a workspace ID
    if (!this.workspaceId) {
      return;
    }
    
    // Limit reconnect attempts
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.emit('reconnect_failed', {
        type: 'reconnect_failed',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    this.reconnectAttempts += 1;
    
    const baseSec = Math.min(Math.pow(2, this.reconnectAttempts - 1), 30);
    const jitterSec = 0.5 * Math.random();
    const delayMs = Math.floor((baseSec + jitterSec) * 1000);
    
    this.forcedReconnect = true;
    
    this.reconnectTimeout = setTimeout(async () => {
      if (this.isConnected || !this.workspaceId) {
        return;
      }
      
      try {
        await this.connect(this.workspaceId);
        this.reconnectAttempts = 0;
      } catch (error) {
        this.scheduleReconnect();
      }
    }, delayMs);
  }
  
  private getWebSocketBaseUrl(): string {
    if (typeof window === 'undefined') {
      return '';
    }
    
    if (process.env.NODE_ENV === 'development') {
      return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
    
    return `${protocol}//${host}`;
  }
  
  send(data: string | object): boolean {
    // Check if we're actually connected
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        const messageToSend = typeof data === 'string' ? data : JSON.stringify(data);
        this.socket.send(messageToSend);
        console.log('WebSocket message sent:', typeof data === 'string' ? data.substring(0, 50) : JSON.stringify(data).substring(0, 50) + '...');
        return true;
      } catch (err) {
        console.error('Error sending message:', err);
        // Dont try to reconnect here - let the health check handle that
        return false;
      }
    }
    
    // Not connected, queue the message for later
    if (typeof data === 'object') {
      this.enqueueMessage(data as WebSocketMessage);
    } else {
      try {
        this.enqueueMessage(JSON.parse(data));
      } catch (err) {
        console.error('Error parsing message for queue:', err);
      }
    }
    
    // Only attempt to reconnect if we're not already connecting and not already 
    // connected to a different workspace
    if (this.workspaceId && 
        !this.reconnectTimeout && 
        !this.connectingPromise && 
        this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS &&
        this.socket?.readyState !== WebSocket.CONNECTING) {
      this.scheduleReconnect();
    }
    
    return false;
  }

  
  private trackOperation(operationId: string, timeout: number = OPERATION_TIMEOUT_MS): void {
    this.pendingOperations.set(operationId, Date.now());
    
    const timeoutId = setTimeout(() => {
      if (this.pendingOperations.has(operationId)) {
        this.pendingOperations.delete(operationId);
        this.operationTimeouts.delete(operationId);
        
        this.emit('operation_timeout', {
          type: 'operation_timeout',
          operation_id: operationId,
          timestamp: new Date().toISOString()
        });
      }
    }, timeout);
    
    this.operationTimeouts.set(operationId, timeoutId);
  }
  
  private completeOperation(operationId: string): void {
    if (this.pendingOperations.has(operationId)) {
      this.pendingOperations.delete(operationId);
      
      // Clear any operation timeout handler
      if (this.operationTimeouts.has(operationId)) {
        clearTimeout(this.operationTimeouts.get(operationId));
        this.operationTimeouts.delete(operationId);
      }
      
      this.emit('operation_complete', {
        type: 'operation_complete',
        operation_id: operationId,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  sendWithTracking(data: string | object, operationId: string = '', timeout: number = OPERATION_TIMEOUT_MS): boolean {
    const messageId = operationId || uuidv4();
    
    this.trackOperation(messageId, timeout);
    
    let messageToSend = data;
    if (typeof data === 'object') {
      messageToSend = { 
        ...data, 
        operation_id: messageId,
        timestamp: new Date().toISOString()
      };
    }
    
    const success = this.send(messageToSend);
    
    if (!success) {
      this.completeOperation(messageId);
    }
    
    return success;
  }
  
  clearAllPendingOperations(): void {
    this.operationTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    
    this.pendingOperations.clear();
    this.operationTimeouts.clear();
  }
  
  forceResetOperations(): void {
    const count = this.pendingOperations.size;
    this.clearAllPendingOperations();
    
    this.emit('processing_status', {
      type: 'processing_status',
      is_processing: false,
      timestamp: new Date().toISOString()
    });
  }
  
  // Message queue methods
  private enqueueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message);
  }
  
  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }
    
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    
    // Process all queued messages
    const messages = [...this.messageQueue];
    this.messageQueue = [];
    
    messages.forEach(message => {
      this.send(message);
    });
  }
  
  // Tool status management methods
  updateToolStatus(toolId: string, status: ToolStatus): void {
    this.toolStatus.set(toolId, status);
    
    // Emit tool status update event
    this.emit(WebSocketEventType.TOOL_STATUS_UPDATE, {
      type: WebSocketEventType.TOOL_STATUS_UPDATE,
      tool_id: toolId,
      tool_status: status,
      timestamp: new Date().toISOString()
    });
  }
  
  getToolStatus(toolId: string): ToolStatus | undefined {
    return this.toolStatus.get(toolId);
  }
  
  clearToolStatus(toolId: string): void {
    this.toolStatus.delete(toolId);
  }
  
  clearAllToolStatus(): void {
    this.toolStatus.clear();
  }
  
  // Request tool execution with status tracking
  sendToolRequest(toolName: string, params: any): string {
    const toolId = uuidv4();
    
    this.updateToolStatus(toolId, ToolStatus.PENDING);
    
    const message = {
      type: 'tool_request',
      tool_name: toolName,
      tool_id: toolId,
      parameters: params,
      workspace_id: this.workspaceId,
      timestamp: new Date().toISOString()
    };
    
    if (this.send(message)) {
      this.updateToolStatus(toolId, ToolStatus.RUNNING);
    }
    
    return toolId;
  }
  
  // Send tool response
  sendToolResponse(toolId: string, result: any): boolean {
    const message = {
      type: 'tool_response',
      tool_id: toolId,
      result,
      workspace_id: this.workspaceId,
      timestamp: new Date().toISOString()
    };
    
    const success = this.send(message);
    
    if (success) {
      this.updateToolStatus(toolId, ToolStatus.COMPLETED);
    }
    
    return success;
  }
  
  getQueueLength(): number {
    return this.messageQueue.length;
  }

  /**
   * Send a heartbeat message to check connection status
   */
  sendHeartbeat(): boolean {
    console.log('Sending heartbeat message to server');
    
    const heartbeatMessage = {
      type: 'heartbeat',
      workspace_id: this.workspaceId,
      timestamp: new Date().toISOString()
    };
    
    return this.send(heartbeatMessage);
  }
}

export const websocketService = new WebSocketService();
export const getSocketService = () => websocketService; 