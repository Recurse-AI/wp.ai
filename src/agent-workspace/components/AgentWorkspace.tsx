"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAgentState } from '../hooks/useAgentState';
import { useAgentAPI } from '../hooks/useAgentAPI';
import { AgentFile, AgentWorkspaceProps, PanelLayout, FileNode, AIService } from '../types';
import AgentToolbar from './toolbar/AgentToolbar';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeProvider';
import { Resizable } from "re-resizable";
import FileExplorer from './panels/FileExplorer';
import AgentEditor from './panels/AgentEditor';
import AgentPreview from './panels/AgentPreview';
import AgentChat from './panels/AgentChat';
import AgentTerminal from './panels/AgentTerminal';
import AgentLanding from './landing/AgentLanding';
import { DEFAULT_PLUGIN_STRUCTURE, AGENT_SERVICES } from '../constants';
import { websocketService } from '../utils/websocketService';

// Local storage keys for panel sizes
const CHAT_SIZE_KEY = 'wp-agent-chat-size';
const EXPLORER_SIZE_KEY = 'wp-agent-explorer-size';
const EDITOR_SIZE_KEY = 'wp-agent-editor-size';
const PREVIEW_SIZE_KEY = 'wp-agent-preview-size';
const TERMINAL_SIZE_KEY = 'wp-agent-terminal-size';
const EXPLORER_VISIBLE_KEY = 'wp-agent-explorer-visible';
const PREVIEW_VISIBLE_KEY = 'wp-agent-preview-visible';
const TERMINAL_VISIBLE_KEY = 'wp-agent-terminal-visible';

