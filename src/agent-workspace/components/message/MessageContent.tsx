"use client";

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '@/context/ThemeProvider';
import remarkGfm from 'remark-gfm';

interface MessageContentProps {
  content: string;
  isComplete?: boolean;
  isStreaming?: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  hideCodeInMessages?: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({
  content,
  isComplete = true,
  isStreaming = false,
  containerRef,
  hideCodeInMessages = false
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const contentRef = useRef<HTMLDivElement>(null);
  const [showCursorBlink, setShowCursorBlink] = useState(isStreaming);

  // Add cursor blinking effect for streaming
  useEffect(() => {
    setShowCursorBlink(isStreaming);
    
    if (isStreaming && contentRef.current) {
      // Scroll to the bottom of the content when streaming
      containerRef?.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
    
    // Remove blinking cursor when streaming stops
    if (!isStreaming) {
      const timer = setTimeout(() => {
        setShowCursorBlink(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isStreaming, containerRef, content]);

  // Determine if we should use terminal styling for the content
  const isTerminalOutput = content.includes('$') && content.includes('\n') && !content.includes('```');
  
  // Process code blocks and file reference blocks
  const processedContent = React.useMemo(() => {
    if (!content) return '';
    
    let processed = content;
    
    // Handle terminal-like output without proper markdown
    if (isTerminalOutput) {
      processed = '```bash\n' + processed + '\n```';
    }
    
    // Handle file path blocks
    processed = processed.replace(/┌─\s*File:\s*([^\n]+)\n│\s*[^└]([^\n]*)\n└─[^\n]*/g, (match) => {
      return `\n\n<div class="file-reference-block">${match}</div>\n\n`;
    });
    
    return processed;
  }, [content, isTerminalOutput]);

  return (
    <div 
      ref={contentRef} 
      className={`markdown-content ${showCursorBlink ? 'agent-chat-cursor' : ''}`}
    >
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match && match[1] ? match[1] : '';
            
            // Skip rendering code blocks if hideCodeInMessages is true
            if (!inline && hideCodeInMessages) {
              return null;
            }
            
            // For inline code
            if (inline) {
              return (
                <code
                  className={`px-1 py-0.5 rounded text-sm font-mono ${
                    isDark ? 'bg-gray-800 text-pink-200' : 'bg-gray-100 text-pink-800'
                  }`}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            
            // For code blocks
            return language ? (
              <div className="relative rounded-md overflow-hidden my-3">
                <div className={`text-xs px-3 py-1 font-mono border-b ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-gray-400' 
                    : 'bg-gray-200 border-gray-300 text-gray-700'
                }`}>
                  {language}
                </div>
                <SyntaxHighlighter
                  style={isDark ? vscDarkPlus : prism}
                  language={language}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    borderRadius: '0 0 0.375rem 0.375rem'
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <div className={`p-3 rounded-md my-3 font-mono text-sm overflow-x-auto ${
                isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'
              }`}>
                <pre className="whitespace-pre-wrap break-words" {...props}>
                  {children}
                </pre>
              </div>
            );
          },
          // Add simpler versions of other components
          p({ children }) {
            return <p className="my-2">{children}</p>;
          },
          a({ href, children, ...props }) {
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`underline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}
                {...props}
              >
                {children}
              </a>
            );
          },
          ul({ children }) {
            return <ul className="list-disc pl-6 my-2">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-6 my-2">{children}</ol>;
          },
          li({ children }) {
            return <li className="my-1">{children}</li>;
          },
          h1: ({ children }) => <h1 className="text-xl font-bold my-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-bold my-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-bold my-2">{children}</h3>,
          h4: ({ children }) => <h4 className="text-sm font-bold my-2">{children}</h4>,
          blockquote: ({ children }) => (
            <blockquote className={`border-l-4 pl-4 my-3 ${
              isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'
            }`}>
              {children}
            </blockquote>
          ),
        }}
        remarkPlugins={[remarkGfm]}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MessageContent; 