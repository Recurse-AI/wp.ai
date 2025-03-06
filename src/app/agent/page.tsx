"use client";
import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import FileExplorer from '@/components/agent-comp/FileExplorer';
import CodeEditor from '@/components/agent-comp/CodeEditor';
import CodePreview from '@/components/agent-comp/CodePreview';
import AgentInput from '@/components/agent-comp/AgentInput';
import AgentMessage from '@/components/agent-comp/AgentMessage';
import { CodeFile } from '@/lib/services/agentService';
import { createProject, createFile, updateFile, deleteFile } from '@/lib/services/agentService';
import toast from 'react-hot-toast';

// Sample initial file for a new project
const sampleHtmlFile: Omit<CodeFile, 'id' | 'lastModified'> = {
  name: 'index.html',
  path: '',
  content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Project</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to Code Assistant</h1>
    <p>This is a starter template. Ask the AI to help you build something amazing!</p>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
  language: 'html'
};

const sampleCssFile: Omit<CodeFile, 'id' | 'lastModified'> = {
  name: 'styles.css',
  path: '',
  content: `body {
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #333;
}

p {
  color: #666;
}`,
  language: 'css'
};

const sampleJsFile: Omit<CodeFile, 'id' | 'lastModified'> = {
  name: 'script.js',
  path: '',
  content: `// Add your JavaScript code here
console.log('Script loaded!');

// Example function
function greet(name) {
  return 'Hello, ' + name + '!';
}

// Test the function
console.log(greet('Developer'));`,
  language: 'javascript'
};