// Function to recursively prepare files for JSZip
const prepareFilesForZip = (files: Record<string, FileNode>, currentPath = '') => {
  const result: Record<string, string> = {};
  
  Object.entries(files).forEach(([name, node]) => {
    const filePath = currentPath ? `${currentPath}/${name}` : name;
    
    if (node.type === 'file') {
      result[filePath] = node.content || '';
    } else if (node.type === 'folder' && node.children) {
      // Recursively process nested files
      const childResults = prepareFilesForZip(node.children, filePath);
      Object.assign(result, childResults);
    }
  });
  
  return result;
};

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
  const {
    createWorkspace
  } = useAgentAPI();

  // Panel size state with localStorage persistence
  const [chatSize, setChatSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSize = localStorage.getItem(CHAT_SIZE_KEY);
      return savedSize ? parseInt(savedSize, 10) : 30;
    }
    return 30; // Default 30% width
  });

  const [explorerSize, setExplorerSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSize = localStorage.getItem(EXPLORER_SIZE_KEY);
      return savedSize ? parseInt(savedSize, 10) : 20;
    }
    return 20; // Default 20% width
  });
  
  const [editorSize, setEditorSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSize = localStorage.getItem(EDITOR_SIZE_KEY);
      return savedSize ? parseInt(savedSize, 10) : 50;
    }
    return 50; // Default 50% width for workspace area minus explorer
  });
  
  const [terminalSize, setTerminalSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSize = localStorage.getItem(TERMINAL_SIZE_KEY);
      return savedSize ? parseInt(savedSize, 10) : 30;
    }
    return 30; // Default 30% height
  });
  
  // Panel visibility state
  const [showExplorer, setShowExplorer] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedVisible = localStorage.getItem(EXPLORER_VISIBLE_KEY);
      return savedVisible ? savedVisible === 'true' : false;
    }
    return false;
  });
  
  const [showPreview, setShowPreview] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedVisible = localStorage.getItem(PREVIEW_VISIBLE_KEY);
      return savedVisible ? savedVisible === 'true' : true;
    }
    return true;
  });
  
  const [showTerminal, setShowTerminal] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedVisible = localStorage.getItem(TERMINAL_VISIBLE_KEY);
      return savedVisible ? savedVisible === 'true' : false;
    }
    return false;
  });
  
  // Save panel sizes to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHAT_SIZE_KEY, chatSize.toString());
    }
  }, [chatSize]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXPLORER_SIZE_KEY, explorerSize.toString());
    }
  }, [explorerSize]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(EDITOR_SIZE_KEY, editorSize.toString());
    }
  }, [editorSize]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TERMINAL_SIZE_KEY, terminalSize.toString());
    }
  }, [terminalSize]);
  
  // Save panel visibility states
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXPLORER_VISIBLE_KEY, showExplorer.toString());
    }
  }, [showExplorer]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PREVIEW_VISIBLE_KEY, showPreview.toString());
    }
  }, [showPreview]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TERMINAL_VISIBLE_KEY, showTerminal.toString());
    }
  }, [showTerminal]);
  
  // Initialize agent state and API
  const {
    sessionState,
    isLoading,
    error,
    sendMessage,
    createFile,
    updateFile,
    selectFile,
    reconnect
  } = useAgentState({ workspaceId });
  
  // Local state for UI layout
  const [layout, setLayout] = useState<PanelLayout>(PanelLayout.Split);
  
  // Handlers
  const handleFileSelect = useCallback((file: AgentFile) => {
    selectFile(file);
  }, [selectFile]);
  
  const handleFileContentChange = useCallback((content: string) => {
    if (sessionState.activeFile) {
      updateFile(sessionState.activeFile.id, content);
    }
  }, [sessionState.activeFile, updateFile]);
  
  const handleFilesChange = useCallback((files: Record<string, FileNode>) => {
    // TODO: Add a method to update all files at once in the new API
    // For now, this won't do anything as we don't have a direct way to update all files
    console.log("Updating all files at once is not supported in the new API yet");
  }, []);
  
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

  const handleRegenerateMessage = useCallback(async () => {
    // To be implemented
    toast.error('Regenerate functionality is not yet implemented', {
      style: {
        background: theme === 'dark' ? '#333' : '#fff',
        color: theme === 'dark' ? '#fff' : '#333',
      }
    });
  }, [theme]);

  const handleSaveWorkspace = useCallback(async () => {
    // TODO: Implement workspace saving in the new API
    toast.success("Workspace is automatically saved", {
      style: {
        background: theme === 'dark' ? '#333' : '#fff',
        color: theme === 'dark' ? '#fff' : '#333',
      }
    });
  }, [theme]);

  // Toggle panel visibility
  const toggleExplorer = useCallback(() => {
    setShowExplorer(prev => !prev);
  }, []);

  const togglePreview = useCallback(() => {
    setShowPreview(prev => !prev);
    if (showPreview) {
      setLayout(PanelLayout.Editor);
    } else {
      setLayout(PanelLayout.Split);
    }
  }, [showPreview, setLayout]);

  const toggleTerminal = useCallback(() => {
    setShowTerminal(prev => !prev);
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

  // Calculate window sizes for responsive layout
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      
      // Auto-adjust layout for small screens
      if (window.innerWidth < 768 && showExplorer) {
        // On mobile screens, auto-hide file explorer
        setShowExplorer(false);
      }
      
      // Adjust chat panel size for small screens
      if (window.innerWidth < 768 && chatSize < 50) {
        setChatSize(50); // Make chat wider on mobile
      } else if (window.innerWidth >= 768 && chatSize > 40) {
        setChatSize(30); // Default size on larger screens
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      // Call once on mount to set initial responsive layout
      handleResize();
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [showExplorer, chatSize]);

  // Handle downloading source code
  const handleDownloadSourceCode = useCallback(async () => {
    try {
      // Dynamically import JSZip to avoid increasing the initial bundle size
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Get all files recursively
      const flattenedFiles = prepareFilesForZip(sessionState.files);
      
      // Add files to zip
      Object.entries(flattenedFiles).forEach(([path, content]) => {
        zip.file(path, content);
      });
      
      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Create a download link
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = `${workspaceName.replace(/\s+/g, '-').toLowerCase()}.zip`;
      
      // Trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success('Source code downloaded successfully');
    } catch (error) {
      console.error('Error downloading source code:', error);
      toast.error('Failed to download source code');
    }
  }, [sessionState.files, workspaceName]);
  
  // Set up event listener for download source code
  useEffect(() => {
    const handleDownloadEvent = () => {
      handleDownloadSourceCode();
    };
    
    document.addEventListener('download-source-code', handleDownloadEvent);
    
    return () => {
      document.removeEventListener('download-source-code', handleDownloadEvent);
    };
  }, [handleDownloadSourceCode]);

  // Handler for first prompt from landing page
  const handleFirstPrompt = useCallback(async (prompt: string) => {
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
      
      // Hide landing page and show workspace
      setShowLanding(false);
      
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
              await reconnect(newWorkspaceId);
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
      }, 2000); // Increased from 1000ms to 2000ms
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

  // If showing landing page, render only that
  if (showLanding) {
    return <AgentLanding onFirstPrompt={handleFirstPrompt} />;
  }

  return (
    <div className="flex flex-col h-full min-h-screen overflow-hidden agent-workspace">
      {/* Toolbar */}
      <AgentToolbar
        layout={layout}
        onLayoutChange={setLayout}
        workspaceName={workspaceName}
        isProcessing={sessionState.isProcessing || isLoading}
        onSaveWorkspace={handleSaveWorkspace}
        onToggleExplorer={toggleExplorer}
        onTogglePreview={togglePreview}
        onToggleTerminal={toggleTerminal}
        showExplorer={showExplorer}
        showPreview={showPreview}
        showTerminal={showTerminal}
        connectionStatus={sessionState.connectionStatus}
      />
      
      {/* Connection Error Message */}
      {sessionState.connectionStatus === 'error' || sessionState.connectionStatus === 'disconnected' ? (
        <div className={`px-4 py-2 text-center text-sm ${
          isDark ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800'
        }`}>
          <span className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Connection to agent server lost. 
            <button 
              onClick={() => sessionState.id && reconnect(sessionState.id)}
              className={`underline font-medium ${
                isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'
              }`}
            >
              Try reconnecting
            </button>
          </span>
        </div>
      ) : null}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Main horizontal layout */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-visible">
          {/* AI Chat Panel - Full width on mobile, left side on desktop */}
          <Resizable
            size={{ width: windowWidth < 768 ? '100%' : `${chatSize}%`, height: windowWidth < 768 ? '50%' : "100%" }}
            minWidth={windowWidth < 768 ? '100%' : "20%"}
            maxWidth={windowWidth < 768 ? '100%' : "50%"}
            minHeight={windowWidth < 768 ? '30%' : "100%"}
            maxHeight={windowWidth < 768 ? '70%' : "100%"}
            enable={{ 
              right: windowWidth >= 768, 
              bottom: windowWidth < 768
            }}
            onResizeStop={(e, direction, ref, d) => {
              if (windowWidth < 768) {
                // Handle vertical resize on mobile
                const containerHeight = ref.parentElement?.clientHeight || 0;
                const newHeight = 50 + (d.height / containerHeight * 100);
                // Store in a different variable or localStorage if needed
              } else {
                // Handle horizontal resize on desktop
                const newWidth = chatSize + (d.width / windowWidth * 100);
                setChatSize(newWidth);
              }
            }}
            className={`${windowWidth < 768 ? '' : 'border-r'} ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <AgentChat
              sessionState={sessionState}
              onSendMessage={handleSendMessage}
              onRegenerateMessage={handleRegenerateMessage}
            />
          </Resizable>

          {/* Workspace Area - Right side or bottom on mobile */}
          <div className={`flex-1 flex overflow-auto ${windowWidth < 768 ? 'border-t' : ''} ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* File Explorer - Conditional */}
            {showExplorer && (
              <Resizable
                size={{ width: `${explorerSize}%`, height: "100%" }}
                minWidth="10%"
                maxWidth="30%"
                enable={{ right: true }}
                onResizeStop={(e, direction, ref, d) => {
                  // Calculate new size as percentage of parent container (workspace area)
                  const workspaceWidth = windowWidth * (1 - chatSize / 100);
                  const newWidth = explorerSize + (d.width / workspaceWidth * 100);
                  setExplorerSize(newWidth);
                }}
                className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'} border-r ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <div className="h-full overflow-auto">
                  <FileExplorer
                    files={sessionState.files}
                    selectedFileId={sessionState.activeFile?.id}
                    onFileSelect={handleFileSelect}
                    onFilesChange={handleFilesChange}
                  />
                </div>
              </Resizable>
            )}

            {/* Editor/Preview Area */}
            <div className="flex-1 flex flex-col overflow-auto">
              {/* Main content area */}
              <div className="flex-1 overflow-auto">
                {layout === PanelLayout.Editor || !showPreview ? (
                  sessionState.activeFile ? (
                    <AgentEditor
                      file={sessionState.activeFile}
                      onChange={handleFileContentChange}
                    />
                  ) : (
                    <div className={`flex items-center justify-center h-full ${
                      isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
                    }`}>
                      <p>Select a file to edit</p>
                    </div>
                  )
                ) : layout === PanelLayout.Preview ? (
                  <AgentPreview 
                    files={sessionState.files}
                    activeFile={sessionState.activeFile}
                    currentService={selectedService || undefined}
                  />
                ) : layout === PanelLayout.Split ? (
                  <div className="flex h-full">
                    <Resizable
                      size={{ width: `${editorSize}%`, height: "100%" }}
                      minWidth="30%"
                      maxWidth="70%"
                      enable={{ right: true }}
                      onResizeStop={(e, direction, ref, d) => {
                        const newWidth = editorSize + (d.width / ref.parentElement!.clientWidth * 100);
                        setEditorSize(newWidth);
                      }}
                      className={`border-r ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                      {sessionState.activeFile ? (
                        <AgentEditor
                          file={sessionState.activeFile}
                          onChange={handleFileContentChange}
                        />
                      ) : (
                        <div className={`flex items-center justify-center h-full ${
                          isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
                        }`}>
                          <p>Select a file to edit</p>
                        </div>
                      )}
                    </Resizable>
                    <div className="flex-1">
                      <AgentPreview 
                        files={sessionState.files}
                        activeFile={sessionState.activeFile}
                        currentService={selectedService || undefined}
                      />
                    </div>
                  </div>
                ) : (
                  sessionState.activeFile ? (
                    <AgentEditor
                      file={sessionState.activeFile}
                      onChange={handleFileContentChange}
                    />
                  ) : (
                    <div className={`flex items-center justify-center h-full ${
                      isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
                    }`}>
                      <p>Select a file to edit</p>
                    </div>
                  )
                )}
              </div>

              {/* Terminal - Conditional */}
              {showTerminal && (
                <Resizable
                  size={{ width: "100%", height: `${terminalSize}%` }}
                  minHeight="10%"
                  maxHeight="50%"
                  enable={{ top: true }}
                  onResizeStop={(e, direction, ref, d) => {
                    const containerHeight = ref.parentElement?.clientHeight || 0;
                    const newHeight = terminalSize - (d.height / containerHeight * 100);
                    setTerminalSize(newHeight);
                  }}
                  className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                >
                  <AgentTerminal onRunCommand={handleRunCommand} />
                </Resizable>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CSS for resize handles */}
      <style jsx global>{`
        .react-resizable-handle {
          position: absolute;
          width: 5px;
          height: 100%;
          background-clip: padding-box;
          border-right: 1px solid transparent;
          cursor: col-resize;
          z-index: 10;
          transition: background-color 0.2s;
        }
        
        .react-resizable-handle-e {
          right: 0;
          top: 0;
        }
        
        .react-resizable-handle-s {
          bottom: 0;
          left: 0;
          width: 100%;
          height: 5px;
          cursor: row-resize;
        }
        
        .react-resizable-handle:hover {
          background-color: #3b82f6;
        }
        
        .react-resizable-handle-e:hover {
          width: 7px;
        }
        
        .react-resizable-handle-s:hover {
          height: 7px;
        }
      `}</style>
    </div>
  );
};

export default AgentWorkspace; 