"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAgentState } from '../hooks/useAgentState';
import { useAgentAPI } from '../hooks/useAgentAPI';
import { AgentFile, AgentWorkspaceProps, PanelLayout, FileNode, AIService } from '../types';
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
import ConnectionStatus from './status/ConnectionStatus';
import { ChatPanel } from './layout/ResizablePanels';
import WorkspaceStyles from './layout/WorkspaceStyles';

const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  preloadedService,
  workspaceId,
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [workspaceName, setWorkspaceName] = useState('My WordPress Project');
  const [selectedService, setSelectedService] = useState<AIService | null>(null);
  const [showLanding, setShowLanding] = useState(!workspaceId);

  // Initialize agent API
  const { createWorkspace, activeTool } = useAgentAPI();
  
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
  
  // Initialize agent state and API
  const {
    sessionState,
    isLoading,
    error,
    sendMessage,
    createFile,
    updateFile,
    selectFile,
    reconnect,
    currentlyProcessingFile
  } = useAgentState({ workspaceId });
  
  // Wrapper function to adapt sendMessage to the expected interface
  const handleSendMessageAdapter = useCallback(async (message: string): Promise<boolean> => {
    const result = await sendMessage(message);
    // Convert result to boolean
    return !!result;
  }, [sendMessage]);
  
  // Initialize workspace operations
  const {
    handleSaveWorkspace,
    resetProcessingState,
    handleFirstPrompt,
    operationStartTimeRef
  } = useWorkspaceOperations(handleSendMessageAdapter, reconnect);
  
  // Add a state variable to track last processed files
  const [lastProcessedFiles, setLastProcessedFiles] = useState<Record<string, FileNode>>({});

  // Restore the deleted useEffect for sessionState.files changes
  useEffect(() => {
    // When files change (either from user actions or AI responses)
    // Save to localStorage
    if (sessionState.id && sessionState.files && 
        JSON.stringify(sessionState.files) !== JSON.stringify(lastProcessedFiles)) {
      console.log('Files changed, saving to localStorage');
      saveFilesToLocalStorage(sessionState.id, sessionState.files);
      setLastProcessedFiles(sessionState.files);
    }
  }, [sessionState.id, sessionState.files, lastProcessedFiles]);
  
  // Handlers
  const handleFileSelect = useCallback((file: AgentFile) => {
    // Ensure editor is visible when a file is selected
    if (layout === PanelLayout.Preview) {
      applyLayoutChange(PanelLayout.Split);
    }
    
    // If preview is not visible, make sure it's in Editor mode
    if (!showPreview) {
      applyLayoutChange(PanelLayout.Editor);
    }
    
    // Always select the file
    selectFile(file.id);
  }, [selectFile, layout, showPreview, applyLayoutChange]);
  
  const handleFileContentChange = useCallback((content: string) => {
    if (sessionState.activeFile) {
      updateFile(sessionState.activeFile.id, content);
      
      // If on mobile and in Editor layout, maybe switch to Preview layout
      // after editing to show changes (but only when we have a preview)
      if (windowWidth < mobileBreakpoint && layout === PanelLayout.Editor && showPreview) {
        // Don't auto-switch to preview on mobile for now
        // This could be a user-configurable preference
        // applyLayoutChange(PanelLayout.Preview);
      }
    }
  }, [sessionState.activeFile, updateFile, windowWidth, mobileBreakpoint, layout, showPreview, applyLayoutChange]);

  // Restore the handleFilesChange function
  const handleFilesChange = useCallback((files: Record<string, FileNode>) => {
    // Since we don't have direct access to setSessionState from useAgentState,
    // we'll use the API to update files or save to localStorage
    if (sessionState.id) {
      saveFilesToLocalStorage(sessionState.id, files);
      console.log("Files updated and saved to localStorage");
    }
  }, [sessionState.id]);
  
  const handleSendMessage = useCallback(async (message: string) => {
    try {
      // Check if we have a session ID before trying to send message
      if (!sessionState.id || sessionState.id === 'undefined' || sessionState.id === 'null') {
        console.error(`Cannot send message: Invalid session ID ${sessionState.id}`);
        toast.error("Cannot send message: No valid workspace ID");
        return false;
      }
      
      console.log(`Sending message to workspace ID: ${sessionState.id}`);
      
      await sendMessage(message);
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
      return false;
    }
  }, [sendMessage, sessionState.id]);

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

  // Handle service change
  const handleServiceChange = useCallback((service: AIService) => {
    setSelectedService(service);
    setWorkspaceName(`${service.title} Project`);
    
    // Display a toast notification instead of adding a system message
    toast.success(`Switched to ${service.title} service`, {
      style: {
        background: theme === 'dark' ? '#333' : '#fff',
        color: theme === 'dark' ? '#fff' : '#333',
      }
    });
  }, [theme]);

  // Initialize workspace from service if provided
  useEffect(() => {
    if (preloadedService && !workspaceId) {
      // Find the corresponding service in AGENT_SERVICES
      const service = AGENT_SERVICES.find(s => 
        s.id.toLowerCase() === preloadedService.toLowerCase() || 
        s.title.toLowerCase().includes(preloadedService.toLowerCase())
      );
      
      if (service) {
        setSelectedService(service);
        setWorkspaceName(`${service.title} Project`);
      } else {
        // Default service message if no match found
        setWorkspaceName(`${preloadedService} Project`);
      }
    }
  }, [preloadedService, workspaceId]);
  
  // Show active tool notification
  useEffect(() => {
    if (activeTool) {
      const displayName = activeTool.replace(/([A-Z])/g, ' $1').trim();
      
      // Show toast for WordPress plugin/theme creation
      if (activeTool.includes('WordPress') || activeTool.includes('Plugin') || activeTool.includes('Theme')) {
        toast.success(`Creating ${displayName}...`, {
          id: `tool-${activeTool}`,
          duration: 3000,
          style: {
            background: theme === 'dark' ? '#333' : '#fff',
            color: theme === 'dark' ? '#fff' : '#333',
          }
        });
      }
    }
  }, [activeTool, theme]);

  // Update the useEffect for connection monitoring
  useEffect(() => {
    // Monitor connection status and auto-reconnect
    if (sessionState.connectionStatus === 'disconnected') {
      // Wait a short delay before attempting to reconnect
      const reconnectTimer = setTimeout(async () => {
        console.log("Connection lost, attempting automatic reconnect...");
        try {
          const reconnected = await reconnect();
          if (reconnected) {
            // Only show reconnection toast for explicitly triggered reconnects or for critical recoveries
            // Automatic reconnects shouldn't show toasts unless explicitly requested by user
            if (operationStartTimeRef.current > 0) {
              toast.success("Reconnected to server", {
                duration: 3000,
                style: {
                  background: isDark ? '#333' : '#fff',
                  color: isDark ? '#fff' : '#333',
                }
              });
            }
          } else {
            // Only show this error if we don't already have an error state
            // Avoid duplicate error messages
            if (!sessionState.error) {
              toast.error(
                (t) => (
                  <div className="flex flex-col">
                    <p>Couldn't reconnect automatically.</p>
                    <button 
                      className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={async () => {
                        toast.dismiss(t.id);
                        const success = await reconnect();
                        if (success) {
                          toast.success("Reconnected successfully!");
                        } else {
                          toast.error("Still unable to connect. Please reload the page.");
                        }
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                ),
                { id: 'reconnect-failed', duration: 10000 }
              );
            }
          }
        } catch (e) {
          console.error("Auto-reconnect failed:", e);
        }
      }, 3000);
      
      return () => clearTimeout(reconnectTimer);
    }
    
    // Add a timeout detector for long-running operations
    if (sessionState.isProcessing) {
      // Initialize the operation start time if it's not already set
      if (operationStartTimeRef.current === 0) {
        console.log("Operation started, setting start time");
        operationStartTimeRef.current = Date.now();
      }
      
      const timeoutTimer = setTimeout(() => {
        // Only show the timeout if we're still in a processing state after the timeout
        // AND more than 3 minutes (increased from 2 minutes) have passed since we started processing
        // This reduces frequency of timeout notifications
        const elapsedTime = Date.now() - operationStartTimeRef.current;
        if (sessionState.isProcessing && elapsedTime >= 180000) {
          // Show a timeout message with retry option if still processing after 3 minutes
          toast.error(
            (t) => (
              <div className="flex flex-col">
                <p>The operation is taking too long.</p>
                <button 
                  className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={async () => {
                    toast.dismiss(t.id);
                    // Try reconnecting to reset the state
                    await reconnect();
                    // Reset the operation start time
                    operationStartTimeRef.current = 0;
                  }}
                >
                  Try Again
                </button>
              </div>
            ),
            { id: 'operation-timeout', duration: 600000 }
          );
        }
      }, 180000); // 3 minutes (increased from 2 minutes)
      
      return () => {
        clearTimeout(timeoutTimer);
        // Reset the operation start time when isProcessing becomes false
        if (!sessionState.isProcessing) {
          operationStartTimeRef.current = 0;
        }
      };
    } else {
      // Reset the operation start time when isProcessing becomes false
      operationStartTimeRef.current = 0;
    }
  }, [sessionState.connectionStatus, sessionState.isProcessing, sessionState.error, reconnect, isDark]);
  
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
      downloadSourceCode(sessionState.files, workspaceName);
    };
    
    document.addEventListener('download-source-code', handleDownloadEvent);
    
    return () => {
      document.removeEventListener('download-source-code', handleDownloadEvent);
    };
  }, [sessionState.files, workspaceName]);

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
    const connectionStatus = sessionState.connectionStatus || 'connecting';
    
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
            isProcessing={isLoading || sessionState.isProcessing}
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
              
              {/* Chat panel - on the left on desktop */}
              {windowWidth >= desktopBreakpoint ? (
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
                    processingFilePath={currentlyProcessingFile || undefined}
                    hideCodeInMessages={true}
                  />
                </ChatPanel>
              ) : null}
            
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
                  onFileSelect={handleFileSelect}
                  onFileContentChange={handleFileContentChange}
                  onFilesChange={handleFilesChange}
                  onRunCommand={handleRunCommand}
                  onToggleTerminal={toggleTerminal}
                  activeFile={sessionState.activeFile}
                  files={sessionState.files}
                  currentService={selectedService}
                  processingFilePath={currentlyProcessingFile || undefined}
                  desktopBreakpoint={desktopBreakpoint}
                  tabletBreakpoint={tabletBreakpoint}
                  mobileBreakpoint={mobileBreakpoint}
                />
              </div>
              
              {/* Mobile/tablet chat panel at bottom */}
              {windowWidth < desktopBreakpoint ? (
                <div className="w-full border-t border-gray-200 dark:border-gray-700 lg:hidden flex-shrink-0" style={{ maxHeight: '45%', minHeight: '300px' }}>
                  <AgentChat
                    sessionState={sessionState}
                    onSendMessage={handleSendMessage}
                    processingFilePath={currentlyProcessingFile || undefined}
                    hideCodeInMessages={true}
                  />
                </div>
              ) : null}
            </div>
            
            {/* Connection status indicator */}
            <ConnectionStatus
              connectionStatus={connectionStatus}
              error={error || undefined}
              onReconnect={reconnect}
              processingTime={operationStartTimeRef.current > 0 ? Date.now() - operationStartTimeRef.current : undefined}
              onResetProcessing={resetProcessingState}
              isDark={isDark}
            />
          </div>
          
          {/* History modal */}
          {showHistoryModal && (
            <AgentHistoryModal
              isOpen={showHistoryModal}
              onClose={toggleHistory}
              sessionId={sessionState.id}
            />
          )}
          
          {/* Add global CSS for responsive workspace */}
          <WorkspaceStyles />
        </div>
      </FileOperationsProvider>
    );
  };
  
  if (showLanding && !workspaceId) {
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