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
import { DEFAULT_PLUGIN_STRUCTURE, AGENT_SERVICES } from '../constants';

// Local storage keys for panel sizes
const CHAT_SIZE_KEY = 'wp-agent-chat-size';
const EXPLORER_SIZE_KEY = 'wp-agent-explorer-size';
const EDITOR_SIZE_KEY = 'wp-agent-editor-size';
const PREVIEW_SIZE_KEY = 'wp-agent-preview-size';
const TERMINAL_SIZE_KEY = 'wp-agent-terminal-size';
const EXPLORER_VISIBLE_KEY = 'wp-agent-explorer-visible';
const PREVIEW_VISIBLE_KEY = 'wp-agent-preview-visible';
const TERMINAL_VISIBLE_KEY = 'wp-agent-terminal-visible';

const AgentWorkspace: React.FC<AgentWorkspaceProps> = ({
  preloadedService,
  workspaceId,
}) => {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [workspaceName, setWorkspaceName] = useState('My WordPress Project');
  const [selectedService, setSelectedService] = useState<AIService | null>(null);

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
      return savedVisible ? savedVisible === 'true' : true;
    }
    return true;
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
    layout,
    setLayout,
    setActiveFile,
    updateFileContent,
    updateFiles,
    addMessage,
    setProcessing,
    saveSession
  } = useAgentState(workspaceId, preloadedService);
  
  const {
    isLoading,
    error,
    sendMessage,
    generateCode,
    saveWorkspace
  } = useAgentAPI();
  
  // Handlers
  const handleFileSelect = useCallback((file: AgentFile) => {
    setActiveFile(file);
  }, [setActiveFile]);
  
  const handleFileContentChange = useCallback((content: string) => {
    if (sessionState.activeFile) {
      updateFileContent(sessionState.activeFile.id, content);
    }
  }, [sessionState.activeFile, updateFileContent]);
  
  const handleFilesChange = useCallback((files: Record<string, FileNode>) => {
    updateFiles(files);
  }, [updateFiles]);
  
  const handleSendMessage = useCallback(async (message: string) => {
    setProcessing(true);
    
    // Add user message
    addMessage({
      role: 'user',
      content: message,
    });
    
    // Send to API
    const response = await sendMessage(message, sessionState.files, (responseMessage) => {
      addMessage(responseMessage);
    });
    
    setProcessing(false);
    return response;
  }, [addMessage, sendMessage, sessionState.files, setProcessing]);

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
    // Save to server
    const result = await saveWorkspace(
      sessionState.id,
      workspaceName,
      sessionState.files,
      sessionState.messages
    );
    
    if (result.success) {
      // If this is a new workspace, update the URL
      if (!workspaceId && result.workspaceId) {
        router.replace(`/agent-workspace/${result.workspaceId}`);
      }
    }
  }, [
    sessionState.id, 
    sessionState.files, 
    sessionState.messages, 
    workspaceName, 
    saveWorkspace, 
    workspaceId, 
    router
  ]);

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
        
        // Add a system message about the selected service
        const welcomeMessage = `# Welcome to ${service.title}

${service.description}

You can ask me anything about ${service.title.toLowerCase()}, such as:
- ${service.example}
- How to customize or extend your project
- Best practices and recommendations

Let's get started!`;

        addMessage({
          role: 'system',
          content: welcomeMessage
        });
        
        // Initialize with starter template if available
        if (Object.keys(sessionState.files).length <= 1) {
          updateFiles(DEFAULT_PLUGIN_STRUCTURE);
        }
      } else {
        // Default service message if no match found
        setWorkspaceName(`${preloadedService} Project`);
      }
    }
  }, [preloadedService, workspaceId, addMessage, updateFiles, sessionState.files]);

  // Calculate window sizes for responsive layout
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Handle service change
  const handleServiceChange = useCallback((service: AIService) => {
    setSelectedService(service);
    setWorkspaceName(`${service.title} Project`);
    
    // Add a system message about the selected service
    addMessage({
      role: 'system',
      content: `Service selected: ${service.title}\n\nI'm here to help you with ${service.title.toLowerCase()}. ${service.description}\n\nYou can ask me to ${service.example.toLowerCase()}.`
    });
    
    // If no files have been created yet, provide a starter example based on the service
    if (Object.keys(sessionState.files).length <= 1) {
      // You could initialize different templates based on service.id
      // For now we're just using DEFAULT_PLUGIN_STRUCTURE for all services
      updateFiles(DEFAULT_PLUGIN_STRUCTURE);
    }
    
    toast.success(`Switched to ${service.title} service`, {
      style: {
        background: theme === 'dark' ? '#333' : '#fff',
        color: theme === 'dark' ? '#fff' : '#333',
      }
    });
  }, [theme, addMessage, updateFiles, sessionState.files]);

  return (
    <div className="flex flex-col h-screen overflow-hidden agent-workspace">
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
        onServiceChange={handleServiceChange}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Main horizontal layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* AI Chat Panel - Always on the left */}
          <Resizable
            size={{ width: `${chatSize}%`, height: "100%" }}
            minWidth="20%"
            maxWidth="50%"
            enable={{ right: true }}
            onResizeStop={(e, direction, ref, d) => {
              const newWidth = chatSize + (d.width / windowWidth * 100);
              setChatSize(newWidth);
            }}
            className={`border-r ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <AgentChat
              sessionState={sessionState}
              onSendMessage={handleSendMessage}
              onRegenerateMessage={handleRegenerateMessage}
            />
          </Resizable>

          {/* Workspace Area - Right side */}
          <div className="flex-1 flex overflow-hidden">
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
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Main content area */}
              <div className="flex-1 overflow-hidden">
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