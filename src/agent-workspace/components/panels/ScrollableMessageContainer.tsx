import React, { useRef, useEffect, useState } from 'react';
import { User, Bot, Code, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import MessageContent from './MessageContent';
import { AgentMessage, CodeBlock } from '../../types';

interface ScrollableMessageContainerProps {
  messages: AgentMessage[];
  isDark: boolean;
  isMobile?: boolean;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateExample?: string;   
  onExampleClick?: (example: string) => void;
  maxHeight?: string;
  currentResponse?: string | null;
  isTyping?: boolean;
  currentThinking?: string | null;
}

const ScrollableMessageContainer: React.FC<ScrollableMessageContainerProps> = ({
  messages,
  isDark,
  isMobile = false,
  emptyStateTitle = 'WordPress AI Assistant',
  emptyStateDescription = 'I can help you build, customize, and debug WordPress plugins and themes. Ask me anything about WordPress development!',
  emptyStateExample,
  onExampleClick,
  maxHeight = '100%',
  currentResponse = null,
  isTyping = false,
  currentThinking = null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userScroll, setUserScroll] = useState(false);
  const [justScrolled, setJustScrolled] = useState(false);
  const [expandedThinkingIds, setExpandedThinkingIds] = useState<Record<string, boolean>>({});
  
  // Filter out system messages for display
  const displayMessages = messages.filter(msg => msg.role !== 'system');
  
  // Force scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  // Handle scroll events to detect manual scrolling
  const handleScroll = () => {
    if (justScrolled) return;
    
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      // Using a smaller threshold of 20 pixels to ensure we detect when very close to bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight <= 20;
      setUserScroll(!isNearBottom);
    }
  };

  // Auto-scroll on message changes or streaming content
  useEffect(() => {
    const shouldAutoScroll = !userScroll && !justScrolled;
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, userScroll, justScrolled, currentResponse]);

  // Reset the justScrolled flag after a delay
  useEffect(() => {
    if (justScrolled) {
      const timer = setTimeout(() => setJustScrolled(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [justScrolled]);

  // Listen for the thinking-completed event
  useEffect(() => {
    const handleThinkingCompleted = (event: CustomEvent) => {
      const { messageId } = event.detail;
      
      if (messageId && expandedThinkingIds[messageId]) {
        // Keep thinking expanded instead of auto-collapsing
        // Remove this auto-collapse behavior to fix the issue
      }
    };
    
    // Add event listener
    window.addEventListener('thinking-completed', handleThinkingCompleted as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('thinking-completed', handleThinkingCompleted as EventListener);
    };
  }, [expandedThinkingIds]);

  // Group messages into conversation pairs
  const groupConversations = () => {
    const groups: { user: AgentMessage, ai: AgentMessage | null, isLatest: boolean }[] = [];
    
    for (let i = 0; i < displayMessages.length; i++) {
      if (displayMessages[i].role === 'user') {
        // Find AI response that follows
        const aiResponse = (i + 1 < displayMessages.length && displayMessages[i + 1].role === 'assistant') 
          ? displayMessages[i + 1] 
          : null;
        
        // Check if this is the latest conversation
        const isLatest = i === displayMessages.length - 1 || 
                        (aiResponse !== null && i + 1 === displayMessages.length - 1);
        
        // If this is the latest message and we have currentThinking, add it to the AI response
        if (isLatest && aiResponse && currentThinking) {
          aiResponse.thinking = currentThinking;
        }
        
        groups.push({
          user: displayMessages[i],
          ai: aiResponse,
          isLatest
        });
        
        // Skip the AI message in next iteration if it exists
        if (aiResponse) i++;
      }
    }
    
    return groups;
  };

  const conversationGroups = groupConversations();
  const hasCurrentResponse = currentResponse !== null && 
                         messages.length > 0 && 
                         messages[messages.length - 1].role === 'user';

  // Toggle thinking section expansion
  const toggleThinkingExpansion = (id: string) => {
    setExpandedThinkingIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
    
    // After toggling, ensure scrolling is updated
    setTimeout(() => {
      if (containerRef.current) {
        const expandedThinking = containerRef.current.querySelector(`[data-thinking-id="${id}"][data-thinking-expanded="true"]`);
        if (expandedThinking) {
          expandedThinking.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    }, 100);
  };

  return (
    <div 
      ref={containerRef}
      className={`overflow-y-auto p-3 sm:p-5 ${
        isDark ? 'bg-gray-950' : 'bg-gray-50'
      } custom-scrollbar-improved`}
      style={{ 
        height: maxHeight,
        maxHeight: maxHeight,
        flex: '1 1 0%',
        minHeight: '0',
        overflowY: 'auto',
        overflowX: 'hidden' // Prevent horizontal overflow
      }}
      onScroll={handleScroll}
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center max-w-md px-2 sm:px-4 py-6">
            <h3 className={`text-base sm:text-lg font-medium ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {emptyStateTitle}
            </h3>
            <p className={`mt-2 text-xs sm:text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {emptyStateDescription}
            </p>
            {emptyStateExample && (
              <div className={`mt-4 sm:mt-5 p-3 sm:p-4 rounded-xl ${
                isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
              } shadow-sm transition-colors duration-200 cursor-pointer`}
                onClick={() => onExampleClick && onExampleClick(emptyStateExample)}
              >
                <p className="text-xs sm:text-sm font-medium mb-1">Try asking:</p>
                <p className="text-xs sm:text-sm italic">{emptyStateExample}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-5 w-full">
          {conversationGroups.map((group, index) => (
            <div 
              key={group.user.id}
              className={`message-block ${group.isLatest ? 'current-block' : 'completed-block'}`}
            >
              <div className="block-content">
                {/* User message */}
                <div className="flex justify-end">
                  <div className={`max-w-[95%] sm:max-w-[85%] ${
                    isDark
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                  } rounded-xl p-3 sm:p-4 shadow-sm overflow-hidden break-words`}>
                    {/* Message header */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-blue-500`}>
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-xs font-medium">You</span>
                      <span className="text-xs opacity-70 ml-auto">
                        {formatDistanceToNow(new Date(group.user.timestamp instanceof Date ? group.user.timestamp : new Date(group.user.timestamp)), { addSuffix: true })}
                      </span>
                    </div>
                    
                    {/* Message content */}
                    <div className={`prose prose-sm max-w-none overflow-hidden prose-invert ${isMobile ? 'text-sm leading-snug' : ''}`}>
                      <MessageContent 
                        content={group.user.content}
                        isComplete={true}
                      />
                    </div>
                  </div>
                </div>
                
                {/* AI message or streaming response */}
                {group.ai ? (
                  <div className="flex justify-start mt-4">
                    <div className={`max-w-[95%] sm:max-w-[85%] ${
                      isDark
                        ? 'bg-gray-800 text-gray-200'
                        : 'bg-white text-gray-800'
                    } rounded-xl p-3 sm:p-4 shadow-sm overflow-hidden break-words`}>
                      {/* Message header */}
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isDark ? 'bg-gray-700' : 'bg-gray-100'
                        }`}>
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium">WordPress Assistant</span>
                        <span className="text-xs opacity-70 ml-auto">
                          {formatDistanceToNow(new Date(group.ai.timestamp instanceof Date ? group.ai.timestamp : new Date(group.ai.timestamp)), { addSuffix: true })}
                        </span>
                      </div>
                      
                      {/* Display thinking content if available - Moved to appear before message content */}
                      {group.ai && group.ai.thinking && group.ai.thinking.trim().length > 0 && (
                        <div 
                          className={`mb-3 p-3 rounded-lg border transition-all duration-300 ${
                            isDark ? 'bg-indigo-900/20 border-indigo-800/30 text-gray-300' : 'bg-indigo-50 border-indigo-200 text-gray-700'
                          }`}
                          data-message-id={group.ai.id}
                          data-thinking-id={group.ai.id}
                          data-thinking-expanded={expandedThinkingIds[group.ai.id] ? 'true' : 'false'}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4 text-indigo-500" />
                              <span className="text-xs font-medium">Thinking Process</span>
                            </div>
                            <button 
                              onClick={() => group.ai && toggleThinkingExpansion(group.ai.id)}
                              className="p-1 rounded-full hover:bg-gray-700/30 dark:hover:bg-gray-700 transition-colors"
                              aria-label={group.ai && expandedThinkingIds[group.ai.id] ? "Collapse thinking process" : "Expand thinking process"}
                            >
                              {group.ai && expandedThinkingIds[group.ai.id] ? (
                                <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              )}
                            </button>
                          </div>
                          
                          <div 
                            className={`text-xs whitespace-pre-wrap font-mono overflow-auto transition-all duration-300 ${
                              group.ai && expandedThinkingIds[group.ai.id] 
                                ? 'thinking-expanded max-h-[500vh]' 
                                : 'thinking-collapsed max-h-20 overflow-hidden relative'
                            } custom-scrollbar-improved bg-indigo-50/20 dark:bg-indigo-900/10 p-2 rounded`}
                            style={{ 
                              // Ensure no text truncation within the container
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              // Add additional styles when expanded
                              ...(group.ai && expandedThinkingIds[group.ai.id] 
                                ? { maxHeight: '10000px', overflowY: 'auto' } 
                                : {})
                            }}
                          >
                            {group.ai.thinking}
                            {group.ai && !expandedThinkingIds[group.ai.id] && (
                              <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${
                                isDark ? 'from-indigo-900/30 to-transparent' : 'from-indigo-50 to-transparent'
                              }`}></div>
                            )}
                          </div>
                          
                          {group.ai && !expandedThinkingIds[group.ai.id] && (
                            <button 
                              onClick={() => group.ai && toggleThinkingExpansion(group.ai.id)}
                              className={`thinking-toggle text-xs w-full mt-1 py-2 text-center rounded ${
                                isDark 
                                  ? 'text-indigo-300 bg-indigo-900/30 hover:bg-indigo-800/40' 
                                  : 'text-indigo-700 bg-indigo-100/60 hover:bg-indigo-200'
                              } font-medium flex items-center justify-center gap-1 transition-colors`}
                            >
                              <span>Show full thinking process</span>
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Message content - Moved after thinking process */}
                      <div className={`prose prose-sm max-w-none overflow-hidden ${
                        isDark ? 'prose-invert' : 'prose-gray'
                      } ${isMobile ? 'text-sm leading-snug' : ''}`}>
                        <MessageContent 
                          content={group.ai.content}
                          isComplete={true}
                        />
                      </div>
                      
                      {/* Code blocks attached to the message */}
                      {group.ai.codeBlocks && group.ai.codeBlocks.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {group.ai.codeBlocks.map((block) => (
                            <div 
                              key={block.id}
                              className={`rounded-lg overflow-hidden ${
                                isDark ? 'bg-gray-800' : 'bg-gray-100'
                              }`}
                            >
                              <div className={`flex items-center justify-between px-4 py-2 text-xs ${
                                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                              }`}>
                                <span className="font-medium">{block.language || 'code'}</span>
                                <button className="hover:text-blue-500 p-1 rounded-md hover:bg-opacity-20 hover:bg-gray-500" title="Copy code">
                                  <Code className="w-4 h-4" />
                                </button>
                              </div>
                              <pre className="p-3 sm:p-4 text-xs sm:text-sm overflow-x-auto custom-scrollbar-improved">
                                <code className={`language-${block.language}`}>
                                  {block.code}
                                </code>
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Show streaming AI response if this is the latest conversation and we have text to stream
                  group.isLatest && hasCurrentResponse && (
                    <div className="flex justify-start mt-4">
                      <div className={`max-w-[95%] sm:max-w-[85%] ${
                        isDark
                          ? 'bg-gray-800 text-gray-200'
                          : 'bg-white text-gray-800'
                      } rounded-xl p-3 sm:p-4 shadow-sm overflow-hidden break-words`}>
                        {/* Message header */}
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isDark ? 'bg-gray-700' : 'bg-gray-100'
                          }`}>
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-medium">WordPress Assistant</span>
                          <span className="text-xs opacity-70 ml-auto">
                            {formatDistanceToNow(new Date(), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Show loader for streaming response inside the container */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          <span className="text-xs text-blue-500 font-medium">Generating response...</span>
                        </div>
                        
                        {/* Display thinking content if available for streaming response */}
                        {isTyping && (
                          <div 
                            className={`mb-3 p-3 rounded-lg border transition-all duration-300 ${
                              isDark ? 'bg-indigo-900/20 border-indigo-800/30 text-gray-300' : 'bg-indigo-50 border-indigo-200 text-gray-700'
                            }`}
                            data-thinking-id="streaming"
                            data-thinking-expanded={expandedThinkingIds['streaming'] ? 'true' : 'false'}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-indigo-500" />
                                <span className="text-xs font-medium">Thinking Process</span>
                              </div>
                              {currentThinking && (
                                <button 
                                  onClick={() => toggleThinkingExpansion('streaming')}
                                  className="p-1 rounded-full hover:bg-gray-700/30 dark:hover:bg-gray-700 transition-colors"
                                  aria-label={expandedThinkingIds['streaming'] ? "Collapse thinking process" : "Expand thinking process"}
                                >
                                  {expandedThinkingIds['streaming'] ? (
                                    <ChevronUp className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                  )}
                                </button>
                              )}
                            </div>
                            
                            <div 
                              className={`text-xs whitespace-pre-wrap font-mono overflow-auto transition-all duration-300 ${
                                expandedThinkingIds['streaming'] || !currentThinking
                                  ? 'thinking-expanded max-h-[500vh]' 
                                  : 'thinking-collapsed max-h-20 overflow-hidden relative'
                              } custom-scrollbar-improved bg-indigo-50/20 dark:bg-indigo-900/10 p-2 rounded`}
                              style={{ 
                                // Ensure no text truncation within the container
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                // Add additional styles when expanded
                                ...(expandedThinkingIds['streaming'] 
                                  ? { maxHeight: '10000px', overflowY: 'auto' } 
                                  : {})
                              }}
                            >
                              {currentThinking ? (
                                <>
                                  {currentThinking}
                                  {!expandedThinkingIds['streaming'] && (
                                    <div className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${
                                      isDark ? 'from-indigo-900/30 to-transparent' : 'from-indigo-50 to-transparent'
                                    }`}></div>
                                  )}
                                </>
                              ) : (
                                <span className="inline-block">
                                  Analyzing your request...
                                  <span className="animate-pulse">▌</span>
                                </span>
                              )}
                            </div>
                            
                            {currentThinking && !expandedThinkingIds['streaming'] && (
                              <button 
                                onClick={() => toggleThinkingExpansion('streaming')}
                                className={`thinking-toggle text-xs w-full mt-1 py-2 text-center rounded ${
                                  isDark 
                                    ? 'text-indigo-300 bg-indigo-900/30 hover:bg-indigo-800/40' 
                                    : 'text-indigo-700 bg-indigo-100/60 hover:bg-indigo-200'
                                } font-medium flex items-center justify-center gap-1 transition-colors`}
                              >
                                <span>Show full thinking process</span>
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                        
                        {/* Message content */}
                        <div className={`prose prose-sm max-w-none overflow-hidden ${
                          isDark ? 'prose-invert' : 'prose-gray'
                        } ${isMobile ? 'text-sm leading-snug' : ''}`}>
                          <MessageContent 
                            content={currentResponse || ''}
                            isStreaming={true}
                            isComplete={false}
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} className="h-4" /> {/* Extra space to ensure scrolling works properly */}
        </div>
      )}
      
      <style jsx>{`
        .message-block {
          display: flex;
          flex-direction: column;
          width: 100%;
          background-color: transparent;
          padding: 5px 0;
          border-radius: 0;
          margin-bottom: 10px;
        }
        
        .block-content {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          justify-content: flex-start;
        }
        
        .completed-block {
          min-height: auto;
          height: auto;
        }
        
        .current-block {
          /* Maintain proper height for latest conversation block */
          min-height: 60vh;
          display: flex;
          flex-direction: column;
        }
        
        .current-block .block-content {
          align-items: stretch;
          justify-content: flex-start;
          flex-grow: 1;
        }
        
        /* Fix for expanded thinking process to ensure it shows full content */
        .thinking-expanded {
          max-height: 10000px !important; /* Very large value to ensure all content is shown */
          overflow-y: auto !important;
          height: auto !important;
          transition: max-height 0.5s ease-in-out;
        }
        
        .thinking-collapsed {
          transition: max-height 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ScrollableMessageContainer; 