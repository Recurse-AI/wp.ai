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
import { ChatMessage } from "@/lib/types/chat";

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
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(messages || []);
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
    <div className="flex flex-col h-full w-full overflow-hidden pt-2">
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left sidebar with file explorer */}
        <Resizable
          enable={{ right: true }}
          defaultSize={{ width: sidebarOpen ? '250px' : '0px', height: '100%' }}
          minWidth={sidebarOpen ? '200px' : '0px'}
          maxWidth="400px"
          className={`border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
            sidebarOpen ? 'flex flex-col' : 'w-0 overflow-hidden'
          }`}
        >
          {sidebarOpen && (
            <Tabs defaultValue="files" className="w-full h-full">
              <TabsList className="w-full flex justify-around border-b border-gray-200 dark:border-gray-700">
                <TabsTrigger value="files" className="flex items-center gap-1 py-2">
                  <FiFolder size={14} />
                  <span>Files</span>
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center gap-1 py-2">
                  <FiMessageSquare size={14} />
                  <span>Messages</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="files" className="flex-1 overflow-auto p-0 custom-scrollbar">
                <FileExplorer onFileSelect={handleFileSelect} />
              </TabsContent>
              
              <TabsContent value="messages" className="flex-1 overflow-auto p-2 custom-scrollbar">
                <div className={`h-full overflow-y-auto p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="mt-4 text-gray-500">Loading your conversation...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg, index) => (
                      <AgentMessage 
                        key={msg.id || index} 
                        content={msg.content}
                        isUser={msg.role === 'user'}
                        isLatestMessage={index === messages.length - 1}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>No messages yet. Start a conversation!</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </Resizable>
        
        {/* Toggle sidebar button */}
        <button 
          onClick={toggleSidebar}
          className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-100 dark:bg-gray-800 p-1 rounded-r-md border border-l-0 border-gray-200 dark:border-gray-700 z-10"
        >
          {sidebarOpen ? <FiChevronLeft size={16} /> : <FiChevronRight size={16} />}
        </button>
        
        {/* Main content area with tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
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
              <CodeEditor 
                content={selectedFile?.content || ''}
                language={selectedFile?.language || 'text'}
                fileName={selectedFile?.name || 'untitled.txt'}
                readOnly={false}
              />
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 overflow-auto p-0 custom-scrollbar">
              <CodePreview 
                content={selectedFile?.content || ''}
                language={selectedFile?.language || 'text'}
                fileName={selectedFile?.name || 'untitled.txt'}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Input area at bottom */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <AgentInput 
          sessionId={sessionId}
          projectId={projectId}
          onMessageSent={handleMessageSent}
          isProcessing={isProcessing || isLoading}
          setIsProcessing={setIsProcessing}
        />
      </div>
    </div>
  );
};

export default AgentModeInterface; 