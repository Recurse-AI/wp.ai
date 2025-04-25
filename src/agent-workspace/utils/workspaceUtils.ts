import { websocketService } from './websocketService';

/**
 * Utility functions for workspace management
 */

/**
 * Clean up all data associated with a workspace
 * 
 * @param workspaceId - The ID of the workspace to clean
 */
export const cleanWorkspace = (workspaceId: string): void => {
  if (!workspaceId) return;
  
  console.log(`Cleaning workspace: ${workspaceId}`);
  
  // Clean WebSocket connections and data
  websocketService.cleanWorkspace(workspaceId);
  
  // Remove any additional workspace-related localStorage items
  if (typeof window !== 'undefined') {
    try {
      console.log(`Starting thorough localStorage cleanup for workspace: ${workspaceId}`);
      
      // First pass: Clear all items related to this specific workspace ID
      Object.keys(localStorage).forEach(key => {
        // Handle workspace ID directly included in key
        if (key.includes(workspaceId)) {
          console.log(`Removing workspace item by ID match: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // Second pass: Handle workspace- prefix items
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('workspace-')) {
          console.log(`Removing workspace prefixed item: ${key}`);
          localStorage.removeItem(key);
        }
      });
      
      // Panel sizes and visibility for this workspace
      const workspaceRelatedKeys = [
        'wp-agent-chat-size',
        'wp-agent-explorer-size',
        'wp-agent-editor-size',
        'wp-agent-preview-size',
        'wp-agent-terminal-size',
        'wp-agent-explorer-visible',
        'wp-agent-preview-visible',
        'wp-agent-terminal-visible',
        'wp-agent-latest-workspace', // Add this key to ensure we clean it
        'wp-agent-workspace-state',  // Add this key for workspace state
        'wp-agent-active-workspace'  // Add this key for active workspace
      ];
      
      // Clean up workspace-specific items
      workspaceRelatedKeys.forEach(key => {
        console.log(`Removing workspace related item: ${key}`);
        localStorage.removeItem(key);
      });
      
      console.log(`Completed localStorage cleanup for workspace: ${workspaceId}`);
    } catch (error) {
      console.error('Error during workspace cleanup:', error);
    }
  }
};

/**
 * Clean up a specific workspace by ID
 * 
 * @param workspaceId - The UUID of the workspace to clean
 */
export const cleanSpecificWorkspace = (workspaceId: string): void => {
  if (!workspaceId) return;
  
  cleanWorkspace(workspaceId);
};

/**
 * Clean all workspaces from localStorage
 */
export const cleanAllWorkspaces = (): void => {
  if (typeof window === 'undefined') return;
  
  console.log('Cleaning all workspaces from localStorage');
  
  try {
    // Find and remove all workspace-related keys with multiple patterns
    Object.keys(localStorage).forEach(key => {
      // Check multiple patterns for workspace-related items
      if (
        key.startsWith('workspace-') || 
        key.includes('workspace') || 
        key.includes('wp-agent') ||
        key.startsWith('agent-') ||
        key.includes('-workspace-')
      ) {
        console.log(`Removing workspace item: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Explicitly clean panel settings that might be workspace related
    const panelKeys = [
      'wp-agent-chat-size',
      'wp-agent-explorer-size',
      'wp-agent-editor-size',
      'wp-agent-preview-size',
      'wp-agent-terminal-size',
      'wp-agent-explorer-visible',
      'wp-agent-preview-visible',
      'wp-agent-terminal-visible',
      'wp-agent-latest-workspace',
      'wp-agent-workspace-state',
      'wp-agent-active-workspace',
      'wp-agent-workspace-history'
    ];
    
    panelKeys.forEach(key => {
      console.log(`Removing panel setting: ${key}`);
      localStorage.removeItem(key);
    });
    
    // Also clear any websocket connections
    websocketService.disconnect();
    
    console.log('All workspace data cleaned from localStorage');
  } catch (error) {
    console.error('Error during workspace cleanup:', error);
  }
};

/**
 * Clean the specific workspace mentioned in the request
 * This can be called directly from the browser console
 */
export const cleanTargetWorkspace = (): void => {
  const targetWorkspaceId = 'cf1a86e2-faa3-4360-a411-fd996ab37fdf';
  console.log(`Starting cleanup for workspace: ${targetWorkspaceId}`);
  
  // In addition to regular cleanup, also clear any "workspace-" prefixed items
  if (typeof window !== 'undefined') {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('workspace-')) {
        console.log(`Removing workspace prefixed item: ${key}`);
        localStorage.removeItem(key);
      }
    });
  }
  
  cleanWorkspace(targetWorkspaceId);
  console.log(`Workspace ${targetWorkspaceId} has been cleaned successfully!`);
};

/**
 * Complete reset of all workspace data
 * This performs a more thorough cleanup than other methods
 */
export const totalWorkspaceReset = (): void => {
  if (typeof window === 'undefined') return;
  
  console.log('Performing TOTAL workspace reset - clearing ALL workspace data');
  
  try {
    // First disconnect any active websocket connections
    websocketService.disconnect();
    
    // Clear ALL localStorage items to ensure complete reset
    // This is the most aggressive approach but ensures everything is cleared
    Object.keys(localStorage).forEach(key => {
      // Only preserve essential non-workspace items if needed
      if (!key.startsWith('user-preference-') && !key.startsWith('auth-')) {
        console.log(`Removing item: ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    // Reload the page to ensure all state is reset
    console.log('Total workspace reset complete. Page will refresh.');
    window.location.reload();
  } catch (error) {
    console.error('Error during total workspace reset:', error);
  }
};

// Expose the functions to the window object for direct console access
if (typeof window !== 'undefined') {
  // Add to window object
  (window as any).cleanWorkspace = cleanWorkspace;
  (window as any).cleanSpecificWorkspace = cleanSpecificWorkspace;
  (window as any).cleanAllWorkspaces = cleanAllWorkspaces;
  (window as any).cleanTargetWorkspace = cleanTargetWorkspace;
  (window as any).totalWorkspaceReset = totalWorkspaceReset;
  
  // Add a separate function specifically for clearing workspace- prefix
  (window as any).clearWorkspacePrefixItems = () => {
    console.log('Clearing all items with workspace- prefix');
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('workspace-')) {
        console.log(`Removing: ${key}`);
        localStorage.removeItem(key);
      }
    });
    console.log('Completed clearing workspace-prefixed items');
  };
  
  console.log('Workspace cleanup functions exposed to window. Use one of these functions:');
  console.log('- window.cleanTargetWorkspace() - Clean the target workspace');
  console.log('- window.cleanAllWorkspaces() - Clean all workspaces');
  console.log('- window.clearWorkspacePrefixItems() - Clear items with workspace- prefix');
  console.log('- window.totalWorkspaceReset() - TOTAL reset of ALL workspace data');
} 