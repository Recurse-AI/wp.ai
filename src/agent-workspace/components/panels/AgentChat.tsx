"use client";

import React, { useState, useRef, useEffect } from 'react';
import { AgentChatProps } from '../../types';
import { useTheme } from '@/context/ThemeProvider';
import { Send, RefreshCw, ExternalLink, Code } from 'lucide-react';
import ScrollableMessageContainer from './ScrollableMessageContainer';

// Extend the ReactMarkdown types to include inline property
declare module 'react-markdown' {
  interface CodeProps {
    inline?: boolean;
  }
}

const AgentChat: React.FC<AgentChatProps> = ({
  sessionState,
  onSendMessage,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);
  const [currentThinking, setCurrentThinking] = useState<string | null>(null);
  
  // Sample AI responses to simulate streaming
  const aiResponses = [
    "Hello! How can I help you today?",
    "That's an interesting question. Let me think about it for a moment... Based on my understanding, the best approach would be to consider multiple factors before making a decision.",
    "I understand your concern. It's important to remember that technology is constantly evolving, and what works today might need adjustment tomorrow. Let's explore some options that could address your needs both in the short and long term.",
    "Great question! The concept you're asking about has several dimensions to it. First, we need to consider the technical aspects. Second, there are usability concerns to address. And finally, we should think about scalability for future growth."
  ];

  // Sample thinking process to simulate streaming
  const thinkingProcesses = [
    "Thinking Process\nThe user has sent a very simple greeting with \"Hello\" and a few more \"Hi\" messages. I should respond with a professional, friendly greeting and indicate that I'm here to help with WordPress development. I'll introduce myself and ask how I can assist them with their WordPress development needs.",
    "Thinking Process\nThe user is asking about WordPress plugin development best practices. This is a broad topic that covers code organization, security, performance, and WordPress integration. I'll structure my answer to cover the most important aspects of plugin development while keeping the response concise and practical.",
    "Thinking Process\nThe user wants to know about the difference between WordPress hooks: actions and filters. This is a fundamental WordPress development concept. I'll explain both types of hooks, their syntax, how they're used, and provide simple examples of each to illustrate the differences."
  ];
  
  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Simulate AI typing with streaming effect (for testing only)
  const simulateAIResponse = async () => {
    setIsTyping(true);
    
    // First, simulate thinking process
    const thinkingIndex = Math.floor(Math.random() * thinkingProcesses.length);
    const fullThinking = thinkingProcesses[thinkingIndex];
    
    // Stream the thinking process character by character
    setCurrentThinking('');
    for (let i = 0; i < fullThinking.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
      setCurrentThinking(prev => prev ? prev + fullThinking[i] : fullThinking[i]);
    }
    
    // Pause between thinking and response
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Select random response
    const responseIndex = Math.floor(Math.random() * aiResponses.length);
    const fullResponse = aiResponses[responseIndex];
    
    // Stream the response character by character
    setCurrentResponse('');
    for (let i = 0; i < fullResponse.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      setCurrentResponse(prev => prev ? prev + fullResponse[i] : fullResponse[i]);
    }
    
    return fullResponse;
  };
  
  // Auto-resize textarea with improved handling
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height before calculating new height to avoid cumulative growth
      textarea.style.height = '0px';
      const maxHeight = isMobile ? 100 : 150; // Lower max height on mobile
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      // If we're at max height, ensure the textarea is scrollable
      if (newHeight === maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  };
  
  // Readjust textarea when mobile state changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [isMobile]);
  
  // Focus input when conversation is empty
  useEffect(() => {
    if (sessionState.messages.length === 0 && textareaRef.current && !isMobile) {
      textareaRef.current.focus();
    }
  }, [sessionState.messages.length, isMobile]);
  
  // Handle input change with improved resize handling
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
    if (!message.trim() || sessionState.isProcessing || isTyping) return;
    
    const userMessage = message;
    setMessage('');
    setIsTyping(true);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Focus back on input after sending for continuous conversation
      textareaRef.current.focus();
    }
    
    try {
      // For demo purposes - in production would be replaced with actual API call
      if (process.env.NODE_ENV === 'development' && typeof onSendMessage !== 'function') {
        // Simulate AI response if we're in development
        const fullResponse = await simulateAIResponse();
        
        // Wait a bit before finishing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setCurrentResponse(null);
        setCurrentThinking(null);
      } else {
        await onSendMessage(userMessage);
      }
    } finally {
      setIsTyping(false);
      setCurrentThinking(null);
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

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ 
      height: '100%', 
      maxHeight: '100vh',
      position: 'relative'
    }}>
      {/* Using the ScrollableMessageContainer component */}
      <ScrollableMessageContainer
        messages={sessionState.messages}
        isDark={isDark}
        isMobile={isMobile}
        emptyStateTitle={sessionState.selectedService ? 
          `${sessionState.selectedService.title} Assistant` : 
          'WordPress AI Assistant'}
        emptyStateDescription={sessionState.selectedService ? 
          sessionState.selectedService.description : 
          'I can help you build, customize, and debug WordPress plugins and themes. Ask me anything about WordPress development!'}
        emptyStateExample={sessionState.selectedService?.example}
        onExampleClick={handleExampleClick}
        maxHeight="calc(95vh - 140px)"
        currentResponse={currentResponse}
        isTyping={isTyping}
        currentThinking={currentThinking}
      />
      
      {/* Improved input box with modern design */}
      <div className={`p-2 sm:p-4 transition-all flex-shrink-0 ${
        isDark ? 'bg-gray-900' : 'bg-white'
      }`}
      style={{ 
        maxHeight: '140px', // Increased height
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
      }}
      >
        <div className={`flex-1 rounded-xl overflow-hidden flex flex-col shadow-sm ${
          isDark ? 'bg-gray-800' : 'bg-gray-50'
        } ${sessionState.isProcessing || isTyping ? 'opacity-60' : ''} focus-within:ring-2 ${
          isDark ? 'focus-within:ring-blue-500/50' : 'focus-within:ring-blue-400/50'
        }`}>
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={
              sessionState.isProcessing || isTyping
                ? 'Agent is processing...'
                : 'Type your message here...'
            }
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={sessionState.isProcessing || isTyping}
            className={`flex-1 p-3 sm:p-4 resize-none focus:outline-none ${
              isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-800'
            } ${isMobile ? 'text-sm' : ''} custom-scrollbar-improved`}
            style={{ 
              minHeight: '42px',
              height: isMobile ? '40px' : '50px',
              maxHeight: isMobile ? '80px' : '100px'
            }}
          />
          <div className={`flex items-center justify-between px-2 py-1 ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="flex space-x-1">
              {/* Additional buttons could go here */}
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || sessionState.isProcessing || isTyping}
              className={`px-3 py-1.5 rounded-lg ${
                !message.trim() || sessionState.isProcessing || isTyping
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
              } transition-colors duration-200 flex items-center justify-center mb-2`}
            >
              <span className="mr-1.5 font-medium text-sm">Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Add improved custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar-improved::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .custom-scrollbar-improved::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 8px;
          margin: 2px;
        }
        
        .custom-scrollbar-improved::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
          border-radius: 8px;
        }
        
        .custom-scrollbar-improved::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
        }
      `}</style>
    </div>
  );
};

export default AgentChat; 