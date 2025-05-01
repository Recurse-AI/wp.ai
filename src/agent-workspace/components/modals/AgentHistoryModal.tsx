"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Copy, Search, RefreshCw, MessageSquare, Bot, Clock, History } from 'lucide-react';
import { useTheme } from '@/context/ThemeProvider';
import { agentMessageService } from '@/lib/services/messageService';
import { AgentMessage } from '../../types';

interface AgentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
}

// Group message by session
interface SessionGroup {
  title: string;
  timestamp: Date;
  messages: AgentMessage[];
}

const AgentHistoryModal: React.FC<AgentHistoryModalProps> = ({
  isOpen,
  onClose,
  sessionId
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<AgentMessage[]>([]);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<AgentMessage | null>(null);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Custom scrollbar styles
  const scrollbarStyles = {
    // Base scrollbar container style
    container: `overflow-y-auto ${
      isDark 
        ? 'scrollbar-custom-dark' 
        : 'scrollbar-custom-light'
    }`,
    // Right panel specific with more spacing
    rightPanel: `overflow-y-auto ${
      isDark 
        ? 'scrollbar-custom-dark pr-1' 
        : 'scrollbar-custom-light pr-1'
    }`,
    // For code blocks with horizontal scrolling
    codeBlock: `overflow-x-auto ${
      isDark 
        ? 'scrollbar-custom-dark scrollbar-custom-x-dark' 
        : 'scrollbar-custom-light scrollbar-custom-x-light'
    }`
  };

  // Fetch history when modal opens
  useEffect(() => {
    if (isOpen && sessionId && sessionId !== 'undefined') {
      fetchHistory();
    } else if (isOpen) {
      // If modal is open but no valid sessionId, show empty state
      setHistory([]);
      setSessionGroups([]);
      setSelectedMessage(null);
    }
  }, [isOpen, sessionId]);

  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Group messages by conversation
  useEffect(() => {
    if (history.length > 0) {
      // Simply creating one session for now - showing the first user message as title
      // This can be enhanced to properly group by conversation if that data is available
      const firstUserMessage = history.find(msg => msg.role === 'user');
      const group: SessionGroup = {
        title: firstUserMessage ? firstUserMessage.content.slice(0, 60) : 'Conversation',
        timestamp: new Date(history[0].timestamp),
        messages: history
      };
      
      setSessionGroups([group]);
      
      // Select the first session by default
      if (selectedSessionIndex === null && history.length > 0) {
        setSelectedSessionIndex(0);
        setSelectedMessage(history[0]);
      }
    } else {
      setSessionGroups([]);
    }
  }, [history]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      // Validate sessionId more thoroughly
      if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
        // Just set empty state instead of logging an error
        setHistory([]);
        setSessionGroups([]);
        setSelectedMessage(null);
        setIsLoading(false);
        return;
      }
      
      const response = await agentMessageService.getAgentHistory(sessionId);
      console.log('Agent history response:', response);
      
      if (response.success && response.data) {
        // Handle both API response formats
        if (response.data.messages) {
          // Format messages to match the expected AgentMessage type
          const formattedMessages = response.data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role === 'assistant' ? 'assistant' : msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            codeBlocks: msg.codeBlocks ? msg.codeBlocks.map((block: any) => ({
              id: block.id,
              language: block.language,
              code: block.code
            })) : []
          }));
          
          console.log('Formatted messages:', formattedMessages);
          setHistory(formattedMessages);
        } else {
          // Handle original response format
          setHistory(response.data.messages || []);
        }
      }
    } catch (error) {
      console.error('Error fetching agent history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionSelect = (index: number) => {
    setSelectedSessionIndex(index);
    const session = sessionGroups[index];
    if (session && session.messages.length > 0) {
      setSelectedMessage(session.messages[0]);
    }
  };

  const handleMessageSelect = (message: AgentMessage) => {
    setSelectedMessage(message);
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Filter sessions that contain messages matching the search term
  const filteredSessionGroups = sessionGroups.filter(session => 
    session.messages.some(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50 flex items-center justify-center">
      <div 
        ref={modalRef}
        style={{ width: '1000px', height: '600px' }}
        className={`rounded-lg shadow-xl flex flex-col ${
          isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
        }`}
      >
        {/* Inject custom scrollbar styles */}
        <style jsx global>{`
          .scrollbar-custom-dark::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .scrollbar-custom-dark::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-custom-dark::-webkit-scrollbar-thumb {
            background-color: #4b5563;
            border-radius: 20px;
          }
          .scrollbar-custom-dark::-webkit-scrollbar-thumb:hover {
            background-color: #6b7280;
          }
          .scrollbar-custom-light::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .scrollbar-custom-light::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-custom-light::-webkit-scrollbar-thumb {
            background-color: #d1d5db;
            border-radius: 20px;
          }
          .scrollbar-custom-light::-webkit-scrollbar-thumb:hover {
            background-color: #9ca3af;
          }
          
          /* Custom styles for horizontal scrollbars */
          .scrollbar-custom-x-dark::-webkit-scrollbar {
            height: 6px;
          }
          .scrollbar-custom-x-light::-webkit-scrollbar {
            height: 6px;
          }
        `}</style>

        {/* Modal Header */}
        <div className={`flex justify-between items-center p-3 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className="text-lg font-semibold flex items-center">
            <History className="w-4 h-4 mr-2" />
            Agent History
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchHistory}
              className={`p-1 rounded ${
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
              title="Refresh history"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className={`p-1 rounded ${
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content - Split into three sections */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Session List */}
          <div style={{ width: '250px' }} className={`border-r ${scrollbarStyles.container} ${
            isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            {/* Search Bar */}
            <div className={`p-2 border-b ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className={`flex items-center px-2 py-1 rounded-md ${
                isDark ? 'bg-gray-700' : 'bg-white border border-gray-300'
              }`}>
                <Search className="w-3 h-3 mr-1 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className={`w-full bg-transparent outline-none text-sm ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}
                />
              </div>
            </div>

            {/* Sessions List */}
            <div className="overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-24">
                  <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
                </div>
              ) : filteredSessionGroups.length > 0 ? (
                // Display one session entry
                filteredSessionGroups.map((session, index) => (
                  <div 
                    key={index}
                    onClick={() => handleSessionSelect(index)}
                    className={`p-4 border-b cursor-pointer transition-colors ${
                      selectedSessionIndex === index
                        ? isDark 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-blue-50 border-gray-200'
                        : isDark 
                          ? 'hover:bg-gray-700 border-gray-700' 
                          : 'hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <MessageSquare className="w-4 h-4 mr-2 mt-1 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {session.title.length > 50 
                            ? `${session.title.slice(0, 50)}...` 
                            : session.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(session.timestamp)} • {session.messages.length} messages
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-gray-500">
                  {searchTerm 
                    ? 'No messages matching your search' 
                    : 'No conversation history'}
                </div>
              )}
            </div>
          </div>

          {/* Middle Panel - Message List for Selected Session */}
          <div style={{ width: '400px' }} className={`border-r overflow-x-hidden ${scrollbarStyles.container} ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {selectedSessionIndex !== null ? (
              <>
                {/* Message List Header */}
                <div className={`sticky top-0 p-2 border-b ${
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className="text-sm font-medium">
                    Messages ({sessionGroups[selectedSessionIndex]?.messages.length || 0})
                  </h3>
                </div>
                
                {/* Message List */}
                <div className="overflow-y-auto overflow-x-hidden h-full">
                  {sessionGroups[selectedSessionIndex]?.messages.map((message) => (
                    <div 
                      key={message.id}
                      onClick={() => handleMessageSelect(message)}
                      className={`p-3 border-b cursor-pointer transition-colors ${
                        selectedMessage?.id === message.id
                          ? isDark 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-blue-50 border-gray-200'
                          : isDark 
                            ? 'hover:bg-gray-700 border-gray-700' 
                            : 'hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start">
                        {message.role === 'user' ? (
                          <MessageSquare className="w-3 h-3 mr-1 mt-1 text-blue-500 flex-shrink-0" />
                        ) : (
                          <Bot className="w-3 h-3 mr-1 mt-1 text-green-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-xs ${
                            message.role === 'user' 
                              ? 'text-blue-500' 
                              : 'text-green-500'
                          }`}>
                            {message.role === 'user' ? 'You' : 'Agent'}
                          </div>
                          <p className="text-xs truncate">
                            {message.content.slice(0, 60)}
                            {message.content.length > 60 ? '...' : ''}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500 ml-1 flex-shrink-0">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-sm text-gray-500">Select a session to view messages</p>
              </div>
            )}
          </div>

          {/* Right Panel - Selected Message Detail */}
          <div style={{ width: '350px' }} className={scrollbarStyles.rightPanel}>
            {selectedMessage ? (
              <div className={`p-4 h-full ${scrollbarStyles.rightPanel}`}>
                <div className={`mb-4 flex justify-between items-center`}>
                  <div className="flex items-center">
                    {selectedMessage.role === 'user' ? (
                      <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                    ) : (
                      <Bot className="w-4 h-4 mr-2 text-green-500" />
                    )}
                    <div>
                      <h3 className={`text-sm font-medium ${
                        selectedMessage.role === 'user'
                          ? 'text-blue-500'
                          : 'text-green-500'
                      }`}>
                        {selectedMessage.role === 'user' ? 'You' : 'Agent'}
                      </h3>
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(selectedMessage.timestamp)}
                      </div>
                    </div>
                  </div>
                
                  <button
                    onClick={() => copyToClipboard(selectedMessage.content)}
                    className={`p-1 rounded ${
                      isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    }`}
                    title="Copy message"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                
                {/* Message Content */}
                <div className={`whitespace-pre-wrap text-sm p-3 rounded mb-4 ${scrollbarStyles.rightPanel} max-h-60 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  {selectedMessage.content}
                </div>
                
                {/* Code blocks if available */}
                {selectedMessage.codeBlocks && selectedMessage.codeBlocks.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium mb-2">Code Blocks</h4>
                    {selectedMessage.codeBlocks.map((block, index) => (
                      <div
                        key={block.id || index}
                        className={`mb-3 rounded overflow-hidden ${
                          isDark ? 'bg-gray-800' : 'bg-gray-100'
                        }`}
                      >
                        <div className={`flex justify-between items-center px-2 py-1 ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <span className="text-xs">{block.language}</span>
                          <button
                            onClick={() => copyToClipboard(block.code)}
                            className={`p-1 rounded ${
                              isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-300'
                            }`}
                            title="Copy code"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <pre className={`p-2 text-xs ${scrollbarStyles.codeBlock} ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <code>{block.code}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <Bot className="w-8 h-8 mb-3" />
                  <p className="text-sm text-gray-500">Select a message to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentHistoryModal;
