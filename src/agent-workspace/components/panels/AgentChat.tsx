"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { Send } from 'lucide-react';
import { ScrollableMessageContainer } from './ScrollableMessageContainer';
import { toast } from 'react-hot-toast';
import { FiMessageSquare } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import ProcessingStatusIndicator from './ProcessingStatusIndicator';
import FileOperationNotification from '../notifications/FileOperationNotification';
import { useFileOperations } from '../../context/FileOperationsContext';
import { FaRobot, FaUser, FaSpinner, FaLightbulb } from 'react-icons/fa';
import { websocketService } from '../../utils/websocketService';
import { useWorkspaceState } from '../../context/WorkspaceStateManager';

// Extend the ReactMarkdown types to include inline property
declare module 'react-markdown' {
  interface CodeProps {
    inline?: boolean;
  }
}

// Simplified props interface now that we're using the workspace state manager
interface AgentChatProps {
  processingFilePath?: string | null;
  hideCodeInMessages?: boolean;
}

const AgentChat: React.FC<AgentChatProps> = ({
  processingFilePath,
  hideCodeInMessages = false
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { operations } = useFileOperations();
  
  // Use the workspace state manager instead of local state
  const { 
    state: sessionState, 
    sendMessage: sendWorkspaceMessage 
  } = useWorkspaceState();
  
  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '0px';
      const maxHeight = isMobile ? 120 : 180;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = newHeight === maxHeight ? 'auto' : 'hidden';
    }
  };
  
  // Readjust textarea when mobile state changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [isMobile, message]);
  
  // Focus input when conversation is empty
  useEffect(() => {
    if (sessionState.messages.length === 0 && textareaRef.current && !isMobile) {
      textareaRef.current.focus();
    }
  }, [sessionState.messages.length, isMobile]);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };
  
  // Handle key press (Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Enhanced send message function
  const handleSendMessage = async () => {
    if (!message.trim() || sessionState.isProcessing || sessionState.streaming.isStreaming) return;
    
    try {
      // Store the message text and clear input field
      const messageText = message;
      setMessage('');
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
      }
      
      // Send message via the workspace state manager
      sendWorkspaceMessage(messageText);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };
  
  // Handle example click from empty state
  const handleExampleClick = (exampleText: string) => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      setMessage(exampleText);
      adjustTextareaHeight();
    }
  };

  // Function to format file paths for display
  const formatFilePath = (path: string) => {
    if (!path) return {
      fullPath: "",
      fileName: "",
      directory: "",
      emoji: "📄 "
    };
    
    const parts = path.split('/');
    const fileName = parts.pop() || "";
    const directory = parts.join('/');
    
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
    const fileEmoji = 
      fileExt === 'php' ? '🐘 ' : 
      fileExt === 'js' ? '⚡ ' : 
      fileExt === 'css' ? '🎨 ' : 
      fileExt === 'html' ? '🌐 ' : 
      fileExt === 'json' ? '📋 ' : 
      '📄 ';
    
    return {
      fullPath: path,
      fileName,
      directory: directory ? directory + '/' : "",
      emoji: fileEmoji
    };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono" style={{ 
      height: '100%', 
      maxHeight: '100vh'
    }}>
      {/* Header */}
      <div className={`px-3 py-2 border-b ${
        isDark ? 'bg-gray-800/70 border-gray-700 text-gray-300' : 'bg-gray-900/90 border-green-800/50 text-green-400'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiMessageSquare className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              WordPress AI Assistant
            </span>
          </div>
          {(sessionState.isProcessing || sessionState.streaming.isStreaming) && (
            <div className="flex items-center text-xs">
              <div className={`w-2 h-2 ${isDark ? 'bg-blue-500' : 'bg-green-500'} rounded-full animate-pulse mr-1`}></div>
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Message Container */}
      <ScrollableMessageContainer
        emptyStateTitle="WordPress AI Assistant"
        emptyStateDescription="I can help you build, customize, and debug WordPress plugins and themes. Just tell me what you need - no need to select tools or options!"
        emptyStateExample="Create a contact form plugin for WordPress"
        onExampleClick={handleExampleClick}
        maxHeight="calc(95vh - 160px)"
        processingIndicator={processingFilePath}
        hideCodeInMessages={hideCodeInMessages}
        className={isDark ? 'bg-gray-900' : 'bg-black text-green-400'}
        isMobile={isMobile}
      />
      
      {/* File processing indicator */}
      {processingFilePath && (
        <div className="px-4 pt-2">
          <ProcessingStatusIndicator processingFilePath={processingFilePath} />
        </div>
      )}
      
      {/* File operations notifications */}
      {operations.length > 0 && (
        <div className="px-4 pt-2">
          <FileOperationNotification operations={operations} />
        </div>
      )}
      
      {/* Input area */}
      <div className={`p-2 sm:p-4 transition-all flex-shrink-0 ${
        isDark ? 'bg-gray-900' : 'bg-black'
      }`}
      style={{ 
        maxHeight: '180px',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,128,0,0.2)'}`
      }}
      >
        <div className={`flex flex-col overflow-hidden ${
          isDark ? 'text-gray-400' : 'text-green-600'
        }`}>
          <div className="text-xs px-2 pb-1">
            {isDark ? '┌─' : '┌─'} Command Input
          </div>
          
          <div className={`flex-1 rounded-md overflow-hidden flex flex-col ${
            isDark ? 'bg-gray-800/70' : 'bg-gray-900'
          } ${sessionState.isProcessing || sessionState.streaming.isStreaming ? 'opacity-60' : ''} focus-within:ring-1 ${
            isDark ? 'focus-within:ring-blue-500/30' : 'focus-within:ring-green-500/30'
          }`}>
            <textarea
              ref={textareaRef}
              rows={2}
              placeholder={
                processingFilePath ? processingFilePath :
                sessionState.isProcessing || sessionState.streaming.isStreaming
                  ? 'Agent is processing...'
                  : 'Type your request here (e.g., "Create a plugin", "Show tools", "Get history")...'
              }
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={sessionState.isProcessing || sessionState.streaming.isStreaming}
              className={`flex-1 p-3 resize-none focus:outline-none ${
                isDark ? 'bg-gray-800/90 text-gray-200' : 'bg-gray-900/90 text-green-400'
              } ${isMobile ? 'text-sm' : ''} custom-scrollbar-improved`}
              style={{ 
                minHeight: '60px',
                height: isMobile ? '60px' : '70px',
                maxHeight: isMobile ? '120px' : '180px'
              }}
            />
            <div className={`flex items-center justify-between px-2 py-1 ${
              isDark ? 'bg-gray-800/90' : 'bg-gray-900/90'
            }`}>
              <div className="flex space-x-1">
                {processingFilePath && (
                  <div className="flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium text-blue-500">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>{processingFilePath}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sessionState.isProcessing || sessionState.streaming.isStreaming}
                className={`px-3 py-1.5 rounded-md ${
                  !message.trim() || sessionState.isProcessing || sessionState.streaming.isStreaming
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark 
                      ? 'bg-blue-700/80 text-white hover:bg-blue-700/90'
                      : 'bg-green-800/80 text-white hover:bg-green-800/90'
                } transition-colors duration-200 flex items-center justify-center`}
              >
                <span className="mr-1.5 font-medium text-sm">Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="text-xs px-2 pt-1">
            {isDark ? '└─' : '└─'} Press Enter to send
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx global>{`
        .custom-scrollbar-improved::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        .custom-scrollbar-improved::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
          margin: 2px;
        }
        
        .custom-scrollbar-improved::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,128,0,0.3)'};
          border-radius: 4px;
        }
        
        .custom-scrollbar-improved::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,128,0,0.5)'};
        }
        
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .agent-chat-cursor::after {
          content: '';
          width: 6px;
          height: 14px;
          background: ${isDark ? '#6ee7b7' : '#4ade80'};
          display: inline-block;
          animation: cursor-blink 1.2s infinite;
          margin-left: 4px;
          vertical-align: middle;
        }
        
        @keyframes message-appear {
          from { opacity: 0.7; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .message-appear {
          animation: message-appear 0.3s ease-out;
        }
        
        .streaming-response-container {
          position: relative;
          animation: fadeInResponse 0.3s ease-out;
          margin-top: 8px;
          margin-bottom: 16px;
        }
        
        @keyframes fadeInResponse {
          from { opacity: 0.6; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AgentChat;