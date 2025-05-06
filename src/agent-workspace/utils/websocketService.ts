"use client";

import { EventEmitter } from "events";
import { v4 as uuidv4 } from 'uuid';

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
  WORKSPACE_HISTORY = "workspace_history",
  AVAILABLE_TOOLS = "available_tools",
  WORKSPACE_CREATED = "workspace_created",
  MESSAGE_UPDATE = "message_update"
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
}

// Timeouts and retry settings
const CONNECTION_TIMEOUT_MS = 10000; // 10 seconds to establish connection
const OPERATION_TIMEOUT_MS = 30000;  // 30 seconds for operations to complete
const MAX_RECONNECT_ATTEMPTS = 10;   // Maximum number of reconnect attempts
const PING_INTERVAL_MS = 15000;      // 15 seconds between pings
const HEALTH_CHECK_INTERVAL_MS = 60000; // 1 minute for health checks

class WebSocketService extends EventEmitter {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private workspaceId: string | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private forcedReconnect = false;
  private connectingPromise: Promise<void> | null = null;
  private thinkingBuffers: Record<string, string> = {}; // Buffer to store thinking text by message ID
  private lastMessageReceived: number | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private pendingOperations = new Map<string, number>();
  private operationTimeouts = new Map<string, NodeJS.Timeout>();
  
  constructor() {
    super();
    // Node.js EventEmitter has a default limit of 10 listeners per event
    // Increase it to avoid memory leak warnings
    this.setMaxListeners(100);
    
    // Add a health check timer
    this.healthCheckInterval = null;
    
    // Add pending operations tracking
    this.pendingOperations = new Map();
    this.operationTimeouts = new Map();
  }
  
  connect(workspaceId: string): Promise<void> {
    // If there's already a connection attempt in progress, return that promise
    if (this.connectingPromise && this.workspaceId === workspaceId) {
      console.log(`Connection to workspace ${workspaceId} already in progress, reusing connection promise`);
      return this.connectingPromise;
    }
    
    // Check if we're already connected to the workspace - return early without creating new connection
    if (this.isConnected && this.workspaceId === workspaceId && this.socket?.readyState === WebSocket.OPEN) {
      console.log(`Already connected to workspace: ${workspaceId}`);
      return Promise.resolve();
    }
    
    // Create a new promise for this connection attempt and store it
    this.connectingPromise = new Promise<void>((resolve, reject) => {
      // Validate the workspace ID before attempting to connect
      if (!workspaceId || workspaceId === 'undefined' || workspaceId === 'null') {
        const error = {
          message: 'Invalid workspace ID provided',
          details: { workspaceId },
          timestamp: new Date().toISOString()
        };
        console.error('WebSocket connection error: Invalid workspace ID');
        
        // Reset connecting promise on failure
        this.connectingPromise = null;
        
        reject(error);
        return;
      }
      
      // Close existing connection if any
      this.disconnect(false); // Don't reset workspaceId here
      
      this.workspaceId = workspaceId; // Set the workspaceId after disconnect
      const baseWsUrl = this.getWebSocketBaseUrl();
      const url = `${baseWsUrl}/ws/workspace/${workspaceId}/`;
      
      try {
        // Add a timeout to detect connection issues
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
            console.error('WebSocket timeout:', timeoutError);
            
            // Close and nullify the socket to prevent further errors
            this.disconnect(false);
            
            // Reset connecting promise on failure
            this.connectingPromise = null;
            
            reject(timeoutError);
          }
        }, CONNECTION_TIMEOUT_MS); // Use constant for timeout
        
        // Get auth token if available
        let token = '';
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('token') || '';
          
          // For debugging - check if token exists
          console.log(`Token exists for workspace connection: ${Boolean(token)}`);
        }
        
        // Add token to URL if available
        let authUrl = url;
        
        if (token) {
          authUrl = `${url}?token=${encodeURIComponent(token)}`;
        }
        
        console.log(`Attempting to connect to WebSocket URL: ${authUrl.replace(/token=([^&]+)/, 'token=REDACTED')}`);
        
        this.socket = new WebSocket(authUrl);
        
        // Add event listeners
        this.socket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          console.log(`WebSocket connection established for workspace: ${this.workspaceId}`);
          
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          // Update the last message received time
          this.lastMessageReceived = Date.now();
          
          // Setup ping interval to keep connection alive
          this.setupPingInterval();
          
          // Setup health check
          this.setupHealthCheck();
          
          // Send an initial ping immediately to verify the connection
          this.sendPing();
          
