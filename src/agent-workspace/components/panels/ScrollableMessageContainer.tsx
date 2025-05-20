"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { formatDistanceToNow } from 'date-fns';
import { Bot } from 'lucide-react';
import { useWorkspaceState } from '../../context/WorkspaceStateManager';
import MessageContent from '../message/MessageContent';

interface ScrollableMessageContainerProps {
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateExample?: string;
  onExampleClick?: (exampleText: string) => void;
  maxHeight?: string;
  hideCodeInMessages?: boolean;
  className?: string;
  processingIndicator?: string | null;
  isMobile?: boolean;
}

export const ScrollableMessageContainer: React.FC<ScrollableMessageContainerProps> = ({
  emptyStateTitle = 'WordPress AI Assistant',
  emptyStateDescription = 'I can help you build, customize, and debug WordPress plugins and themes.',
  emptyStateExample = 'Create a contact form plugin for WordPress',
  onExampleClick,
  maxHeight = 'calc(100vh - 160px)',
  hideCodeInMessages = false,
  className = '',
  processingIndicator = null,
  isMobile = false,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedThinkingIds, setExpandedThinkingIds] = useState<Record<string, boolean>>({});
  
  // Get the workspace state from context
  const { state } = useWorkspaceState();
  const { messages, streaming, thinking } = state;

  // Handle auto-scrolling when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, streaming.content, autoScroll]);

  // Handle scroll events to determine auto-scroll state
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const atBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 100;
    setAutoScroll(atBottom);
  };

  // Toggle thinking content expansion
  const toggleThinkingExpansion = (messageId: string) => {
    setExpandedThinkingIds(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  // Render thinking content
  const renderThinking = (messageId: string, content: string, isExpanded: boolean) => {
    return (
      <div className={`mt-2 mb-4 ${isDark ? 'text-gray-400' : 'text-green-300'}`}>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleThinkingExpansion(messageId)}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
            isDark ? 'bg-gray-700' : 'bg-green-900'
          }`}>
            <span className="text-xs">💭</span>
          </div>
          <span className="text-xs font-medium">Thinking Process</span>
          <span className="text-xs">{isExpanded ? '▼' : '►'}</span>
        </div>
        
        {isExpanded && (
          <div className={`mt-2 p-2 rounded text-xs font-mono overflow-auto max-h-48 ${
            isDark ? 'bg-gray-850 text-gray-300' : 'bg-gray-900 text-green-300'
          } custom-scrollbar-improved`}>
            <pre className="whitespace-pre-wrap break-words">{content}</pre>
          </div>
        )}
      </div>
    );
  };

  // Group messages into conversation pairs
  const groupMessages = () => {
    // Filter out standalone AI messages (those without a preceding user message)
    const standaloneAiMessages = messages.filter((msg, index, arr) => {
      if (msg.sender !== 'assistant') return false;
      
      // Check if there's a user message before this one
      const prevIndex = index - 1;
      return prevIndex < 0 || arr[prevIndex].sender !== 'user';
    });
    
    // Create conversation groups (user message + AI response)
    const groups: { 
      user: typeof messages[0], 
      ai?: typeof messages[0], 
      isLatest: boolean 
    }[] = [];
    
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      
      // Skip standalone AI messages as they're handled separately
      if (msg.sender === 'assistant' && (i === 0 || messages[i-1].sender !== 'user')) {
        continue;
      }
      
      // For user messages, try to pair with following AI response
      if (msg.sender === 'user') {
        const nextMsg = i < messages.length - 1 && messages[i+1].sender === 'assistant' 
          ? messages[i+1] 
          : undefined;
          
        // Add the conversation group
        groups.push({
          user: msg,
          ai: nextMsg,
          isLatest: i === messages.length - 1 || 
                   (i === messages.length - 2 && messages[i+1].sender === 'assistant')
        });
        
        // Skip the next message if it was an AI response we just paired
        if (nextMsg) i++;
      }
    }
    
    return { standaloneAiMessages, conversationGroups: groups };
  };
  
  const { standaloneAiMessages, conversationGroups } = groupMessages();

  // Render standalone AI message
  const renderAiMessage = (message: any, isStandalone = false) => {
    return (
      <div className="flex justify-start">
        <div className={`max-w-[95%] sm:max-w-[85%] message-appear ${
          isDark
            ? 'bg-gray-800/50 text-gray-200'
            : 'bg-gray-900/80 text-green-400'
        } rounded-md p-3 sm:p-4 shadow-sm overflow-hidden break-words`}>
          {/* Terminal-style header */}
          <div className={`flex items-center gap-1.5 sm:gap-2 mb-1 text-xs ${
            isDark ? 'text-gray-400' : 'text-green-500'
          }`}>
            {isDark ? '┌─' : '┌─'} {isStandalone ? 'Initial Response' : 'Assistant Response'}
          </div>
        
          {/* Message header */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gray-700' : 'bg-green-900'
            }`}>
              <Bot className={`w-3.5 h-3.5 ${isDark ? '' : 'text-green-400'}`} />
            </div>
            <span className="text-xs font-medium">WordPress Assistant</span>
            <span className="text-xs opacity-70 ml-auto">
              {formatDistanceToNow(new Date(message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)), { addSuffix: true })}
            </span>
          </div>
          
          {/* Display thinking content if available */}
          {message.thinking && message.thinking.trim().length > 0 && 
           renderThinking(message.id, message.thinking, expandedThinkingIds[message.id || ''] || false)
          }
          
          {/* Message content */}
          <div className={`prose prose-sm max-w-none overflow-hidden ${
            isDark ? 'prose-invert' : 'prose-green'
          } ${isMobile ? 'text-sm leading-snug' : ''}`}>
            <MessageContent 
              content={message.content}
              isComplete={true}
              containerRef={containerRef}
              hideCodeInMessages={hideCodeInMessages}
            />
          </div>
          
          {/* Terminal-style footer */}
          <div className={`flex items-center gap-1.5 sm:gap-2 mt-1 text-xs ${
            isDark ? 'text-gray-400' : 'text-green-500'
          }`}>
            {isDark ? '└─' : '└─'} End of response
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`${className || ''} font-mono`}
      style={{ 
        minHeight: '100px', 
        height: maxHeight || 'auto',
        overflow: 'hidden'
      }}
      ref={containerRef}
      onScroll={handleScroll}
    >
      {messages.length === 0 ? (
        <div className={`flex flex-col items-center justify-center h-full text-center px-4 py-10 ${
          isDark ? 'bg-gray-900 text-gray-300' : 'bg-black text-green-400'
        }`}>
          <h3 className={`text-base sm:text-lg font-medium ${
            isDark ? 'text-white' : 'text-green-400'
          }`}>
            {emptyStateTitle}
          </h3>
          <p className={`mt-2 text-xs sm:text-sm ${
            isDark ? 'text-gray-400' : 'text-green-300'
          }`}>
            {emptyStateDescription}
          </p>
          {emptyStateExample && (
            <div className={`mt-4 sm:mt-5 p-3 sm:p-4 rounded-xl ${
              isDark ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' : 'bg-gray-900 hover:bg-gray-800 border border-green-800'
            } shadow-sm transition-colors duration-200 cursor-pointer`}
              onClick={() => onExampleClick && onExampleClick(emptyStateExample)}
            >
              <p className={`text-xs sm:text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-green-400'}`}>Try asking:</p>
              <p className={`text-xs sm:text-sm italic ${isDark ? 'text-gray-400' : 'text-green-300'}`}>{emptyStateExample}</p>
            </div>
          )}
        </div>
      ) : (
        <div className={`space-y-6 pb-4 overflow-y-auto h-full custom-scrollbar-improved ${
          isDark ? 'bg-gray-900' : 'bg-black'
        }`}>
          {/* Render standalone AI messages first */}
          {standaloneAiMessages.length > 0 && (
            <div className="mt-4 space-y-6">
              {standaloneAiMessages.map((message, idx) => (
                <div key={`standalone-${message.id || idx}`} className="message-block">
                  {renderAiMessage(message, true)}
                </div>
              ))}
            </div>
          )}
          
          {/* Then render regular conversation pairs */}
          {conversationGroups.map((group, index) => (
            <div 
              key={`conversation-${group.user.id}-${index}`}
              className={`message-block ${group.isLatest ? 'current-block' : 'completed-block'}`}
            >
              <div className="block-content">
                {/* User message */}
                <div className="flex justify-end">
                  <div className={`max-w-[95%] sm:max-w-[85%] message-appear ${
                    isDark
                      ? 'bg-blue-900/50 text-white'
                      : 'bg-blue-900/50 text-white'
                  } rounded-md p-3 sm:p-4 shadow-sm overflow-hidden break-words`}>
                    {/* Content for user message */}
                    <div className="prose prose-sm max-w-none overflow-hidden prose-invert">
                      <MessageContent 
                        content={group.user.content}
                        isComplete={true}
                        containerRef={containerRef}
                        hideCodeInMessages={hideCodeInMessages}
                      />
                    </div>
                  </div>
                </div>
                
                {/* AI message or streaming response */}
                {group.ai ? (
                  renderAiMessage(group.ai)
                ) : (
                  group.isLatest && streaming.isStreaming && (
                    <div className="flex justify-start mt-4 streaming-response-container">
                      {/* Streaming response content */}
                      <div className={`max-w-[95%] sm:max-w-[85%] message-appear ${
                        isDark
                          ? 'bg-gray-800/50 text-gray-200'
                          : 'bg-gray-900/80 text-green-400'
                      } rounded-md p-3 sm:p-4 shadow-sm overflow-hidden break-words live-response-box`}>
                        <div className={`flex items-center gap-1.5 sm:gap-2 mb-1 text-xs ${
                          isDark ? 'text-gray-400' : 'text-green-500'
                        }`}>
                          {isDark ? '┌─' : '┌─'} Live Response
                        </div>
                        
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isDark ? 'bg-gray-700' : 'bg-green-900'
                          }`}>
                            <Bot className={`w-3.5 h-3.5 ${isDark ? '' : 'text-green-400'}`} />
                          </div>
                          <span className="text-xs font-medium">WordPress Assistant</span>
                          <span className={`text-xs ml-auto flex items-center gap-1 ${
                            isDark ? 'text-blue-400' : 'text-green-400'
                          } animate-pulse`}>
                            <span className="w-2 h-2 bg-current rounded-full"></span>
                            Typing...
                          </span>
                        </div>
                        
                        <div className={`prose prose-sm max-w-none overflow-hidden ${
                          isDark ? 'prose-invert' : 'prose-green'
                        } streaming-content`}>
                          <MessageContent 
                            content={streaming.content}
                            isStreaming={true}
                            isComplete={false}
                            containerRef={containerRef}
                            hideCodeInMessages={hideCodeInMessages}
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} className="h-4 mt-4 clear-both" />
        </div>
      )}
      
      <style jsx>{`
        .message-block {
          display: flex;
          flex-direction: column;
          width: 100%;
          padding: 5px 10px;
          margin-bottom: 10px;
        }
        
        .streaming-response-container {
          position: relative;
          animation: fadeInResponse 0.3s ease-out;
        }
        
        .live-response-box {
          border-left: 3px solid ${isDark ? '#3b82f6' : '#10b981'};
          position: relative;
        }
        
        @keyframes fadeInResponse {
          from { opacity: 0.6; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
        
        .streaming-content {
          position: relative;
        }
        
        /* Improved scrollbar */
        .custom-scrollbar-improved::-webkit-scrollbar {
          width: 6px;
          height: 6px;
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
      `}</style>
    </div>
  );
};