"use client";

import { EventEmitter } from "events";

export enum WebSocketEventType {
  CONNECTION_ESTABLISHED = "connection_established",
  PROCESSING_STATUS = "processing_status",
  THINKING_UPDATE = "thinking_update",
  TEXT_UPDATE = "text_update",
  AI_ERROR = "ai_error",
  FILE_UPDATE = "file_update", 
  FILE_EDIT_NOTIFICATION = "file_edit_notification",
  USER_ACTIVITY_NOTIFICATION = "user_activity_notification"
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
}

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
  
  constructor() {
    super();
    // Node.js EventEmitter has a default limit of 10 listeners per event
    // Increase it to avoid memory leak warnings
    this.setMaxListeners(50);
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
      
      this.workspaceId = workspaceId;
      const baseWsUrl = this.getWebSocketBaseUrl();
      const url = `${baseWsUrl}/ws/workspace/${workspaceId}/`;
      
      // Close existing connection if any
      this.disconnect();
      
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
            this.disconnect();
            
            // Reset connecting promise on failure
            this.connectingPromise = null;
            
            reject(timeoutError);
          }
        }, 15000); // Increase timeout to 15 seconds
        
        // Get auth token if available
        let token = '';
        if (typeof window !== 'undefined') {
          token = localStorage.getItem('token') || '';
          
          // For debugging - check if token exists
          console.log(`Token exists for workspace connection: ${Boolean(token)}`);
        }
        
        // Add token to URL if available
        const authUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;
        
        console.log(`Attempting to connect to WebSocket URL: ${authUrl.replace(/token=([^&]+)/, 'token=REDACTED')}`);
        
        this.socket = new WebSocket(authUrl);
        
        // Add event listeners
        this.socket.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Make sure workspaceId is set correctly
          if (!this.workspaceId && workspaceId) {
            this.workspaceId = workspaceId;
          }
          
          console.log(`WebSocket connection established for workspace: ${this.workspaceId}`);
          
          if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = null;
          }
          
          // Setup ping interval to keep connection alive
          this.setupPingInterval();
          
          // Send an initial ping immediately to verify the connection
          this.sendPing();
          
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
            const data: WebSocketMessage = JSON.parse(event.data);
            
            // Log important message types for debugging
            if (data.type !== 'ping' && data.type !== 'pong') {
              console.debug(`WebSocket received: ${data.type}`);
            }
            
            // Reset reconnection counter when we get a real message
            if (data.type !== 'ping' && data.type !== 'pong') {
              this.reconnectAttempts = 0;
            }
            
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
          
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
          }
          
          console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
          
          // Reset connecting promise on socket close
          this.connectingPromise = null;
          
          // Don't try to reconnect if this was a clean disconnect we initiated (code 1000)
          // Don't reconnect for React strict mode clean close (code 1000, 1001)
          if (wasConnected && event.code !== 1000 && event.code !== 1001 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
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
  
  disconnect(): void {
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
    // Only reset workspaceId if this is a true cleanup, not when reconnecting
    // to the same workspace
    if (!this.forcedReconnect) {
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
        this.socket.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
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
    
    // Send ping more frequently (every 15 seconds) to keep connection alive
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 15000); // Reduced from 30s to 15s
  }
  
  private scheduleReconnect(): void {
    // Use a shorter initial delay and gentler backoff
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    // Store the current workspaceId for reconnection
    const reconnectWorkspaceId = this.workspaceId;
    
    if (!reconnectWorkspaceId) {
      console.error('Cannot reconnect: No workspace ID available');
      return;
    }
    
    console.log(`Scheduling reconnect attempt to workspace ${reconnectWorkspaceId} in ${delay}ms`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect to workspace ${reconnectWorkspaceId} (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      // Set the forcedReconnect flag to prevent workspaceId from being cleared
      this.forcedReconnect = true;
      
      this.connect(reconnectWorkspaceId).catch(error => {
        console.error(`Reconnection to workspace ${reconnectWorkspaceId} failed:`, error);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        } else {
          console.error('Max reconnection attempts reached. Giving up.');
          this.emit('reconnect_failed', {
            type: 'reconnect_failed',
            timestamp: new Date().toISOString(),
            details: {
              attempts: this.reconnectAttempts,
              workspace_id: reconnectWorkspaceId,
              error
            }
          });
        }
      });
    }, delay);
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
}

export const websocketService = new WebSocketService(); 