          // Clear any reconnection attempts that might be in progress
          if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
          }
          
          // Emit connection established event
          this.emit(WebSocketEventType.CONNECTION_ESTABLISHED, {
            type: WebSocketEventType.CONNECTION_ESTABLISHED,
            workspace_id: this.workspaceId,
            timestamp: new Date().toISOString()
          });
          
          // Reset connecting promise after successful connection
          this.connectingPromise = null;
          
          // Reset the forcedReconnect flag after successful connection
          this.forcedReconnect = false;
          
          resolve();
        };
        
        this.socket.onmessage = (event) => {
          try {
            // Update last message received time
            this.lastMessageReceived = Date.now();
            
            const data: WebSocketMessage = JSON.parse(event.data);
            
            // Log important message types for debugging
            if (data.type !== 'ping' && data.type !== 'pong') {
              console.debug(`WebSocket received: ${data.type}`);
              
              // Handle backend errors better without exposing sensitive error details to the UI
              if (data.type === 'error' || (data.error && data.error.message)) {
                const errorMessage = data.error?.message || 'Unknown backend error';
                console.error('Backend error received:', errorMessage);
                
                // Sanitize error message for the UI - don't expose API key details
                if (data.error && data.error.message && 
                    (data.error.message.includes('API key') || 
                     data.error.message.includes('authentication'))) {
                  // Replace with generic message
                  data.error.message = 'Backend configuration error. Please check server logs.';
                } else if (!data.error) {
                  // Create an error object if it doesn't exist
                  data.error = { message: errorMessage };
                }
              }
              
              // Special handling for thinking updates
              if (data.type === WebSocketEventType.THINKING_UPDATE && data.thinking) {
                const messageId = data.message_id || 'unknown';
                const receivedThinking = data.thinking;
                
                // Store and process thinking updates to prevent truncation
                this.processThinkingUpdate(messageId, receivedThinking);
                
                // Modify the data with the full thinking text
                if (messageId && messageId !== 'unknown') {
                  data.thinking = this.thinkingBuffers[messageId] || receivedThinking;
                }
                
                console.debug(`Thinking update for message ${messageId}: ${receivedThinking.length} chars (total: ${data.thinking.length} chars)`);
              }
            }
            
            // Reset reconnection counter when we get a real message
            if (data.type !== 'ping' && data.type !== 'pong') {
              this.reconnectAttempts = 0;
            }
            
            // Emit the specific event type 
            this.emit(data.type, data);
            
            // Also emit a generic 'message' event for all messages
            this.emit('message', data);
          } catch (err) {
            console.error('Error parsing WebSocket message:', err, event.data);
          }
        };
        
        this.socket.onerror = (error) => {
          // Create a more detailed error object
          const detailedError = {
            message: 'WebSocket connection error',
            url: authUrl.replace(/token=([^&]+)/, 'token=REDACTED'), // Redact token in logs
            details: error,
            timestamp: new Date().toISOString()
          };
          console.error('WebSocket error:', detailedError);
          
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          // Don't immediately reject on error, as we may recover
          if (!this.isConnected) {
            // Reset connecting promise on failure
            this.connectingPromise = null;
            
            reject(detailedError);
          }
        };
        
        this.socket.onclose = (event) => {
          const wasConnected = this.isConnected;
          this.isConnected = false;
          
          // Clean up intervals
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
          }
          
          if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
          }
          
          // Detect abnormal closure codes
          const abnormalClosure = event.code !== 1000 && event.code !== 1001;
          const closureType = abnormalClosure ? 'Abnormal' : 'Normal';
          
          console.log(`${closureType} WebSocket closure. Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
          
          // Reset connecting promise on socket close
          this.connectingPromise = null;
          
          // Don't try to reconnect if this was a clean disconnect we initiated (code 1000)
          // Don't reconnect for React strict mode clean close (code 1000, 1001)
          const cleanDisconnect = event.code === 1000 || event.code === 1001;
          
          // Always attempt to reconnect on abnormal closures, respect max attempts for normal closures
          if (abnormalClosure || (wasConnected && !cleanDisconnect && this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS)) {
            // Always reset reconnect attempts for abnormal closures to ensure we keep trying
            if (abnormalClosure) {
              this.reconnectAttempts = 0;
            }
            this.scheduleReconnect();
          } else if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS && !cleanDisconnect) {
            console.error('Max reconnection attempts reached. Giving up.');
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
            
            // Clear all pending operations
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
        console.error('WebSocket creation error:', connectionError);
        
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        
        // Reset connecting promise on failure
        this.connectingPromise = null;
        
        reject(connectionError);
      }
    });
    
    // Return the promise for this connection attempt
    return this.connectingPromise;
  }
  
  disconnect(resetWorkspaceId = true): void {
    // Clean up health check
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Clear all pending operations
    this.clearAllPendingOperations();
    
    const workspaceId = this.workspaceId;
    console.log(`Disconnecting WebSocket${workspaceId ? ` for workspace: ${workspaceId}` : ''}`);
    
    // Clear the connecting promise to prevent hanging references
    this.connectingPromise = null;
    
    // Only actually close the socket if it exists and is in an open or connecting state
    if (this.socket) {
      const readyState = this.socket.readyState;
      
      // Log the socket state for debugging
      const stateMap: Record<number, string> = {
        0: 'CONNECTING',
        1: 'OPEN',
        2: 'CLOSING',
        3: 'CLOSED'
      };
      console.log(`WebSocket state before disconnect: ${stateMap[readyState] || readyState}`);
      
      if (readyState === WebSocket.OPEN || readyState === WebSocket.CONNECTING) {
        try {
          // Use a clean close with code 1000 (normal closure)
          this.socket.close(1000, 'Client initiated disconnect');
        } catch (err) {
          console.error('Error closing WebSocket:', err);
        }
      }
      
      // Nullify the socket regardless of state
      this.socket = null;
    }
    
    this.isConnected = false;
    
    // Reset workspaceId if requested (might not want to during reconnection)
    if (resetWorkspaceId && !this.forcedReconnect) {
      this.workspaceId = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
  
  isConnectedToWorkspace(workspaceId: string): boolean {
    // If workspaceId wasn't passed or is invalid, always return false
    if (!workspaceId || workspaceId === 'undefined' || workspaceId === 'null') {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`Invalid workspace ID passed to isConnectedToWorkspace: ${workspaceId}`);
      }
      return false;
    }
    
    // First do a basic check of the connection state
    const basicCheck = this.isConnected && 
                      this.socket?.readyState === WebSocket.OPEN;
    
    // Next check if we're connected to the correct workspace
    // Allow match even if this.workspaceId is null but we have an active connection
    const workspaceMatch = this.workspaceId === workspaceId;
    
    // If we're connected but workspace doesn't match, log that specific issue
    if (basicCheck && !workspaceMatch && this.workspaceId) {
      console.debug(`Connected to wrong workspace: current=${this.workspaceId}, requested=${workspaceId}`);
    }
    
    // For debugging purposes, if the check fails, log why
    if (!(basicCheck && workspaceMatch)) {
      // Only log at debug level since this method is called frequently
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        const readyStateMap: Record<number, string> = {
          0: 'CONNECTING',
          1: 'OPEN',
          2: 'CLOSING',
          3: 'CLOSED'
        };
        
        const reasons = [];
        if (!this.isConnected) reasons.push('Service not marked as connected');
        if (this.workspaceId !== workspaceId) reasons.push(`Workspace ID mismatch: current=${this.workspaceId}, requested=${workspaceId}`);
        if (!this.socket) reasons.push('Socket is null');
        else if (this.socket.readyState !== WebSocket.OPEN) {
          reasons.push(`Socket state is ${readyStateMap[this.socket.readyState] || this.socket.readyState} (not OPEN)`);
        }
        
        // Only log if we have a socket instance or reasons, otherwise it's too noisy
        if (this.socket || reasons.length > 0) {
          console.debug(`WebSocket connection check failed: ${reasons.join(', ')}`);
        }
      }
    }
    
    // Connection is valid only if we're connected AND the workspace matches
    return basicCheck && workspaceMatch;
  }
  
  // New method to clean workspace data from localStorage
  cleanWorkspace(workspaceId: string): void {
    if (!workspaceId) return;
    
    console.log(`Cleaning workspace data for: ${workspaceId}`);
    
    if (typeof window !== 'undefined') {
      // Clean workspace-specific keys
      const workspacePrefix = `workspace-${workspaceId}`;
      
      // Find and remove all localStorage items with the workspace ID
      Object.keys(localStorage).forEach(key => {
        if (key.includes(workspaceId) || key.startsWith(workspacePrefix)) {
          console.log(`Removing workspace data: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // Clean up panel sizes and visibility settings if they were for this workspace
      if (this.workspaceId === workspaceId) {
        // Reset workspace
        this.disconnect();
      }
    }
  }
  
  private sendPing(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        console.debug('Sending ping to keep connection alive');
        const pingId = `ping-${Date.now()}`;
        this.trackOperation(pingId, 10000); // 10 second timeout for ping
        
        this.socket.send(JSON.stringify({ 
          type: 'ping', 
          operation_id: pingId,
          timestamp: new Date().toISOString() 
        }));
      } catch (error) {
        console.error('Error sending ping:', error);
      }
    }
  }
  
  private setupPingInterval(): void {
    // Clear existing interval if any
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Send ping based on our constant
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, PING_INTERVAL_MS);
  }
  
  /**
   * Schedule a reconnection attempt with exponential backoff.
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Don't schedule reconnect if we're already connected
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      console.log('Already connected, skipping reconnection');
      return;
    }
    
    // Don't attempt to reconnect if no workspace ID is set
    if (!this.workspaceId) {
      console.log('No workspace ID set, not attempting to reconnect');
      return;
    }
    
    // Limit reconnect attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached.`);
      this.emit('reconnect_failed', {
        type: 'reconnect_failed',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    this.reconnectAttempts += 1;
    
    // Calculate backoff delay (exponential with jitter)
    // Base: 1 second, max: 30 seconds
    const baseSec = Math.min(Math.pow(2, this.reconnectAttempts - 1), 30);
    const jitterSec = 0.5 * Math.random();
    const delaySec = baseSec + jitterSec;
    const delayMs = Math.floor(delaySec * 1000);
    
    console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delaySec.toFixed(1)}s`);
    
    // Set flag for forced reconnect to avoid resetting workspace ID
    this.forcedReconnect = true;
    
    this.reconnectTimeout = setTimeout(async () => {
      if (this.isConnected || !this.workspaceId) {
        console.log('Connection already established or no workspace ID, skipping reconnect');
        return;
      }
      
      console.log(`Attempting reconnect #${this.reconnectAttempts} to workspace ${this.workspaceId}`);
      
      try {
        await this.connect(this.workspaceId);
        console.log('Reconnect successful');
        this.reconnectAttempts = 0;
      } catch (error) {
        console.error('Error during reconnect:', error);
        // Schedule next attempt
        this.scheduleReconnect();
      }
    }, delayMs);
  }
  
  private getWebSocketBaseUrl(): string {
    if (typeof window === 'undefined') {
      return '';
    }
    
    // For development, you might want to use a specific URL
    if (process.env.NODE_ENV === 'development') {
      return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
    }
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
    
    return `${protocol}//${host}`;
  }
  
  // Add a send method to send messages through the socket
  send(data: string | Object): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket not connected');
      
      // Attempt to reconnect automatically if we have a workspace ID
      if (this.workspaceId && !this.reconnectTimeout && this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log('Attempting to reconnect before sending message...');
        this.scheduleReconnect();
      }
      
      return false;
    }
    
    try {
      const messageToSend = typeof data === 'string' ? data : JSON.stringify(data);
      this.socket.send(messageToSend);
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  }
  
  // Process thinking updates to prevent truncation
  private processThinkingUpdate(messageId: string, thinkingChunk: string): void {
    // Initialize if this is the first update for this message
    if (!this.thinkingBuffers[messageId]) {
      this.thinkingBuffers[messageId] = '';
    }
    
    // Append the chunk to the thinking buffer
    this.thinkingBuffers[messageId] += thinkingChunk;
    
    // Prevent buffers from growing too large by implementing a size limit
    const MAX_THINKING_BUFFER_SIZE = 100000; // 100KB max
    if (this.thinkingBuffers[messageId].length > MAX_THINKING_BUFFER_SIZE) {
      // Keep the last half of the buffer
      const halfSize = MAX_THINKING_BUFFER_SIZE / 2;
      this.thinkingBuffers[messageId] = this.thinkingBuffers[messageId].substring(
        this.thinkingBuffers[messageId].length - halfSize
      );
      console.warn(`Thinking buffer for message ${messageId} exceeded size limit. Truncating.`);
    }
  }
  
  // Clear thinking buffer for a specific message
  clearThinkingBuffer(messageId: string): void {
    if (messageId && this.thinkingBuffers[messageId]) {
      delete this.thinkingBuffers[messageId];
    }
  }
  
  // Clear all thinking buffers
  clearAllThinkingBuffers(): void {
    this.thinkingBuffers = {};
  }
  
  /**
   * Set up a periodic health check interval.
   */
  private setupHealthCheck(): void {
    // Clear any existing health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Set up a new health check interval
    this.healthCheckInterval = setInterval(() => {
      this.checkConnectionHealth();
      
      // Also check pending operations
      this.checkPendingOperations();
    }, HEALTH_CHECK_INTERVAL_MS);
  }
  
  /**
   * Check the health of the WebSocket connection.
   * 
   * This inspects the connection state and last message received time to determine if
   * the connection is still healthy or if a reconnect is needed.
   */
  private checkConnectionHealth(): void {
    // If we're not connected yet or no workspaceId, nothing to do
    if (!this.workspaceId || !this.isConnected) {
      return;
    }
    
    // If we received a message within the last minute, connection is healthy
    if (this.lastMessageReceived && (Date.now() - this.lastMessageReceived) < 60000) {
      // Connection is healthy - reset reconnect attempts
      this.reconnectAttempts = 0;
      return;
    }
    
    // If socket exists but not in OPEN state, might need reconnect
    if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
      console.warn(`WebSocket not open (state: ${this.socket.readyState}), reconnecting...`);
      this.disconnect(false);
      this.scheduleReconnect();
      return;
    }
    
    // If no message received recently, but socket is still open, send a ping to check
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.debug('No messages received recently, sending ping to check connection');
      this.sendPing();
    }
  }
  
  // Add operation tracking methods
  private trackOperation(operationId: string, timeout: number = OPERATION_TIMEOUT_MS): void {
    this.pendingOperations.set(operationId, Date.now());
    
    // Set a timeout to automatically clean up if the operation doesn't complete
    const timeoutId = setTimeout(() => {
      if (this.pendingOperations.has(operationId)) {
        console.warn(`Operation ${operationId} timed out after ${timeout}ms`);
        this.pendingOperations.delete(operationId);
        this.operationTimeouts.delete(operationId);
        
        // Skip emitting timeout events for ping operations
        if (!operationId.startsWith('ping-')) {
          // Emit a timeout event
          this.emit('operation_timeout', {
            type: 'operation_timeout',
            operation_id: operationId,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log(`Ping operation ${operationId} timed out - ignoring`);
        }
      }
    }, timeout);
    
    this.operationTimeouts.set(operationId, timeoutId);
  }
  
  private completeOperation(operationId: string): void {
    if (this.pendingOperations.has(operationId)) {
      this.pendingOperations.delete(operationId);
      
      // Clear the timeout
      const timeoutId = this.operationTimeouts.get(operationId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.operationTimeouts.delete(operationId);
      }
    }
  }
  
  private checkPendingOperations(): void {
    // Check for operations that have been pending too long
    const now = Date.now();
    
    this.pendingOperations.forEach((startTime, operationId) => {
      const duration = now - startTime;
      if (duration > OPERATION_TIMEOUT_MS) {
        console.warn(`Operation ${operationId} has been pending for ${duration}ms, considering it timed out`);
        this.completeOperation(operationId);
        
        // Skip emitting timeout events for ping operations
        if (!operationId.startsWith('ping-')) {
          // Emit a timeout event
          this.emit('operation_timeout', {
            type: 'operation_timeout',
            operation_id: operationId,
            timestamp: new Date().toISOString()
          });
        } else {
          console.log(`Ping operation ${operationId} timed out during health check - ignoring`);
        }
      }
    });
  }
  
  // Add method to send a message with operation tracking and timeout
  sendWithTracking(data: string | Object, operationId: string = '', timeout: number = OPERATION_TIMEOUT_MS): boolean {
    const messageId = operationId || uuidv4();
    
    // Track the operation
    this.trackOperation(messageId, timeout);
    
    // Add the operation ID to the message if it's an object
    let messageToSend = data;
    if (typeof data === 'object') {
      messageToSend = { 
        ...data, 
        operation_id: messageId,
        timestamp: new Date().toISOString()
      };
    }
    
    // Send the message
    const success = this.send(messageToSend);
    
    // If sending failed, clean up the operation tracking
    if (!success) {
      this.completeOperation(messageId);
    }
    
    return success;
  }
  
  // Helper to clear all pending operations
  clearAllPendingOperations(): void {
    // Clear all timeout handles
    this.operationTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    
    // Clear the maps
    this.pendingOperations.clear();
    this.operationTimeouts.clear();
    
    console.log("All pending operations cleared");
  }
  
  // Public method to manually force clear any stuck operations
  forceResetOperations(): void {
    const count = this.pendingOperations.size;
    this.clearAllPendingOperations();
    
    if (count > 0) {
      console.log(`Manually cleared ${count} stuck operations`);
    }
    
    // Reset processing state by emitting a custom event
    this.emit('processing_status', {
      type: 'processing_status',
      is_processing: false,
      timestamp: new Date().toISOString()
    });
  }
}

export const websocketService = new WebSocketService();
export const getSocketService = () => websocketService; 