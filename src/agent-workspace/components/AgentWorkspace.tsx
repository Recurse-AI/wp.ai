/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {  PanelLayout, FileNode } from '../types';
import AgentToolbar from './toolbar/AgentToolbar';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeProvider';
import AgentChat from './panels/AgentChat';
import AgentLanding from './landing/AgentLanding';
import AgentHistoryModal from './modals/AgentHistoryModal';
import { saveFilesToLocalStorage } from '../utils/fileUtils';
import FileOperationsProvider from '../context/FileOperationsContext';
import { FileOperationsTracker } from './trackers';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useWorkspaceOperations } from '../hooks/useWorkspaceOperations';
import WorkspaceLayout from './layout/WorkspaceLayout';
import { ChatPanel } from './layout/ResizablePanels';
import WorkspaceStyles from './layout/WorkspaceStyles';
import { getSocketService, WebSocketEventType } from '../utils/websocketService';
import { useWorkspaceHistory } from '../hooks/useWorkspaceHistory';
import { v4 as uuidv4 } from 'uuid';
import WorkspaceStateProvider from '../context/WorkspaceStateManager';

interface AgentWorkspaceProps {
  preloadedService: string;
  workspaceId: string;
  preloadedHistory?: any;
}

// Define proper types for messages and session state
interface Message {
  id?: string;
  role: string;
  content: string;
  timestamp: string;
}

interface SessionState {
  messages: Message[];
  files: Record<string, FileNode>;
  activeFile: FileNode | null;
  isProcessing: boolean;
}

const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  preloadedService,
  workspaceId = '',
  preloadedHistory
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [workspaceName, setWorkspaceName] = useState('My WordPress Project');
  const socketService = getSocketService();
  const [sessionState, setSessionState] = useState<SessionState>({
    messages: [],
    files: {},
    activeFile: null,
    isProcessing: false
  });

  // Initialize workspace history hook
  const { 
    history, 
    loading: historyLoading, 
    error: historyError, 
    fetchWorkspaceHistory 
  } = useWorkspaceHistory(workspaceId);
  
  // Initialize responsive layout hooks
  const {
    screenMode,
    windowWidth,
    chatSize,
    explorerSize,
    editorSize,
    terminalSize,
    showExplorer,
    showPreview,
    showTerminal,
    layout,
    setChatSize,
    setExplorerSize,
    setEditorSize,
    setTerminalSize,
    applyLayoutChange,
    toggleExplorer,
    togglePreview,
    toggleTerminal,
    desktopBreakpoint,
    tabletBreakpoint,
    mobileBreakpoint,
  } = useResponsiveLayout();
  
  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Initialize with preloaded history if available
  useEffect(() => {
    if (preloadedHistory?.messages?.length > 0) {
      // Convert message format from API to our local format
      const formattedMessages = preloadedHistory.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
        timestamp: msg.timestamp
      }));

      // Update session state with the retrieved messages
      setSessionState(prev => ({
        ...prev,
        messages: formattedMessages
      }));

      // Also update workspace name if available
      if (preloadedHistory.workspace_name) {
        setWorkspaceName(preloadedHistory.workspace_name);
      }
    }
  }, [preloadedHistory]);

  // Load workspace history when component mounts
  useEffect(() => {
    if (workspaceId) {
      // Fetch workspace data
      fetchWorkspaceHistory(workspaceId);
    }
  }, [workspaceId, fetchWorkspaceHistory]);

  // Update session state with messages from history
  useEffect(() => {
    if (history?.messages && history.messages.length > 0) {
      // Convert the API message format to our session state format
      const formattedMessages = history.messages.map(msg => ({
        id: msg.id,
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text,
        timestamp: msg.timestamp
      }));

      // Update session state with the retrieved messages
      setSessionState(prev => ({
        ...prev,
        messages: formattedMessages
      }));

      // Also update workspace name if available
      if (history.workspace_name) {
        setWorkspaceName(history.workspace_name);
      }
    }
  }, [history]);

  // Send message to the websocket
  const sendMessage = useCallback(async (message: string): Promise<boolean> => {
    if (!workspaceId) {
      console.error("Cannot send message: No workspace ID");
      return false;
    }
    
    try {
      // Ensure connection is established
      if (!socketService.isConnectedToWorkspace(workspaceId)) {
        console.log(`Connecting to workspace ${workspaceId} before sending message`);
        await socketService.connect(workspaceId);
      }
      
      console.log(`Sending message to workspace ${workspaceId}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
      
      // Send message to the server
      const success = socketService.send({
        type: 'query_agent',
        query: message,
        workspace_id: workspaceId,
        timestamp: new Date().toISOString()
      });
      
      if (success) {
        // Add the user message to our local state
        setSessionState(prev => ({
          ...prev,
          messages: [...prev.messages, {
            role: 'user',
            content: message,
            timestamp: new Date().toISOString()
          }],
          isProcessing: true
        }));
        console.log(`Message sent successfully to workspace ${workspaceId}`);
      } else {
        console.error(`Failed to send message to workspace ${workspaceId}`);
      }
      
      return success;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }, [workspaceId, socketService, setSessionState]);

  // Reconnect to websocket
  const reconnect = useCallback(async (): Promise<boolean> => {
    if (!workspaceId) {
      console.error("Cannot reconnect: No workspace ID");
      return false;
    }
    
    try {
      await socketService.connect(workspaceId);
      return socketService.isConnectedToWorkspace(workspaceId);
    } catch (error) {
      console.error("Error reconnecting:", error);
      return false;
    }
  }, [workspaceId, socketService]);

  // Initialize workspace operations with required functions
  const {
    handleSaveWorkspace,
    resetProcessingState,
    handleFirstPrompt,
    operationStartTimeRef
  } = useWorkspaceOperations(sendMessage, reconnect);

  const handleSendMessage = useCallback(async (message: string) => {
    try {
      // Use the sendMessage function we defined above
      return await sendMessage(message);
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  }, [sendMessage]);

  // Toggle history modal visibility
  const toggleHistory = useCallback(() => {
    setShowHistoryModal(prev => !prev);
  }, []);

  // Create async run command handler
  const handleRunCommand = useCallback(async (command: string): Promise<string> => {
    // This will be handled by WorkspaceStateManager
    return Promise.resolve(`Command executed: ${command}`);
  }, []);

  // Helper function to handle file action broadcasts
  const handleFileActionBroadcast = useCallback((data: any) => {
    console.log('File action broadcast received:', data);
    
    // Handle file action based on type (create, update, delete, etc.)
    if (data.action === 'create' || data.action === 'update') {
      // Request file content if needed
      if (data.path && !sessionState.files[data.path]) {
        console.log(`Requesting content for new file: ${data.path}`);
        // Implementation would depend on how you fetch file content
        // This is a placeholder
      }
    } else if (data.action === 'delete') {
      // Remove file from state
      if (data.path) {
        setSessionState(prev => {
          const updatedFiles = {...prev.files};
          delete updatedFiles[data.path];
          return {
            ...prev,
            files: updatedFiles
          };
        });
      }
    }
  }, [sessionState.files]);

  // Helper function to send tool responses back to the server
  const sendToolResponse = useCallback((toolId: string, response: any) => {
    if (!workspaceId) {
      console.error("Cannot send tool response: No workspace ID");
      return false;
    }
    
    try {
      return socketService.send({
        type: 'tool_response',
        tool_id: toolId,
        data: response,
        workspace_id: workspaceId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error sending tool response:", error);
      return false;
    }
  }, [workspaceId, socketService]);

  // Setup WebSocket event listeners
  useEffect(() => {
    if (!workspaceId) return;

    // Helper function to determine language from file path
    const getLanguageFromPath = (path: string): string => {
      const extension = path.split('.').pop()?.toLowerCase() || '';
      const languageMap: Record<string, string> = {
        'js': 'javascript',
        'jsx': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'py': 'python',
        'php': 'php',
        'css': 'css',
        'html': 'html',
        'json': 'json',
        'md': 'markdown'
      };
      return languageMap[extension] || '';
    };

    // Set up message handlers for different WebSocket events
    const messageHandler = (data: any) => {
      console.log('WebSocket message received:', data);
      
      // Special handling for text and thinking streaming updates
      if (data.type === 'text' || data.type === 'thinking') {
        // Let the AgentChat component handle the streaming updates directly
        // Don't add individual chunks to the messages array
        return;
      }
      
      // Handle new_message type explicitly - this is how the backend responds to query_agent
      if (data.type === 'new_message') {
        // Extract the message content and sender
        const messageContent = data.text || '';
        const messageSender = data.sender || 'assistant';
        const messageId = data.message_id || uuidv4();
        
        // Add the message to our state
        setSessionState(prev => {
          // Check for duplicates - either by ID, or by content+role+timestamp
          const isDuplicate = prev.messages.some(m => 
            (m.id && m.id === messageId) || 
            (m.content === messageContent && 
             m.role === messageSender &&
             Math.abs(new Date(m.timestamp).getTime() - new Date(data.timestamp || 0).getTime()) < 10000)
          );
          
          if (isDuplicate) {
            console.log('Duplicate message detected, not adding:', messageId);
            return prev;
          }
          
          // If this is a standalone new message (not a stream-built one), filter out any fragments
          const filteredMessages = messageSender === 'assistant' 
            ? prev.messages.filter(m => {
                // Remove recent fragments that might be part of this consolidated message
                if (m.role === 'assistant' && 
                    new Date(m.timestamp).getTime() > Date.now() - 10000 &&
                    messageContent.includes(m.content)) {
                  return false;
                }
                return true;
              })
            : prev.messages;
          
          const updatedMessages = [
            ...filteredMessages,
            {
              id: messageId,
              role: messageSender,
              content: messageContent,
              timestamp: data.timestamp || new Date().toISOString(),
              workspace_id: data.workspace_id || workspaceId || null
            }
          ];
          
          console.log('Updated messages:', updatedMessages);
          
          return {
            ...prev,
            messages: updatedMessages,
            // If this is a message from the assistant, we're no longer processing
            isProcessing: messageSender === 'assistant' ? false : prev.isProcessing
          };
        });
        
        return; // We've handled this message, so return
      }
      
      // Handle stream_complete events - use the consolidated message
      if (data.type === 'stream_complete') {
        console.log('Received stream_complete:', data);
        
        // Add the complete message to our state, replacing any fragments
        setSessionState(prev => {
          const messageId = data.message_id || uuidv4();
          const role = data.content_type === 'thinking' ? 'thinking' : 'assistant';
          
          // Check if this message already exists to avoid duplicates
          const messageExists = prev.messages.some(m => 
            (m.id && m.id === messageId) || 
            (m.content === data.content && m.role === role)
          );
          
          if (messageExists) return prev;
          
          // Filter out any stream fragments that might have been added
          const filteredMessages = prev.messages.filter(m => {
            // Keep messages that aren't fragments of the same response 
            if (m.role === role && new Date(m.timestamp).getTime() > Date.now() - 10000) {
              // Check if this fragment is contained in our complete message
              return !data.content.includes(m.content);
            }
            return true;
          });
          
          return {
            ...prev,
            messages: [
              ...filteredMessages,
              {
                id: messageId,
                role: role,
                content: data.content,
                timestamp: data.timestamp || new Date().toISOString(),
                status: 'completed',
                workspace_id: data.workspace_id || workspaceId || null
              }
            ],
            isProcessing: false
          };
        });
        
        return; // We've handled this message, so return
      }
      
      // Handle error updates
      if (data.type === WebSocketEventType.ERROR_UPDATE) {
        setSessionState(prev => ({
          ...prev,
          messages: [...prev.messages, {
            id: data.message_id || uuidv4(),
            role: 'error',
            content: data.error || 'An unknown error occurred',
            timestamp: data.timestamp || new Date().toISOString()
          }],
          isProcessing: false
        }));
        return;
      }
      
      // Skip individual text fragments to avoid adding each chunk as a separate message
      if (data.type === 'text' || data.type === WebSocketEventType.TEXT_UPDATE) {
        // Don't add these as individual messages - they'll be collected by the stream_complete handler
        return;
      }
      
      // Update session state based on message type, still handling non-stream messages
      if (data.type === WebSocketEventType.AGENT_RESPONSE ||
          data.type === WebSocketEventType.THINKING_UPDATE ||
          data.type === WebSocketEventType.ASSISTANT_RESPONSE ||
          data.type === WebSocketEventType.MESSAGE_UPDATE ||
          data.type === WebSocketEventType.USER_MESSAGE ||
          data.type === WebSocketEventType.THINKING) {
        // Update messages
        setSessionState(prev => {
          // Extract content based on message type
          let content = '';
          let role = 'assistant';
          
          if (data.type === WebSocketEventType.ASSISTANT_RESPONSE) {
            // Process structured assistant response
            if (data.data && typeof data.data === 'object') {
              if (data.data.type === 'text') {
                content = data.data.content || '';
              } else if (data.data.type === 'thinking') {
                content = data.data.content || '';
                role = 'thinking';
              } else {
                // Other types like tool calls - just stringify for now
                content = JSON.stringify(data.data);
              }
            } else {
              content = data.data || '';
            }
          } else {
            // Handle other message types
            content = data.content || data.text || data.thinking || data.message || '';
            role = data.role || data.sender || (data.type === WebSocketEventType.THINKING_UPDATE ? 'thinking' : 'assistant');
          }
          
          // Don't add empty messages
          if (!content.trim()) {
            return prev;
          }
          
          // Don't add duplicate messages
          const messageExists = prev.messages.some(
            msg => (msg.id && data.message_id && msg.id === data.message_id) || 
                  (msg.content === content && msg.role === role)
          );
          
          if (messageExists) {
            return prev;
          }
          
          return {
            ...prev,
            messages: [...prev.messages, {
              id: data.message_id || data.id || uuidv4(),
              role: role,
              content: content,
              timestamp: data.timestamp || new Date().toISOString()
            }],
            // If this is a final message from the assistant, we're no longer processing
            isProcessing: data.type === 'message_status' && data.status === 'complete' ? false : prev.isProcessing
          };
        });
      }
      
      // Handle file updates
      if (data.type === WebSocketEventType.FILE_UPDATE && data.file) {
        setSessionState(prev => {
          const updatedFiles = {...prev.files};
          if (data.file.path && data.file.content !== undefined) {
            updatedFiles[data.file.path] = {
              type: 'file',
              content: data.file.content,
              language: data.file.language || getLanguageFromPath(data.file.path)
            };
          }
          return {
            ...prev,
            files: updatedFiles
          };
        });
      }
      
      // Handle file action broadcasts from backend
      if (data.type === 'file_action_broadcast') {
        // For file actions, we may need to request the file content
        handleFileActionBroadcast(data);
      }
      
      // Handle processing status updates
      if (data.type === WebSocketEventType.PROCESSING_STATUS || 
          data.type === 'processing_status' || 
          data.type === 'message_status') {
        console.log('Processing status update received:', data);
        
        // Determine if we're processing based on the status field
        const isProcessing = data.status === 'processing' || data.is_processing === true;
        
        // If status is 'complete', make sure we're no longer processing
        if (data.status === 'complete') {
          setSessionState(prev => ({
            ...prev,
            isProcessing: false
          }));
          console.log('Processing completed');
        } else {
          // Update processing state in our session
          setSessionState(prev => ({
            ...prev,
            isProcessing: isProcessing
          }));
        }
        
        return; // We've handled this message
      }
      
      // Handle tool requests from backend
      if (data.type === 'tool_request') {
        handleToolRequest(data);
      }
    };
    
    // Handler for tool requests
    const handleToolRequest = async (data: any) => {
      console.log('Tool request received:', data);
      
      if (!data.tool_name || !data.tool_id) {
        console.error('Invalid tool request: missing tool_name or tool_id');
        return;
      }
      
      // Handle different tool types
      switch (data.tool_name) {
        case 'get_project_structure':
          // Send project structure back
          sendToolResponse(data.tool_id, {
            type: 'project_structure',
            files: sessionState.files
          });
          break;
          
        case 'read_file':
          if (data.params?.path) {
            const filePath = data.params.path;
            const fileContent = sessionState.files[filePath]?.content || '';
            sendToolResponse(data.tool_id, {
              path: filePath,
              content: fileContent,
              exists: !!sessionState.files[filePath]
            });
          } else {
            sendToolResponse(data.tool_id, {
              error: 'Missing file path'
            });
          }
          break;
          
        case 'write_file':
          if (data.params?.path && data.params?.content !== undefined) {
            const filePath = data.params.path;
            // Update our state with the new file
            setSessionState(prev => {
              const updatedFiles = {...prev.files};
              updatedFiles[filePath] = {
                type: 'file',
                content: data.params.content,
                language: getLanguageFromPath(filePath)
              };
              return {
                ...prev,
                files: updatedFiles
              };
            });
            
            // Send success response
            sendToolResponse(data.tool_id, {
              path: filePath,
              success: true
            });
          } else {
            sendToolResponse(data.tool_id, {
              error: 'Missing file path or content'
            });
          }
          break;
          
        default:
          console.warn(`Unknown tool request: ${data.tool_name}`);
          sendToolResponse(data.tool_id, {
            error: `Unsupported tool: ${data.tool_name}`
          });
      }
    };
    
    // Subscribe to socket events
    socketService.on('message', messageHandler);
    
    // Clean up on unmount
    return () => {
      socketService.off('message', messageHandler);
    };
  }, [workspaceId, sessionState.files, sendToolResponse, handleFileActionBroadcast, socketService]);

  // Render the component
  return (
    <FileOperationsProvider>
      <WorkspaceStateProvider>
        <WorkspaceStyles />
        <div className="flex flex-col h-screen overflow-hidden">
          <AgentToolbar 
            workspaceName={workspaceName}
            onSaveWorkspace={handleSaveWorkspace}
            onToggleHistory={toggleHistory}
            layout={layout as PanelLayout}
            onLayoutChange={applyLayoutChange}
            onToggleExplorer={toggleExplorer}
            onTogglePreview={togglePreview}
            onToggleTerminal={toggleTerminal}
            isProcessing={false} // Will be read from WorkspaceStateManager in the component
            showExplorer={showExplorer}
            showPreview={showPreview}
            showTerminal={showTerminal}
            connectionStatus="connected"
          />
          
          <div className="flex-grow overflow-hidden">
            {/* We'll replace the check for messages.length with a LandingScreen component */}
            <div className="flex h-full">
              {/* Chat Panel */}
              <ChatPanel
                screenMode={screenMode}
                windowWidth={windowWidth}
                desktopBreakpoint={desktopBreakpoint}
                chatSize={chatSize}
                onChatResize={(direction, delta, elementRef) => {
                  const parentWidth = elementRef.parentElement?.clientWidth || windowWidth;
                  if (parentWidth > 0) {
                    const newWidth = chatSize + (delta.width / parentWidth * 100);
                    const clampedWidth = Math.max(20, Math.min(50, newWidth));
                    setChatSize(clampedWidth);
                  }
                }}
                isDark={isDark}
              >
                <AgentChat 
                  hideCodeInMessages={true}
                  processingFilePath={undefined}
                />
              </ChatPanel>
              
              {/* Main Workspace */}
              <div className="flex-1 h-full">
                <WorkspaceLayout
                  screenMode={screenMode}
                  windowWidth={windowWidth}
                  layout={layout as PanelLayout}
                  showExplorer={showExplorer}
                  showPreview={showPreview}
                  showTerminal={showTerminal}
                  isDark={isDark}
                  explorerSize={explorerSize}
                  editorSize={editorSize}
                  terminalSize={terminalSize}
                  chatSize={chatSize}
                  setExplorerSize={setExplorerSize}
                  setEditorSize={setEditorSize}
                  setTerminalSize={setTerminalSize}
                  setChatSize={setChatSize}
                  onFileSelect={() => {}}
                  onFileContentChange={() => {}}
                  onFilesChange={() => {}}
                  onRunCommand={handleRunCommand}
                  onToggleTerminal={toggleTerminal}
                  files={{}}  // Files will be managed by WorkspaceStateManager
                  activeFile={undefined} // ActiveFile will be managed by WorkspaceStateManager
                  desktopBreakpoint={desktopBreakpoint}
                  tabletBreakpoint={tabletBreakpoint}
                  mobileBreakpoint={mobileBreakpoint}
                />
              </div>
            </div>
          </div>
          
          {showHistoryModal && (
            <AgentHistoryModal
              isOpen={showHistoryModal}
              onClose={toggleHistory}
              activeWorkspaceId={workspaceId}
            />
          )}
          
          {/* Pass empty object for files since they'll be handled by the WorkspaceStateManager */}
          <FileOperationsTracker files={{}} />
        </div>
      </WorkspaceStateProvider>
    </FileOperationsProvider>
  );
};

export default AgentWorkspace; 