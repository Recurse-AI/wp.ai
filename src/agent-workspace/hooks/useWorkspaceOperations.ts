import { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { websocketService } from '../utils/websocketService';

interface WorkspaceOperationsHook {
  handleSaveWorkspace: () => Promise<void>;
  resetProcessingState: () => void;
  handleFirstPrompt: (prompt: string) => Promise<void>;
  operationStartTimeRef: React.RefObject<number>;
}

export function useWorkspaceOperations(
  sendMessage?: (message: string) => Promise<boolean>,
  reconnect?: () => Promise<boolean>
): WorkspaceOperationsHook {
  const router = useRouter();
  
  // Ref to track operation start time for timeout detection
  const operationStartTimeRef = useRef<number>(0);
  
  // Function to manually reset processing state
  const resetProcessingState = useCallback(() => {
    console.log("Manually resetting processing state");
    
    // Reset the operation start time
    operationStartTimeRef.current = 0;
    
    // Ask the WebSocket service to clear any stuck operations
    websocketService.forceResetOperations();
  
  }, []);
  
  const handleSaveWorkspace = useCallback(async () => {
  }, []);
  
  // Handler for first prompt from landing page
  const handleFirstPrompt = useCallback(async (prompt: string) => {
    if (!sendMessage) {
      console.error("Required functions not provided to useWorkspaceOperations");
      return;
    }
    
    try {
      const workspace = await websocketService.createWorkspaceWithId("New WordPress Project");
      const newWorkspaceId = workspace.id;
      
      // Validate the workspace ID
      if (!newWorkspaceId) {
        console.error("No workspace ID returned from createWorkspaceWithId function");
        throw new Error("Failed to create workspace: Server did not return a workspace ID");
      }
      
      if (typeof newWorkspaceId !== 'string' || newWorkspaceId.trim() === '') {
        console.error(`Invalid workspace ID returned: "${newWorkspaceId}"`);
        throw new Error(`Failed to create workspace: Invalid workspace ID "${newWorkspaceId}"`);
      }
      
      console.log(`Created new workspace with ID: ${newWorkspaceId}`);
      
      // Set active workspace in local storage immediately
      localStorage.setItem('wp-agent-active-workspace', newWorkspaceId);
      
      // Update URL with the client-generated ID
      console.log(`Updating URL to: /agent-workspace/${newWorkspaceId}`);
      router.replace(`/agent-workspace/${newWorkspaceId}`);
      
      // Give the system more time to process the workspace creation
      // before trying to send a message - increased timeout for more reliable connection
      console.log("Waiting for workspace connection to stabilize before sending message...");
      
      // Try to ensure connection is established with retries
      let retryCount = 0;
      let isConnected = false;
      const maxRetries = 5;
      
      // Create a promise that resolves when connection is established or max retries reached
      await new Promise<void>((resolve) => {
        const checkConnection = async () => {
          isConnected = websocketService.isConnectedToWorkspace(newWorkspaceId);
          console.log(`Connection check ${retryCount + 1}/${maxRetries}: ${isConnected ? 'Connected' : 'Not connected'}`);
          
          if (isConnected) {
            resolve();
            return;
          }
          
          if (retryCount >= maxRetries) {
            console.warn(`Max connection check retries (${maxRetries}) reached. Proceeding anyway.`);
            resolve();
            return;
          }
          
          retryCount++;
          
          // Try to reconnect if not already connected
          try {
            await websocketService.connect(newWorkspaceId);
          } catch (err) {
            console.warn(`Connection attempt ${retryCount} failed:`, err);
          }
          
          // Schedule next check
          setTimeout(checkConnection, 1000);
        };
        
        // Start checking
        setTimeout(checkConnection, 2000);
      });
      
      // Final connection status before sending message
      console.log(`Connection status before sending message: ${isConnected ? 'Connected' : 'Not connected'}`);
      
      // If still not connected after retries, try explicit reconnect
      if (!isConnected && reconnect) {
        console.log("Attempting final reconnect before sending message...");
        try {
          await reconnect();
          isConnected = websocketService.isConnectedToWorkspace(newWorkspaceId);
          console.log(`After reconnect, connection status: ${isConnected ? 'Connected' : 'Not connected'}`);
        } catch (connErr) {
          console.error("Final reconnection failed:", connErr);
        }
      }
      
      // Wait for URL update to complete and workspace component to initialize
      // This gives the new AgentWorkspace component time to mount with the workspaceId
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a special wrapped sendMessage that uses the new workspace ID directly
      const sendMessageWithWorkspaceId = async (messageText: string): Promise<boolean> => {
        console.log(`Sending message with explicit workspace ID ${newWorkspaceId}`);
        
        // Ensure connection to correct workspace
        if (!websocketService.isConnectedToWorkspace(newWorkspaceId)) {
          try {
            await websocketService.connect(newWorkspaceId);
          } catch (error) {
            console.error("Error connecting to workspace before sending message:", error);
            return false;
          }
        }
        
        // Send the message directly via websocketService
        return websocketService.send({
          type: 'user_message',
          workspace_id: newWorkspaceId,
          message: messageText,
          timestamp: new Date().toISOString()
        });
      };
      
      // Now send the message to the newly created workspace
      try {
        console.log(`Sending initial message to workspace ${newWorkspaceId}: "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"`);
        
        // Try the provided sendMessage function first
        if (sendMessage) {
          const sent = await sendMessage(prompt);
          if (!sent) {
            // If that fails, use our wrapped function with explicit workspace ID
            await sendMessageWithWorkspaceId(prompt);
          }
        } else {
          // If no sendMessage provided, use our wrapped function
          await sendMessageWithWorkspaceId(prompt);
        }
      } catch (err) {
        console.error("Error sending initial message:", err);
        
        // If message sending fails, try one more time after a short delay with direct method
        setTimeout(async () => {
          try {
            console.log("Retrying initial message send with direct method...");
            await sendMessageWithWorkspaceId(prompt);
          } catch (retryErr) {
            console.error("Retry failed for initial message:", retryErr);
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Error handling first prompt:", error);
    }
  }, [sendMessage, router, reconnect]);
  
  return {
    handleSaveWorkspace,
    resetProcessingState,
    handleFirstPrompt,
    operationStartTimeRef
  };
} 