const AgentPage: React.FC = () => {
  const { theme } = useTheme();
  const [projectId, setProjectId] = useState<string>('demo-project');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [files, setFiles] = useState<CodeFile[]>([
    { ...sampleHtmlFile, id: 'html-1', lastModified: new Date() },
    { ...sampleCssFile, id: 'css-1', lastModified: new Date() },
    { ...sampleJsFile, id: 'js-1', lastModified: new Date() },
  ]);
  const [messages, setMessages] = useState<{
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: Date;
  }[]>([]);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Handle file selection
  const handleFileSelect = (file: CodeFile) => {
    setSelectedFile(file);
    setActiveTab('editor');
  };
  
  // Handle file content update
  const handleFileUpdate = (newContent: string) => {
    if (selectedFile) {
      try {
        // Update file in local state
        const updatedFiles = files.map(file => 
          file.id === selectedFile.id 
            ? { ...file, content: newContent, lastModified: new Date() } 
            : file
        );
        
        setFiles(updatedFiles);
        setSelectedFile({ ...selectedFile, content: newContent, lastModified: new Date() });
        
        // In a real app, we would call the API to update the file
        // updateFile(projectId, selectedFile.id, newContent);
      } catch (error) {
        toast.error('Failed to update file');
        console.error(error);
      }
    }
  };
  
  // Handle file creation
  const handleFileCreate = async (path: string, name: string, isFolder: boolean) => {
    try {
      // In a real implementation, this would call the API
      // For now, we'll just update the local state
      if (!isFolder) {
        const fileExtension = name.split('.').pop()?.toLowerCase() || '';
        let language = 'plaintext';
        let content = '';
        
        // Set default content based on file type
        if (fileExtension === 'html') {
          language = 'html';
          content = '<!DOCTYPE html>\n<html>\n<head>\n  <title>New Page</title>\n</head>\n<body>\n  \n</body>\n</html>';
        } else if (fileExtension === 'css') {
          language = 'css';
          content = '/* Add your styles here */\n\n';
        } else if (fileExtension === 'js') {
          language = 'javascript';
          content = '// Add your JavaScript code here\n\n';
        }
        
        const newFile: CodeFile = {
          id: `file-${Date.now()}`,
          name,
          path,
          content,
          language,
          lastModified: new Date()
        };
        
        setFiles([...files, newFile]);
        setSelectedFile(newFile);
        setActiveTab('editor');
        toast.success(`File ${name} created`);
      } else {
        // Creating a folder is handled in the UI through the file tree structure
        // In a real app, we would call an API to create the folder
        toast.success(`Folder ${name} created`);
      }
    } catch (error) {
      toast.error('Failed to create file');
      console.error(error);
    }
  };
  
  // Handle file deletion
  const handleFileDelete = async (fileId: string) => {
    try {
      // Remove file from local state
      const updatedFiles = files.filter(file => file.id !== fileId);
      setFiles(updatedFiles);
      
      // Clear selected file if it was deleted
      if (selectedFile && selectedFile.id === fileId) {
        setSelectedFile(null);
      }
      
      toast.success('File deleted');
      
      // In a real app, we would call the API to delete the file
      // deleteFile(projectId, fileId);
    } catch (error) {
      toast.error('Failed to delete file');
      console.error(error);
    }
  };
  
  // Handle new messages from the agent
  const handleMessageSent = (userMessage: string, agentResponse: string, codeChanges?: any[]) => {
    // Add user message
    const userMessageObj = {
      id: `user-${Date.now()}`,
      role: 'user' as const,
      content: userMessage,
      timestamp: new Date()
    };
    
    // Add agent response
    const agentMessageObj = {
      id: `agent-${Date.now()}`,
      role: 'agent' as const,
      content: agentResponse,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessageObj, agentMessageObj]);
    
    // Apply code changes if any
    if (codeChanges && codeChanges.length > 0) {
      const updatedFiles = [...files];
      
      codeChanges.forEach(change => {
        if (change.operation === 'create') {
          // Add new file
          const newFile: CodeFile = {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: change.name,
            path: change.path || '',
            content: change.content || '',
            language: change.language || 'plaintext',
            lastModified: new Date()
          };
          
          updatedFiles.push(newFile);
        } else if (change.operation === 'update') {
          // Update existing file
          const fileIndex = updatedFiles.findIndex(f => f.id === change.fileId);
          if (fileIndex !== -1) {
            updatedFiles[fileIndex] = {
              ...updatedFiles[fileIndex],
              content: change.content,
              lastModified: new Date()
            };
          }
        } else if (change.operation === 'delete') {
          // Remove file
          const fileIndex = updatedFiles.findIndex(f => f.id === change.fileId);
          if (fileIndex !== -1) {
            updatedFiles.splice(fileIndex, 1);
          }
        }
      });
      
      setFiles(updatedFiles);
    }
  };
  
  return (
    <div className={`flex flex-col h-screen ${
      theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800'
    }`}>
      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer */}
        <div className="w-64 border-r border-gray-700 h-full overflow-auto">
          <FileExplorer 
            files={files}
            onFileSelect={handleFileSelect}
            onFileCreate={handleFileCreate}
            onFileDelete={handleFileDelete}
            selectedFileId={selectedFile?.id}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Code Editor/Preview Tabs */}
          <div className={`flex border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
          }`}>
            <button 
              className={`px-4 py-2 font-medium ${
                activeTab === 'editor' 
                  ? theme === 'dark' 
                    ? 'bg-gray-800 text-white border-b-2 border-blue-500' 
                    : 'bg-white text-gray-800 border-b-2 border-blue-500'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('editor')}
            >
              Editor
            </button>
            <button 
              className={`px-4 py-2 font-medium ${
                activeTab === 'preview' 
                  ? theme === 'dark' 
                    ? 'bg-gray-800 text-white border-b-2 border-blue-500' 
                    : 'bg-white text-gray-800 border-b-2 border-blue-500'
                  : theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-800'
                    : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
          </div>
          
          {/* Editor/Preview Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'editor' ? (
              selectedFile ? (
                <CodeEditor 
                  content={selectedFile.content}
                  language={selectedFile.language}
                  fileName={selectedFile.name}
                  path={selectedFile.path}
                  onChange={handleFileUpdate}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center p-6">
                    <p className="text-lg mb-2">No file selected</p>
                    <p className="text-sm text-gray-500">Select a file from the file explorer or ask the agent to create a new file.</p>
                  </div>
                </div>
              )
            ) : (
              <CodePreview 
                content={selectedFile?.content}
                language={selectedFile?.language}
                fileName={selectedFile?.name}
              />
            )}
          </div>
        </div>
        
        {/* Agent Chat */}
        <div className={`w-96 border-l ${
          theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-white'
        } flex flex-col h-full`}>
          <div className="p-3 font-medium border-b border-gray-700">Agent Chat</div>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-2">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6">
                  <p className="text-lg mb-2">No messages yet</p>
                  <p className="text-sm text-gray-500">Start by asking the agent to help with your code.</p>
                </div>
              </div>
            ) : (
              messages.map(message => (
                <AgentMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                  animate={message.role === 'agent'}
                />
              ))
            )}
            
            {isProcessing && (
              <AgentMessage
                role="agent"
                content=""
                isProcessing={true}
              />
            )}
          </div>
          
          {/* Agent Input */}
          <div className="p-2 border-t border-gray-700">
            <AgentInput
              sessionId={sessionId}
              projectId={projectId}
              onMessageSent={handleMessageSent}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPage;