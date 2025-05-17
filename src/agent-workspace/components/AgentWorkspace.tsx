/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
"use client";

import { useState, useEffect, useCallback } from 'react';
import {  PanelLayout, FileNode } from '../types';
import AgentToolbar from './toolbar/AgentToolbar';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeProvider';
import AgentChat from './panels/AgentChat';
import AgentLanding from './landing/AgentLanding';
import AgentHistoryModal from './modals/AgentHistoryModal';
import { AGENT_SERVICES } from '../constants';
import { saveFilesToLocalStorage } from '../utils/fileUtils';
import FileOperationsProvider from '../context/FileOperationsContext';
import { FileOperationsTracker } from './trackers';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useWorkspaceOperations } from '../hooks/useWorkspaceOperations';
import { downloadSourceCode } from '../utils/zipUtils';
import WorkspaceLayout from './layout/WorkspaceLayout';
import { ChatPanel } from './layout/ResizablePanels';
import WorkspaceStyles from './layout/WorkspaceStyles';
import { getSocketService, WebSocketEventType } from '../utils/websocketService';
import { v4 as uuidv4 } from 'uuid';

interface AgentWorkspaceProps {
  preloadedService: string;
  workspaceId: string;
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
    setShowExplorer,
    setShowPreview,
    setShowTerminal,
    applyLayoutChange,
    toggleExplorer,
    togglePreview,
    toggleTerminal,
    desktopBreakpoint,
    tabletBreakpoint,
    mobileBreakpoint,
    isMobile,
    isTablet
  } = useResponsiveLayout();
  
  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedService, setSelectedService] = useState(preloadedService || '');


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

  // Run a command in the terminal
  const handleRunCommand = useCallback(async (command: string) => {
    // This is a placeholder - in a real app, you would have a backend service
    // that would run the command and return the result
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network latency
    
    if (command.startsWith('wp ')) {
      return `Running WordPress CLI: ${command}\nSuccess: Operation completed.`;
    } else if (command.startsWith('git ')) {
      return `Running Git command: ${command}\nSuccess: Git operation completed.`;
    } else if (command.startsWith('npm ')) {
      return `Running NPM command: ${command}\nSuccess: Package operation completed.`;
    } else if (command.startsWith('ls')) {
      return `index.php\nwp-config.php\nwp-content/\n  plugins/\n    hello-dolly/\n    akismet/\n  themes/\n    twentytwentythree/\n    custom-theme/`;
    } else {
      return `Command not recognized: ${command}\nTry 'help' for available commands.`;
    }
  }, []);

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
          console.warn(`Unhandled tool request: ${data.tool_name}`);
          sendToolResponse(data.tool_id, {
            error: `Tool not implemented: ${data.tool_name}`
          });
      }
    };
    
    // Helper function to send tool response back to the server
    const sendToolResponse = (toolId: string, result: any) => {
      socketService.sendToolResponse(toolId, result);
    };
    
    // Handle file action broadcasts
    const handleFileActionBroadcast = (data: any) => {
      console.log('File action broadcast received:', data);
      
      const actionType = data.action_type;
      const path = data.path;
      
      if (!path) return;
      
      switch (actionType) {
        case 'create':
        case 'update':
          // Request file content if we don't have it
          socketService.send({
            type: 'request_file_content',
            workspace_id: workspaceId,
            path: path,
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'delete':
          // Remove file from our state
          setSessionState(prev => {
            const updatedFiles = {...prev.files};
            delete updatedFiles[path];
            return {
              ...prev,
              files: updatedFiles
            };
          });
          break;
      }
    };

    // Register event listeners
    socketService.on('message', messageHandler);
    
    // Connect to the workspace if not already connected
    if (!socketService.isConnectedToWorkspace(workspaceId)) {
      console.log(`Connecting to workspace ${workspaceId} on component mount`);
      socketService.connect(workspaceId)
        .then(() => {
          console.log('Successfully connected to workspace, sending heartbeat');
          // Send a heartbeat to ensure the connection is active
          socketService.sendHeartbeat();
        })
        .catch(console.error);
    } else {
      // Connection already exists, send heartbeat to ensure it's still active
      socketService.sendHeartbeat();
    }
    
    // Clean up event listeners when component unmounts
    return () => {
      socketService.removeListener('message', messageHandler);
    };
  }, [workspaceId, socketService, sessionState.files]);

  // Initialize workspace from service if provided
  useEffect(() => {
    if (preloadedService && !workspaceId) {
      // Find the corresponding service in AGENT_SERVICES
      const service = AGENT_SERVICES.find(s => 
        s.id.toLowerCase() === preloadedService.toLowerCase() || 
        s.title.toLowerCase().includes(preloadedService.toLowerCase())
      );
      
      if (service) {
        setWorkspaceName(`${service.title} Project`);
      } else {
        // Default service message if no match found
        setWorkspaceName(`${preloadedService} Project`);
      }
    }
  }, [preloadedService, workspaceId]);
  


  // Handle chat panel resize with proper types
  const handleChatResize = useCallback((direction: string, delta: { width: number; height: number }, elementRef: HTMLElement) => {
    if (windowWidth < desktopBreakpoint) {
      // Handle vertical resize on mobile/tablet
      const containerHeight = elementRef.parentElement?.clientHeight || 0;
      if (containerHeight > 0) {
        const newHeight = 50 + (delta.height / containerHeight * 100);
        const clampedHeight = Math.max(30, Math.min(70, newHeight));
        // Save mobile height
        localStorage.setItem('wp-agent-chat-height-mobile', clampedHeight.toString());
      }
    } else {
      // Handle horizontal resize on desktop
      const parentWidth = elementRef.parentElement?.clientWidth || windowWidth;
      if (parentWidth > 0) {
        // For left side panel, the width increases directly with delta.width
        const newWidth = chatSize + (delta.width / parentWidth * 100);
        const clampedWidth = Math.max(20, Math.min(50, newWidth));
        setChatSize(clampedWidth);
        // Save immediately
        localStorage.setItem('wp-agent-chat-size', clampedWidth.toString());
      }
    }
  }, [chatSize, windowWidth, desktopBreakpoint, setChatSize]);

  // Set up event listener for download source code
  useEffect(() => {
    const handleDownloadEvent = () => {
      // downloadSourceCode(sessionState.files, workspaceName);
    };
    
    const handleReconnectEvent = () => {
      socketService.connect(workspaceId).catch(console.error);
    };
    
    const handleResetProcessingEvent = () => {
      resetProcessingState();
    };
    
    document.addEventListener('download-source-code', handleDownloadEvent);
    document.addEventListener('reconnect-agent', handleReconnectEvent);
    document.addEventListener('reset-processing', handleResetProcessingEvent);
    
    return () => {
      document.removeEventListener('download-source-code', handleDownloadEvent);
      document.removeEventListener('reconnect-agent', handleReconnectEvent);
      document.removeEventListener('reset-processing', handleResetProcessingEvent);
    };
  }, [workspaceName, resetProcessingState, socketService, workspaceId]);

  // Handle orientation change
  useEffect(() => {
    const handleOrientationChange = () => {
      // Force a layout update when orientation changes
      setTimeout(() => {
        // Re-apply current layout to trigger resizing logic
        applyLayoutChange(layout);
        
        // On rotation to landscape, may want to enable more panels
        if (window.innerWidth > window.innerHeight && !showExplorer) {
          // Consider showing explorer when rotating to landscape
          if (window.innerWidth >= tabletBreakpoint) {
            setShowExplorer(true);
          }
        }
      }, 150); // Give browser time to complete the rotation
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, [applyLayoutChange, layout, showExplorer, setShowExplorer, tabletBreakpoint]);

  // Render workspace based on screen size
  const renderWorkspace = () => {
    // Make sure connectionStatus is never undefined
    const connectionStatus = socketService.getConnectionStatus() || 'connecting';
    
    return (
      <FileOperationsProvider>
        <div className={`flex flex-col h-full w-full overflow-hidden ${
          isDark ? 'bg-gray-900' : 'bg-white'
          }`}>
          
          {/* Add FileOperationTracker for monitoring operations */}
          <FileOperationsTracker files={sessionState.files} />
          
          {/* Toolbar */}
          <AgentToolbar
            workspaceName={workspaceName}
            layout={layout}
            onLayoutChange={applyLayoutChange}
            isProcessing={false}
            onSaveWorkspace={handleSaveWorkspace}
            onToggleExplorer={toggleExplorer}
            onTogglePreview={togglePreview}
            onToggleTerminal={toggleTerminal}
            onToggleHistory={toggleHistory}
            showExplorer={showExplorer}
            showPreview={showPreview}
            showTerminal={showTerminal}
            connectionStatus={connectionStatus}
          />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col lg:flex-row h-[calc(100%-48px)] overflow-hidden relative">
            {/* Main layout with panels */}
            <div className={`flex-1 flex ${
              windowWidth >= desktopBreakpoint ? 'flex-row' : 'flex-col'
            } h-full`}>
              
              {/* Chat panel - always render it but conditionally style/position */}
              <ChatPanel
                screenMode={screenMode}
                windowWidth={windowWidth}
                desktopBreakpoint={desktopBreakpoint}
                chatSize={chatSize}
                onChatResize={handleChatResize}
                isDark={isDark}
              >
                <AgentChat
                  sessionState={sessionState}
                  onSendMessage={handleSendMessage}
                  processingFilePath={undefined}
                  hideCodeInMessages={true}
                  setSessionState={setSessionState}
                />
              </ChatPanel>
            
              {/* Workspace layout - resizable panels */}
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <WorkspaceLayout
                  screenMode={screenMode}
                  windowWidth={windowWidth}
                  layout={layout}
                  showExplorer={showExplorer}
                  showPreview={showPreview}
                  showTerminal={showTerminal}
                  isDark={isDark}
                  chatSize={chatSize}
                  explorerSize={explorerSize}
                  editorSize={editorSize}
                  terminalSize={terminalSize}
                  setChatSize={setChatSize}
                  setExplorerSize={setExplorerSize}
                  setEditorSize={setEditorSize}
                  setTerminalSize={setTerminalSize}
                  onFileSelect={() => {}}
                  onFileContentChange={() => {}}
                  onFilesChange={() => {}}
                  onRunCommand={handleRunCommand}
                  onToggleTerminal={toggleTerminal}
                  activeFile={sessionState.activeFile || undefined}
                  files={sessionState.files}
                  currentService={selectedService}
                  processingFilePath={undefined}
                  desktopBreakpoint={desktopBreakpoint}
                  tabletBreakpoint={tabletBreakpoint}
                  mobileBreakpoint={mobileBreakpoint}
                />
              </div>
              
              {/* Mobile/tablet chat panel at bottom - remove conditional rendering for hydration consistency */}
              <div className="w-full border-t border-gray-200 dark:border-gray-700 lg:hidden flex-shrink-0" 
                   style={{ 
                     maxHeight: '45%', 
                     minHeight: '300px',
                     display: windowWidth < desktopBreakpoint ? 'block' : 'none' 
                   }}>
                <AgentChat
                  sessionState={sessionState}
                  onSendMessage={handleSendMessage}
                  processingFilePath={undefined}
                  hideCodeInMessages={true}
                />
              </div>
            </div>
          </div>
          
          {/* History modal */}
          {showHistoryModal && (
            <AgentHistoryModal
              isOpen={showHistoryModal}
              onClose={toggleHistory}
              sessionId={workspaceId}
            />
          )}
          
          {/* Add global CSS for responsive workspace */}
          <WorkspaceStyles />
        </div>
      </FileOperationsProvider>
    );
  };
  
  if (!workspaceId) {
    return (
      <div className="flex-1 h-full">
        <AgentLanding
          onFirstPrompt={handleFirstPrompt}
        />
      </div>
    );
  }
  
  return renderWorkspace();
};

export default AgentWorkspace; 