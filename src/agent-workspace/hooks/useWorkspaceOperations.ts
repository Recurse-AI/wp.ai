import { useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAgentAPI } from './useAgentAPI';
import { useRouter } from 'next/navigation';
import { websocketService } from '../utils/websocketService';
import { useTheme } from '@/context/ThemeProvider';

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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { createWorkspace } = useAgentAPI();
  
  // Ref to track operation start time for timeout detection
  const operationStartTimeRef = useRef<number>(0);
  
  // Function to manually reset processing state
  const resetProcessingState = useCallback(() => {
    console.log("Manually resetting processing state");
    
    // Reset the operation start time
    operationStartTimeRef.current = 0;
    
    // Ask the WebSocket service to clear any stuck operations
    websocketService.forceResetOperations();
    
    // Show confirmation toast
    toast.success("Processing state reset successfully", {
      duration: 3000,
      style: {
        background: isDark ? '#333' : '#fff',
        color: isDark ? '#fff' : '#333',
      }
    });
  }, [isDark]);
  
  const handleSaveWorkspace = useCallback(async () => {
    // Workspace is automatically saved
    toast.success("Workspace is automatically saved", {
      style: {
        background: isDark ? '#333' : '#fff',
        color: isDark ? '#fff' : '#333',
      }
    });
  }, [isDark]);
  
  // Handler for first prompt from landing page
  const handleFirstPrompt = useCallback(async (prompt: string) => {
    if (!sendMessage || !reconnect) {
      console.error("Required functions not provided to useWorkspaceOperations");
      toast.error("Cannot process request: missing required functions");
      return;
    }
    
    try {
      // Check if the backend server is available
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || window.location.origin;
      console.log(`Checking backend server at: ${baseUrl}`);
      
      // First create a new workspace to get a server-generated ID
      console.log("Attempting to create a new workspace...");
      const newWorkspaceId = await createWorkspace("New Workspace");
      
      // Validate the workspace ID
      if (!newWorkspaceId) {
        console.error("No workspace ID returned from createWorkspace function");
        toast.error("Failed to create workspace: No workspace ID returned");
        throw new Error("Failed to create workspace: Server did not return a workspace ID");
      }
      
      if (typeof newWorkspaceId !== 'string' || newWorkspaceId.trim() === '') {
        console.error(`Invalid workspace ID returned: "${newWorkspaceId}"`);
        toast.error("Failed to create workspace: Invalid workspace ID");
        throw new Error(`Failed to create workspace: Invalid workspace ID "${newWorkspaceId}"`);
      }
      
      console.log(`Created new workspace with ID: ${newWorkspaceId}`);
      
      // Set active workspace in local storage immediately
      localStorage.setItem('wp-agent-active-workspace', newWorkspaceId);
      
      // Update URL with the correct server-generated ID
      console.log(`Updating URL to: /agent-workspace/${newWorkspaceId}`);
      router.replace(`/agent-workspace/${newWorkspaceId}`);
      
      // Give the system more time to process the workspace creation
      // before trying to send a message - increased timeout for more reliable connection
      console.log("Waiting for workspace connection to stabilize before sending message...");
      setTimeout(async () => {
        try {
          // Verify connection is established
          const isConnected = websocketService.isConnectedToWorkspace(newWorkspaceId);
          console.log(`Connection status before sending message: ${isConnected ? 'Connected' : 'Not connected'}`);
          
          if (!isConnected) {
            console.log("Attempting to reconnect before sending message...");
            try {
              await reconnect();
              console.log("Reconnection successful");
            } catch (connErr) {
              console.error("Reconnection failed:", connErr);
              // Continue anyway - the message system will retry
            }
          }
          
          // Now send the message to the newly created workspace
          console.log(`Sending initial message to workspace ${newWorkspaceId}: "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}"`);
          await sendMessage(prompt);
        } catch (err) {
          console.error("Error sending initial message:", err);
          toast.error("Failed to send initial message. Please try again.");
        }
      }, 2000); // Increased from 1000ms to 2000ms for reliability
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("Error handling first prompt:", error);
      
      // Provide a more user-friendly error message based on the type of error
      if (errorMsg.includes("network") || errorMsg.includes("fetch") || errorMsg.includes("connect")) {
        toast.error("Failed to connect to server. Please check if the backend is running and try again.");
      } else if (errorMsg.includes("workspace")) {
        toast.error("Failed to create workspace. Please try again.");
      } else {
        toast.error("Failed to process your request. Please try again.");
      }
    }
  }, [sendMessage, createWorkspace, router, reconnect]);
  
  return {
    handleSaveWorkspace,
    resetProcessingState,
    handleFirstPrompt,
    operationStartTimeRef
  };
} 