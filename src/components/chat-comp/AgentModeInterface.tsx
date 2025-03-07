"use client";
import React, { useState } from 'react';
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

interface AgentModeInterfaceProps {
  messages: any[];
  onSendMessage: (message: string) => Promise<any>;
}

const AgentModeInterface: React.FC<AgentModeInterfaceProps> = ({
  messages,
  onSendMessage
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'files' | 'editor' | 'preview'>('editor');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{name: string, content: string, language: string} | null>(null);
  const [localMessages, setLocalMessages] = useState<any[]>(messages || []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Sample project for demo
  const [projectId] = useState('demo-project');
  const [sessionId] = useState('demo-session');
  
  // Handle message sent from agent input
  const handleMessageSent = async (message: string) => {
    try {
      setIsProcessing(true);
      await onSendMessage(message);
    } catch (error) {
      console.error('Error processing message:', error);
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
  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };
  
  // Use combined messages from props and local state
  const displayMessages = messages.length > localMessages.length ? messages : localMessages;
  
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Main content area with resizable panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Messages (conditionally rendered based on sidebarOpen) */}
        {sidebarOpen && (
          <Resizable
            defaultSize={{ width: '40%', height: '100%' }}
            minWidth="30%"
            maxWidth="70%"
            enable={{ right: true }}
            className={`h-full overflow-y-auto border-r ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-y-auto p-4">
                {displayMessages && displayMessages.length > 0 ? (
                  displayMessages.map((msg, index) => (
                    <AgentMessage 
                      key={index}
                      isUser={msg.owner_name === 'You'}
                      content={msg.owner_name === 'You' ? msg.user_prompt : msg.ai_response}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <p>No messages yet. Start a conversation!</p>
                  </div>
                )}
              </div>
              
              {/* Agent input at bottom */}
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <AgentInput
                  sessionId={sessionId}
                  projectId={projectId}
                  onMessageSent={handleMessageSent}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                />
              </div>
            </div>
          </Resizable>
        )}
        
        {/* Toggle sidebar button */}
        <button 
          onClick={toggleSidebar}
          className={`absolute z-10 top-1/2 transform -translate-y-1/2 ${
            sidebarOpen ? 'left-[calc(40%-12px)]' : 'left-2'
          } bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full p-1`}
          aria-label={sidebarOpen ? "Hide chat panel" : "Show chat panel"}
        >
          {sidebarOpen ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
        </button>
        
        {/* Right panel - IDE */}
        <div className={`${sidebarOpen ? 'flex-1' : 'w-full'}`}>
          <Tabs defaultValue="editor" className="w-full h-full flex flex-col">
            <TabsList className="flex justify-start border-b border-gray-200 dark:border-gray-700 px-2">
              <TabsTrigger 
                value="files" 
                onClick={() => setActiveTab('files')}
                className={`flex items-center gap-2 ${activeTab === 'files' ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
              >
                <FiFolder /> Files
              </TabsTrigger>
              <TabsTrigger 
                value="editor" 
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-2 ${activeTab === 'editor' ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
              >
                <FiCode /> Editor
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 ${activeTab === 'preview' ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
              >
                <FiEye /> Preview
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="files" className="flex-1 overflow-hidden">
              <FileExplorer onFileSelect={handleFileSelect} />
            </TabsContent>
            
            <TabsContent value="editor" className="flex-1 overflow-hidden">
              {selectedFile ? (
                <CodeEditor
                  content={selectedFile.content}
                  language={selectedFile.language}
                  fileName={selectedFile.name}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>Select a file from the Files tab to edit</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 overflow-hidden">
              {selectedFile ? (
                <CodePreview
                  content={selectedFile.content}
                  language={selectedFile.language}
                  fileName={selectedFile.name}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <p>Select a file from the Files tab to preview</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AgentModeInterface; 