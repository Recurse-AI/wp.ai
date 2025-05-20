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
  AGENT_RESPONSE = "agent_response",
  TOOL_RESULT = "tool_result",
  TOOL_STATUS_UPDATE = "tool_status_update",
  STREAM_COMPLETE = "stream_complete",
  
  // Anthropic specific events
  BLOCK_START = "block_start",
  BLOCK_STOP = "block_stop",
  THINKING = "thinking",
  TEXT = "text",
  COMPLETE = "complete",
  
  // Backend status events
  MESSAGE_STATUS = "message_status",
  NEW_MESSAGE = "new_message",
  ERROR = "error",
  
  // Tool related events
  TOOL_CALL = "tool_call",
  TOOL_COMPLETE = "tool_complete",
  TOOL_ERROR = "tool_error",
  
  // Additional events used in the codebase
  ERROR_UPDATE = "error_update",
  ASSISTANT_RESPONSE = "assistant_response",
  MESSAGE_UPDATE = "message_update",
  USER_MESSAGE = "user_message",
  FILE_UPDATE = "file_update"
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
  message_id?: string;
  thinking?: string;
  text?: string;
  error?: {
    message: string;
    details?: any;
  };
  tool_name?: string;
  tool_id?: string;
  tool_status?: ToolStatus;
  result?: any;
  query?: string;
  response?: string;
  content?: string;
  content_type?: string;
  sender?: string;
  is_processing?: boolean;
  timestamp?: string;
  operation_id?: string;
}

// Constants
const CONNECTION_TIMEOUT_MS = 10000; // 10 seconds connection timeout
const OPERATION_TIMEOUT_MS = 300000; // 5 minutes operation timeout (matching backend)
const MAX_RECONNECT_ATTEMPTS = 10; // More reconnection attempts for better resilience

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
      // We're already connected, update connection status to be sure
      this.connectionStatus = 'connected';
      this.emit('connection_status_change', { status: this.connectionStatus });
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
        this.connectionStatus = 'error';
        this.emit('connection_status_change', { status: this.connectionStatus });
        this.connectingPromise = null;
        reject(error);
        return;
      }
      
      // Disconnect previous connection, but preserve workspaceId
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
            this.connectionStatus = 'error';
            this.emit('connection_status_change', { status: this.connectionStatus });
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
        
        // Create new websocket connection
        this.socket = new WebSocket(authUrl);
        
        // Setup connection event handlers
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
          
          // Send an immediate heartbeat to verify connection
          this.sendHeartbeat();
          
          resolve();
        };
        
        // Setup error handler
        this.socket.onerror = (event) => {
          console.error(`WebSocket error for workspace ${workspaceId}:`, event);
          this.connectionStatus = 'error';
          this.emit('connection_status_change', { status: this.connectionStatus });
          
          // Only reject if we're still connecting
          if (this.connectingPromise) {
            this.connectingPromise = null;
            reject(new Error('WebSocket connection error'));
          }
        };
        
        // Setup close handler
        this.socket.onclose = (event) => {
          console.log(`WebSocket closed for workspace ${workspaceId}:`, event);
          this.isConnected = false;
          this.connectionStatus = 'disconnected';
          this.emit('connection_status_change', { status: this.connectionStatus });
          
          // Only reject if we're still connecting
          if (this.connectingPromise) {
            this.connectingPromise = null;
            reject(new Error('WebSocket connection closed'));
          }
          
          // Schedule reconnect if not deliberately closed
          if (!event.wasClean) {
            this.scheduleReconnect();
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
    return (
      this.isConnected && 
      this.workspaceId === workspaceId && 
      this.socket?.readyState === WebSocket.OPEN &&
      this.connectionStatus === 'connected'
    );
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
      
      // If we've hit the maximum number of reconnect attempts, clear processing state
      this.forceResetOperations();
      
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
        
        // After repeated connection failures, reset operations
        if (this.reconnectAttempts > 3) {
          this.forceResetOperations();
        }
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
    
    // Reset processing state and notify clients
    this.emit('processing_status', {
      type: 'processing_status',
      is_processing: false,
      timestamp: new Date().toISOString()
    });
    
    // Also send an error notification for better user feedback
    this.emit('error', {
      type: 'error',
      message: 'Connection lost or timeout occurred. Processing has been reset.',
      timestamp: new Date().toISOString()
    });
    
    // Send a message status update to reset UI state
    if (this.workspaceId) {
      this.emit('message_status', {
        type: 'message_status',
        workspace_id: this.workspaceId,
        status: 'complete', // Mark as complete to reset UI state
        message: 'Connection timeout, processing stopped',
        timestamp: new Date().toISOString()
      });
    }
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
    if (!this.isConnected || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      // Connection is not open, update status appropriately
      this.connectionStatus = 'disconnected';
      this.emit('connection_status_change', { status: this.connectionStatus });
      return false;
    }
    
    // Send a heartbeat message to verify connection
    const heartbeatMessage = {
      type: 'heartbeat',
      workspace_id: this.workspaceId,
      timestamp: new Date().toISOString()
    };
    
    try {
      this.socket.send(JSON.stringify(heartbeatMessage));
      
      // Update connection status to connected
      if (this.connectionStatus !== 'connected') {
        this.connectionStatus = 'connected';
        this.emit('connection_status_change', { status: this.connectionStatus });
      }
      
      return true;
    } catch (error) {
      console.error('Error sending heartbeat:', error);
      
      // Failed to send heartbeat, update connection status
      this.connectionStatus = 'error';
      this.emit('connection_status_change', { status: this.connectionStatus });
      
      // Try to reconnect
      this.scheduleReconnect();
      return false;
    }
  }
}

export const websocketService = new WebSocketService();
export const getSocketService = () => websocketService; 