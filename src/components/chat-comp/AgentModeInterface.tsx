"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import CodeEditor from '@/components/agent-comp/CodeEditor';
import CodePreview from '@/components/agent-comp/CodePreview';
import FileExplorer from '@/components/agent-comp/FileExplorer';
import AgentInput from '@/components/agent-comp/AgentInput';
import AgentMessage from '@/components/agent-comp/AgentMessage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Resizable } from 're-resizable';
import { FiCode, FiEye, FiFolder, FiMessageSquare, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ChatMessage } from "@/lib/types/chat";
import { Tooltip } from 'react-tooltip';

interface AgentModeInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<any>;
  onRegenerateMessage?: () => Promise<any>;
  isLoading?: boolean;
}

const AgentModeInterface: React.FC<AgentModeInterfaceProps> = ({
  messages,
  onSendMessage,
  onRegenerateMessage,
  isLoading = false
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'files' | 'editor' | 'preview'>('editor');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{name: string, content: string, language: string} | null>(null);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  
  // This must match the initial server render state to avoid hydration errors
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Initialize client-side state after hydration is complete
  useEffect(() => {
    setIsClient(true);
    setLocalMessages(messages || []);
    // Delay sidebar opening to avoid hydration mismatch
    const timer = setTimeout(() => {
      setSidebarOpen(true);
    }, 0);
    return () => clearTimeout(timer);
  }, [messages]);
  
  // Sample project for demo
  const [projectId] = useState('demo-project');
  const [conversationId] = useState('demo-session');
  
  // Handle message sent from agent input
  const handleMessageSent = async (message: string) => {
    try {
      setIsProcessing(true);
      await onSendMessage(message);
    } catch (error) {
      toast.error('Failed to process your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle file selection from file explorer
  const handleFileSelect = (file: {name: string, content: string, language: string}) => {
    setSelectedFile(file);
    setActiveTab('editor');
  };
  
  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    const newSidebarState = !sidebarOpen;
    setSidebarOpen(newSidebarState);
    
    // When sidebar is closed, automatically enter fullscreen mode
    // When sidebar is opened, exit fullscreen mode
    setFullscreenMode(!newSidebarState);
    
    // Only show toast on client side
    if (isClient) {
      // Show appropriate toast message
      if (!newSidebarState) {
        toast.success(
          "Entered fullscreen mode", 
          { icon: '🔎' }
        );
      } else {
        toast.success(
          "Exited fullscreen mode", 
          { icon: '🔍' }
        );
      }
    }
  }, [sidebarOpen, isClient]);
  
  // Use combined messages from props and local state
  const displayMessages = isClient ? (messages.length > localMessages.length ? messages : localMessages) : [];
  
  // Add keyboard shortcut for fullscreen mode - Only on client side
  useEffect(() => {
    if (!isClient) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle fullscreen with F11 key or Escape key to exit
      if (e.key === 'F11') {
        e.preventDefault(); // Prevent default browser fullscreen
        toggleSidebar();
      } else if (e.key === 'Escape' && fullscreenMode) {
        toggleSidebar();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenMode, toggleSidebar, isClient]);
  
  // Add/remove body class for fullscreen mode - Only on client side
  useEffect(() => {
    if (!isClient) return;
    
    // Add a class to the body for additional styling when in fullscreen mode
    if (fullscreenMode) {
      document.body.classList.add('agent-fullscreen-mode');
    } else {
      document.body.classList.remove('agent-fullscreen-mode');
    }
    
    // Cleanup when component unmounts
    return () => {
      document.body.classList.remove('agent-fullscreen-mode');
    };
  }, [fullscreenMode, isClient]);
  
  // This is the initial server-rendered state
  // Must have EXACTLY the same className as the client-rendered version
  if (!isClient) {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden pt-2">
        <div className="flex flex-1 overflow-hidden relative">
          <div className="flex-1 flex flex-col overflow-hidden transition-all duration-500">
            <Tabs defaultValue="editor" className="w-full h-full flex flex-col">
              <TabsList className="w-full flex justify-start border-b border-gray-200 dark:border-gray-700">
                <TabsTrigger value="editor" className="flex items-center gap-1 py-2">
                  <FiCode size={14} />
                  <span>Editor</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="flex items-center gap-1 py-2">
                  <FiEye size={14} />
                  <span>Preview</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="editor" className="flex-1 overflow-hidden p-0">
                <div className="w-full h-full"></div>
              </TabsContent>
              <TabsContent value="preview" className="flex-1 overflow-auto p-0">
                <div className="w-full h-full"></div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="h-[40px]"></div>
        </div>
      </div>
    );
  }
  
  // Full component rendered on client only after hydration
  return (
    <div className="flex flex-col h-full w-full overflow-hidden pt-2">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left sidebar with file explorer - Hide when in fullscreen mode */}
        {!fullscreenMode && (
          <Resizable
            enable={{ right: true }}
            defaultSize={{ width: sidebarOpen ? '300px' : '0px', height: '100%' }}
            minWidth={sidebarOpen ? '250px' : '0px'}
            maxWidth="500px"
            className={`border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
              sidebarOpen ? 'flex flex-col' : 'w-0 overflow-hidden'
            }`}
          >
            {sidebarOpen && (
              <Tabs defaultValue="messages" className="w-full h-full">
                <TabsList className="w-full flex justify-around border-b border-gray-200 dark:border-gray-700">
                  <TabsTrigger value="messages" className="flex items-center gap-1 py-2">
                    <FiMessageSquare size={14} />
                    <span>Messages</span>
                  </TabsTrigger>
                  <TabsTrigger value="files" className="flex items-center gap-1 py-2">
                    <FiFolder size={14} />
                    <span>Files</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="messages" className="flex-1 overflow-auto p-2 custom-scrollbar">
                  <div className={`h-full overflow-y-auto p-4 ${theme === 'dark' ? 'bg-gray-900/50' : 'bg-white'} rounded-md`}>
                    {displayMessages.length > 0 ? (
                      displayMessages.map((msg, index) => (
                        <AgentMessage 
                          key={msg.id || index} 
                          content={msg.content}
                          isUser={msg.role === 'user'}
                          isLatestMessage={index === displayMessages.length - 1}
                        />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-4">
                        <FiMessageSquare size={32} className="mb-2 opacity-50" />
                        <p>No messages yet. Start a conversation with the agent!</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="files" className="flex-1 overflow-auto p-0 custom-scrollbar">
                  <FileExplorer onFileSelect={handleFileSelect} />
                </TabsContent>
              </Tabs>
            )}
          </Resizable>
        )}
        
        {/* Toggle sidebar button - Only show when client-side */}
        {isClient && (
          <button 
            onClick={toggleSidebar}
            data-tooltip-id="sidebar-tooltip"
            data-tooltip-content={sidebarOpen ? "Hide sidebar (enter fullscreen)" : "Show sidebar (exit fullscreen)"}
            className={`absolute left-0 top-1/2 transform -translate-y-1/2 
              ${fullscreenMode 
                ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'} 
              p-1.5 rounded-r-md border border-l-0 
              ${fullscreenMode 
                ? 'border-purple-600 dark:border-purple-800 shadow-md' 
                : 'border-gray-200 dark:border-gray-700'} 
              z-10 transition-all duration-300 hover:scale-105`}
          >
            {sidebarOpen ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
          </button>
        )}
        
        {isClient && <Tooltip id="sidebar-tooltip" place="right" />}
        
        {/* Main content area with tabs */}
        <div className="flex-1 flex flex-col overflow-hidden transition-all duration-500">
          <Tabs defaultValue="editor" className="w-full h-full flex flex-col" onValueChange={(value) => {
            if (value === 'editor' || value === 'preview') {
              setActiveTab(value as any);
            }
          }}>
            <TabsList className="w-full flex justify-start border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
              <TabsTrigger value="editor" className="flex items-center gap-1 py-2 relative">
                <FiCode size={14} />
                <span>Editor</span>
                {activeTab === 'editor' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></span>
                )}
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-1 py-2 relative">
                <FiEye size={14} />
                <span>Preview</span>
                {activeTab === 'preview' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="flex-1 overflow-hidden p-0 vscode-editor-tab">
              {isClient && selectedFile ? (
                <CodeEditor 
                  code={selectedFile.content} 
                  language={selectedFile.language}
                  fileName={selectedFile.name}
                  showLineNumbers={true}
                  onChange={(newCode) => {
                    if (selectedFile) {
                      setSelectedFile({
                        ...selectedFile,
                        content: newCode
                      });
                    }
                  }}
                  theme={theme === 'dark' ? 'dark' : 'light'}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 p-4 text-center">
                  <div>
                    <FiCode size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Select a file from the file explorer to start editing</p>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 overflow-auto p-0 vscode-preview-tab">
              {isClient && selectedFile ? (
                <CodePreview 
                  code={selectedFile.content} 
                  language={selectedFile.language}
                  fileName={selectedFile.name} 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 p-4 text-center">
                  <div>
                    <FiEye size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Select a file from the file explorer to preview it</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {isClient ? (
          <AgentInput 
            onSendMessage={handleMessageSent} 
            disabled={isProcessing || isLoading} 
            onRegenerateMessage={onRegenerateMessage}
            showRegenerateButton={!!onRegenerateMessage && !!displayMessages.length && displayMessages[displayMessages.length - 1]?.role !== 'user'}
          />
        ) : (
          <div className="h-[40px]"></div>
        )}
      </div>
      
      {/* Add VS Code-like styling for consistency between tabs */}
      <style jsx global>{`
        .vscode-editor-tab,
        .vscode-preview-tab {
          background-color: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'};
        }
        
        /* Consistent styling for tabs */
        .tabs-list {
          background-color: ${theme === 'dark' ? '#252526' : '#f3f3f3'};
          border-bottom: 1px solid ${theme === 'dark' ? '#1e1e1e' : '#e4e4e4'};
        }
        
        /* Active tab indicator */
        [data-state="active"] {
          position: relative;
          background-color: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'} !important;
          color: ${theme === 'dark' ? '#ffffff' : '#000000'} !important;
          border-bottom: none !important;
        }
        
        [data-state="active"]::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background-color: ${theme === 'dark' ? '#007acc' : '#007acc'};
        }
        
        /* Consistent code font across components */
        pre, code, .monaco-editor, .monaco-editor .mtk1 {
          font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace !important;
        }
        
        /* Token coloring in Monaco - this enhances the syntax color intensity */
        .monaco-editor .mtk8 {
          color: ${theme === 'dark' ? '#CE9178' : '#a31515'} !important; /* strings */
        }
        
        .monaco-editor .mtk5 {
          color: ${theme === 'dark' ? '#569cd6' : '#0000ff'} !important; /* keywords */
        }
        
        .monaco-editor .mtk7 {
          color: ${theme === 'dark' ? '#9cdcfe' : '#001080'} !important; /* variables */
        }
        
        .monaco-editor .mtk10 {
          color: ${theme === 'dark' ? '#dcdcaa' : '#795e26'} !important; /* functions */
        }
        
        .monaco-editor .mtk1 {
          color: ${theme === 'dark' ? '#d4d4d4' : '#000000'} !important; /* text */
        }
        
        .monaco-editor .mtk6 {
          color: ${theme === 'dark' ? '#4ec9b0' : '#267f99'} !important; /* classes/types */
        }
        
        .monaco-editor .mtk12 {
          color: ${theme === 'dark' ? '#9cdcfe' : '#ff0000'} !important; /* attributes */
        }
        
        .monaco-editor .mtk20,
        .monaco-editor .mtk4 {
          color: ${theme === 'dark' ? '#c586c0' : '#af00db'} !important; /* control flow */
        }
        
        .monaco-editor .mtk2 {
          color: ${theme === 'dark' ? '#808080' : '#708080'} !important; /* punctuation */
        }
        
        .monaco-editor .mtk3 {
          color: ${theme === 'dark' ? '#6a9955' : '#008000'} !important; /* comments */
          font-style: italic;
        }
        
        /* Force Monaco not to use italics for some tokens by default */
        .monaco-editor .mtki {
          font-style: normal !important;
        }
        
        /* Exception for comments which should be italic */
        .monaco-editor .mtk3.mtki {
          font-style: italic !important;
        }
        
        /* VS Code-like scrollbars for all code blocks */
        .vscode-editor-tab ::-webkit-scrollbar,
        .vscode-preview-tab ::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }
        
        .vscode-editor-tab ::-webkit-scrollbar-track,
        .vscode-preview-tab ::-webkit-scrollbar-track {
          background: ${theme === 'dark' ? '#1e1e1e' : '#f3f3f3'};
        }
        
        .vscode-editor-tab ::-webkit-scrollbar-thumb,
        .vscode-preview-tab ::-webkit-scrollbar-thumb {
          background: ${theme === 'dark' ? '#424242' : '#c1c1c1'};
          border-radius: 3px;
          border: 4px solid transparent;
          background-clip: padding-box;
        }
        
        .vscode-editor-tab ::-webkit-scrollbar-thumb:hover,
        .vscode-preview-tab ::-webkit-scrollbar-thumb:hover {
          background: ${theme === 'dark' ? '#4f4f4f' : '#a9a9a9'};
          border: 4px solid transparent;
          background-clip: padding-box;
        }
        
        /* Make sure editor has the typical VS Code appearance */
        .monaco-editor-background {
          background-color: ${theme === 'dark' ? '#1e1e1e' : '#ffffff'} !important;
        }
        
        /* Adjust Monaco's editor height to fill available space */
        .monaco-editor, 
        .monaco-editor .overflow-guard {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
};

export default AgentModeInterface; 