"use client";

import React, { useState, useRef, useEffect } from 'react';
import { AgentChatProps } from '../../types';
import { useTheme } from '@/context/ThemeProvider';
import { Send, RefreshCw, User, Bot, ChevronDown, Code, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

// Extend the ReactMarkdown types to include inline property
declare module 'react-markdown' {
  interface CodeProps {
    inline?: boolean;
  }
}

const AgentChat: React.FC<AgentChatProps> = ({
  sessionState,
  onSendMessage,
  onRegenerateMessage
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessionState.messages]);
  
  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };
  
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
  
  // Handle send message
  const handleSendMessage = async () => {
    if (!message.trim() || sessionState.isProcessing) return;
    
    const userMessage = message;
    setMessage('');
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    await onSendMessage(userMessage);
  };
  
  // Handle regenerate last message
  const handleRegenerateMessage = async () => {
    if (sessionState.isProcessing || !onRegenerateMessage) return;
    await onRegenerateMessage();
  };
  
  // Format message content with code blocks
  const MessageContent = ({ content }: { content: string }) => {
    // Define custom components for ReactMarkdown with proper typing
    const customComponents: Components = {
      // Custom rendering for code blocks
      code(props) {
        const { className, children } = props;
        // Use index signature to bypass type checking
        const inline = (props as any).inline;
        const match = /language-(\w+)/.exec(className || '');
        if (inline) {
          return (
            <code className={`px-1 py-0.5 rounded text-sm ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`} {...props}>
              {children}
            </code>
          );
        }
        
        return (
          <div className={`my-2 overflow-x-auto rounded-md ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div className={`flex items-center justify-between px-4 py-1.5 text-xs border-b ${
              isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'
            }`}>
              <span>{match?.[1] || 'code'}</span>
              <button className="hover:text-blue-500" title="Copy code">
                <Code className="w-3.5 h-3.5" />
              </button>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className={className} {...props}>
                {children}
              </code>
            </pre>
          </div>
        );
      },
      
      // Custom rendering for links
      a({ children, href, ...props }) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center ${
              isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
            }`}
            {...props}
          >
            {children}
            <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        );
      }
    };

    return (
      <ReactMarkdown components={customComponents}>
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Chat header with service info */}
      <div className={`flex items-center justify-between px-4 py-2 ${
        isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200'
      } border-b`}>
        <div className="flex items-center">
          <div className="text-sm font-medium flex items-center">
            {sessionState.selectedService ? (
              <>
                <sessionState.selectedService.icon className="w-4 h-4 mr-2" />
                <span>{sessionState.selectedService.title}</span>
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                <span>AI Assistant</span>
              </>
            )}
          </div>
          {sessionState.isProcessing && (
            <div className="ml-2 flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
        
        <button
          onClick={() => {
            /* Toggle theme or other actions */
          }}
          className={`p-1 rounded ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
          title="Chat options"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
      
      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        {sessionState.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <h3 className={`text-lg font-medium ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {sessionState.selectedService ? 
                  `${sessionState.selectedService.title} Assistant` : 
                  'WordPress AI Assistant'}
              </h3>
              <p className={`mt-2 text-sm ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {sessionState.selectedService ? 
                  sessionState.selectedService.description : 
                  'I can help you build, customize, and debug WordPress plugins and themes. Ask me anything about WordPress development!'}
              </p>
              {sessionState.selectedService && (
                <div className={`mt-4 p-3 rounded ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                } border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <p className="text-sm font-medium mb-1">Try asking:</p>
                  <p className="text-sm italic">{sessionState.selectedService.example}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          sessionState.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${
                msg.role === 'user'
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                    ? 'bg-gray-800 text-gray-200'
                    : 'bg-white text-gray-800 border border-gray-200'
              } rounded-lg p-3 shadow-sm overflow-hidden`}>
                {/* Message header */}
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    msg.role === 'user'
                      ? 'bg-blue-400'
                      : isDark
                        ? 'bg-gray-700'
                        : 'bg-gray-100'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-3 h-3 text-white" />
                    ) : (
                      <Bot className={`w-3 h-3 ${
                        isDark ? 'text-blue-400' : 'text-blue-500'
                      }`} />
                    )}
                  </div>
                  <span className="text-xs opacity-70">
                    {msg.role === 'user' ? 'You' : 'AI Assistant'}
                  </span>
                  <span className="text-xs opacity-50 ml-auto">
                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                  </span>
                </div>
                
                {/* Message content */}
                <div className="prose prose-sm max-w-none mt-1">
                  <MessageContent content={msg.content} />
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className={`p-4 border-t ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        {/* Regenerate button (conditional) */}
        {sessionState.messages.length > 0 && sessionState.messages[sessionState.messages.length - 1].role !== 'user' && (
          <div className="mb-2">
            <button
              onClick={handleRegenerateMessage}
              disabled={sessionState.isProcessing}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded ${
                sessionState.isProcessing
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              Regenerate response
            </button>
          </div>
        )}
        
        {/* Input form */}
        <div className={`flex items-end gap-2 rounded-lg border p-2 ${
          isDark
            ? 'bg-gray-700 border-gray-600'
            : 'bg-white border-gray-300 focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500'
        }`}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={sessionState.isProcessing}
            placeholder={sessionState.isProcessing ? 'Waiting for response...' : 'Ask something about WordPress...'}
            className={`flex-1 max-h-[150px] min-h-[40px] resize-none outline-none py-2 px-3 ${
              isDark
                ? 'bg-gray-700 text-white placeholder-gray-400'
                : 'bg-white text-gray-900 placeholder-gray-500'
            }`}
            rows={1}
          />
          
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || sessionState.isProcessing}
            className={`p-2 rounded-md ${
              !message.trim() || sessionState.isProcessing
                ? 'opacity-50 cursor-not-allowed'
                : isDark
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-center text-gray-500">
          AI assistant powered by WP.ai
        </div>
      </div>
    </div>
  );
};

export default AgentChat; 