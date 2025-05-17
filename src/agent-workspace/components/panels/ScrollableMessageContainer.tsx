import React, { useRef, useEffect, useState } from 'react';
import { User, Bot, Code, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import MessageContent from './MessageContent';

// Define the correct types locally instead of importing from a file with different definitions
interface AgentMessage {
  id?: string;
  role: string;
  content: string;
  timestamp: Date | string;
  codeBlocks?: any[];
  thinking?: string | null;
  status?: string;
}

interface CodeBlock {
  language: string;
  code: string;
}

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
  processingIndicator?: string | null;
  className?: string;
  hideCodeInMessages?: boolean;
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
  processingIndicator = null,
  className,
  hideCodeInMessages = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userScroll, setUserScroll] = useState(false);
  const [justScrolled, setJustScrolled] = useState(false);
  const [expandedThinkingIds, setExpandedThinkingIds] = useState<Record<string, boolean>>({});
  
  // Filter out system messages for display
  const displayMessages = messages.filter(msg => msg.role !== 'system');
  
  // Identify error messages separately
  const errorMessages = displayMessages.filter(msg => msg.role === 'error');
  const nonErrorMessages = displayMessages.filter(msg => msg.role !== 'error');
  
  // Force scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
    
    // Get the messages container (the div with overflow-y-auto)
    if (containerRef.current) {
      const messagesContainer = containerRef.current.querySelector('.overflow-y-auto');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
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
    // Add a slight delay to ensure DOM has updated
    const scrollTimer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(scrollTimer);
  }, [messages.length, currentResponse, currentThinking]);

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
    const standaloneAiMessages: AgentMessage[] = [];
    
    // First collect any standalone AI messages (not following a user message)
    for (let i = 0; i < nonErrorMessages.length; i++) {
      // Add any leading assistant messages as standalone
      if (i === 0 && nonErrorMessages[i].role === 'assistant') {
        standaloneAiMessages.push(nonErrorMessages[i]);
        continue;
      }
      
      // If we find an assistant message that doesn't follow a user message
      if (nonErrorMessages[i].role === 'assistant' && 
          (i === 0 || nonErrorMessages[i-1].role !== 'user')) {
        standaloneAiMessages.push(nonErrorMessages[i]);
      }
    }
    
    // Then create conversation pairs
    for (let i = 0; i < nonErrorMessages.length; i++) {
      if (nonErrorMessages[i].role === 'user') {
        // Find AI response that follows
        const aiResponse = (i + 1 < nonErrorMessages.length && nonErrorMessages[i + 1].role === 'assistant') 
          ? nonErrorMessages[i + 1] 
          : null;
        
        // Check if this is the latest conversation
        const isLatest = i === nonErrorMessages.length - 1 || 
                        (aiResponse !== null && i + 1 === nonErrorMessages.length - 1);
        
        // If this is the latest message and we have currentThinking, add it to the AI response
        if (isLatest && aiResponse && currentThinking) {
          aiResponse.thinking = currentThinking;
        }
        
        groups.push({
          user: nonErrorMessages[i],
          ai: aiResponse,
          isLatest
        });
        
        // Skip the AI message in next iteration if it exists
        if (aiResponse) i++;
      }
    }
    
    console.log('Message grouping:', { 
      groups: groups.length,
      standalone: standaloneAiMessages.length,
      total: nonErrorMessages.length
    });
    
    return { groups, standaloneAiMessages };
  };

  const { groups: conversationGroups, standaloneAiMessages } = groupConversations();
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

  // Render thinking block
  const renderThinking = (messageId: string | undefined, thinking: string | null, isExpanded: boolean) => {
    if (!thinking || !messageId) return null;
    
    return (
      <div 
        key={`thinking-${messageId}`}
        data-thinking-id={messageId} 
        data-thinking-expanded={isExpanded}
        className={`mt-2 rounded-md overflow-hidden bg-opacity-60 transition-all duration-200 ${
          isDark ? 'bg-gray-800' : 'bg-gray-900/50 text-emerald-300'
        }`}
      >
        <div className="flex items-center gap-1 p-1.5 cursor-pointer" onClick={() => toggleThinkingExpansion(messageId)}>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          <Zap className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">Thinking</span>
        </div>
        
        {isExpanded && (
          <div className={`p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-900'} text-xs`}>
            <pre className="whitespace-pre-wrap font-mono">
              {thinking}
            </pre>
          </div>
        )}
      </div>
    );
  };

  // Render standalone AI message
  const renderAiMessage = (message: AgentMessage, isStandalone = false) => {
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
        <div className={`space-y-6 pb-4 overflow-y-auto h-full ${
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
                    {/* Terminal-style header */}
                    <div className={`flex items-center gap-1.5 sm:gap-2 mb-1 text-xs ${
                      isDark ? 'text-blue-200' : 'text-blue-100'
                    }`}>
                      {isDark ? '┌─' : '┌─'} User Message
                    </div>
                    
                    {/* Message header */}
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-blue-700`}>
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
                        containerRef={containerRef}
                        hideCodeInMessages={hideCodeInMessages}
                      />
                    </div>
                    
                    {/* Terminal-style footer */}
                    <div className={`flex items-center gap-1.5 sm:gap-2 mt-1 text-xs ${
                      isDark ? 'text-blue-200' : 'text-blue-100'
                    }`}>
                      {isDark ? '└─' : '└─'} End of message
                    </div>
                  </div>
                </div>
                
                {/* AI message or streaming response */}
                {group.ai ? (
                  renderAiMessage(group.ai)
                ) : (
                  // Show streaming AI response if this is the latest conversation and we have text to stream
                  group.isLatest && hasCurrentResponse && (
                    <div className="flex justify-start mt-4">
                      <div className={`max-w-[95%] sm:max-w-[85%] message-appear ${
                        isDark
                          ? 'bg-gray-800/50 text-gray-200'
                          : 'bg-gray-900/80 text-green-400'
                      } rounded-md p-3 sm:p-4 shadow-sm overflow-hidden break-words`}>
                        {/* Terminal-style header */}
                        <div className={`flex items-center gap-1.5 sm:gap-2 mb-1 text-xs ${
                          isDark ? 'text-gray-400' : 'text-green-500'
                        }`}>
                          {isDark ? '┌─' : '┌─'} Live Response
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
                            {formatDistanceToNow(new Date(), { addSuffix: true })}
                          </span>
                        </div>

                        {/* Show loader for streaming response inside the container */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-2 h-2 ${isDark ? 'bg-blue-500' : 'bg-green-500'} rounded-full animate-pulse`}></div>
                          <div className={`w-2 h-2 ${isDark ? 'bg-blue-500' : 'bg-green-500'} rounded-full animate-pulse`} style={{ animationDelay: '0.2s' }}></div>
                          <div className={`w-2 h-2 ${isDark ? 'bg-blue-500' : 'bg-green-500'} rounded-full animate-pulse`} style={{ animationDelay: '0.4s' }}></div>
                          <span className={`text-xs ${isDark ? 'text-blue-500' : 'text-green-500'} font-medium`}>Generating response...</span>
                        </div>
                        
                        {/* Display thinking content if available for streaming response */}
                        {isTyping && 
                         renderThinking('streaming', currentThinking, expandedThinkingIds['streaming'] || false)
                        }
                        
                        {/* Message content */}
                        <div className={`prose prose-sm max-w-none overflow-hidden ${
                          isDark ? 'prose-invert' : 'prose-green'
                        } ${isMobile ? 'text-sm leading-snug' : ''}`}>
                          <MessageContent 
                            content={currentResponse || ''}
                            isStreaming={true}
                            isComplete={false}
                            containerRef={containerRef}
                            hideCodeInMessages={hideCodeInMessages}
                          />
                        </div>
                        
                        {/* Streaming indicator as footer */}
                        <div className={`flex items-center gap-1.5 sm:gap-2 mt-1 text-xs ${
                          isDark ? 'text-gray-400' : 'text-green-500'
                        }`}>
                          {isDark ? '└─' : '└─'} <span className="terminal-cursor">Typing</span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
          
          {/* Render error messages */}
          {errorMessages.map((errorMsg) => (
            <div key={`error-${errorMsg.id || errorMsg.timestamp}`} className="flex justify-start mt-4">
              <div className={`max-w-[95%] sm:max-w-[85%] message-appear 
                bg-red-900/80 text-white rounded-md p-3 sm:p-4 shadow-sm overflow-hidden break-words`}>
                {/* Terminal-style header */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 text-xs text-red-300">
                  {isDark ? '┌─' : '┌─'} Error Message
                </div>
                
                {/* Message header */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-red-800">
                    <Zap className="w-3.5 h-3.5 text-red-200" />
                  </div>
                  <span className="text-xs font-medium">System Error</span>
                  <span className="text-xs opacity-70 ml-auto">
                    {formatDistanceToNow(new Date(errorMsg.timestamp instanceof Date ? errorMsg.timestamp : new Date(errorMsg.timestamp)), { addSuffix: true })}
                  </span>
                </div>
                
                {/* Error content */}
                <div className="prose prose-sm max-w-none overflow-hidden prose-invert text-red-100">
                  <MessageContent 
                    content={errorMsg.content}
                    isComplete={true}
                    containerRef={containerRef}
                    hideCodeInMessages={false}
                  />
                </div>
                
                {/* Terminal-style footer */}
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 text-xs text-red-300">
                  {isDark ? '└─' : '└─'} End of error
                </div>
              </div>
            </div>
          ))}
          
          <div ref={messagesEndRef} className="h-4 mt-4 clear-both" /> {/* Extra space to ensure scrolling works properly */}
        </div>
      )}
      
      <style jsx>{`
        .message-block {
          display: flex;
          flex-direction: column;
          width: 100%;
          background-color: transparent;
          padding: 5px 10px;
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
          /* Reduced min-height to prevent scrolling issues */
          min-height: auto;
          display: flex;
          flex-direction: column;
        }
        
        .current-block .block-content {
          align-items: stretch;
          justify-content: flex-start;
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
        
        /* Terminal cursor blink */
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .terminal-cursor::after {
          content: '';
          width: 6px;
          height: 14px;
          background: ${isDark ? '#93c5fd' : '#4ade80'};
          display: inline-block;
          animation: cursor-blink 1.2s infinite;
          margin-left: 4px;
          vertical-align: middle;
        }
      `}</style>
    </div>
  );
};

export default ScrollableMessageContainer; 