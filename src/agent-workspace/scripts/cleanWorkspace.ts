"use client";

/**
 * This script cleans up a specific workspace
 * It can be run in the browser console or imported and executed
 */

// Function to clean up workspace data from localStorage
const cleanWorkspaceData = (workspaceId: string): void => {
  if (!workspaceId) return;
  
  console.log(`Cleaning workspace data for: ${workspaceId}`);
  
  if (typeof window !== 'undefined') {
    // Find and remove all localStorage items with the workspace ID
    Object.keys(localStorage).forEach(key => {
      if (key.includes(workspaceId) || key.startsWith(`workspace-${workspaceId}`)) {
        console.log(`Removing workspace data: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Clean up any WebSocket connections
    const websocketKeys = ['websocket_', 'ws_connection_', 'socket_'];
    websocketKeys.forEach(prefix => {
      const key = `${prefix}${workspaceId}`;
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });
    
    // Clean up panel sizes and visibility settings
    const panelKeys = [
      'wp-agent-chat-size',
      'wp-agent-explorer-size',
      'wp-agent-editor-size',
      'wp-agent-preview-size',
      'wp-agent-terminal-size',
      'wp-agent-explorer-visible',
      'wp-agent-preview-visible',
      'wp-agent-terminal-visible'
    ];
    
    panelKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  }
};

