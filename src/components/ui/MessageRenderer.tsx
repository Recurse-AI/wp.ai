"use client";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { cn } from "@/lib/utils";
import { Components } from "react-markdown";

interface MessageRendererProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp?: Date;
  animate?: boolean;
  className?: string;
}

const MessageRenderer: React.FC<MessageRendererProps> = ({
  content,
  role,
  timestamp,
  animate = false,
  className,
}) => {
  const [displayText, setDisplayText] = useState<string>(animate ? '' : content);
  const [isTyping, setIsTyping] = useState<boolean>(animate);
  const [typingIndex, setTypingIndex] = useState<number>(0);

  // Animation effect for typing
  useEffect(() => {
    if (!animate) {
      setDisplayText(content);
      return;
    }

    if (typingIndex < content.length) {
      const timeout = setTimeout(() => {
        setDisplayText(content.substring(0, typingIndex + 1));
        setTypingIndex(typingIndex + 1);
      }, 15); // Adjust speed as needed
      
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
    }
  }, [animate, content, typingIndex]);

  // Reset animation when content changes
  useEffect(() => {
    if (animate) {
      setDisplayText('');
      setTypingIndex(0);
      setIsTyping(true);
    } else {
      setDisplayText(content);
    }
  }, [content, animate]);

  // Format timestamp
  const formattedTime = timestamp 
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  // Define markdown components
  const markdownComponents: Components = {
    code: ({ className, children }) => {
      const match = /language-(\w+)/.exec(className || "");
      const isDarkMode = typeof window !== 'undefined' && 
        window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      return match ? (
        <div className="relative rounded-md overflow-hidden" style={{
          border: isDarkMode ? "1px solid #1e1e1e" : "1px solid #d4d4d4",
          background: isDarkMode ? "#1e1e1e" : "#ffffff",
          margin: "1rem 0",
          boxShadow: isDarkMode ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "0 2px 4px rgba(0, 0, 0, 0.05)"
        }}>
          <style jsx global>{`
            /* Dark mode syntax highlighting overrides for better visibility */
            .dark-syntax-theme .token.comment { color: #6A9955 !important; }
            .dark-syntax-theme .token.string { color: #ce9178 !important; }
            .dark-syntax-theme .token.keyword { color: #569cd6 !important; }
            .dark-syntax-theme .token.function { color: #dcdcaa !important; }
            .dark-syntax-theme .token.number { color: #b5cea8 !important; }
            .dark-syntax-theme .token.operator { color: #d4d4d4 !important; }
            .dark-syntax-theme .token.class-name { color: #4ec9b0 !important; }
            .dark-syntax-theme .token.property { color: #9cdcfe !important; }
            .dark-syntax-theme .token.punctuation { color: #d4d4d4 !important; }
            .dark-syntax-theme .token.tag { color: #569cd6 !important; }
            .dark-syntax-theme .token.attr-name { color: #9cdcfe !important; }
            .dark-syntax-theme .token.attr-value { color: #ce9178 !important; }
            .dark-syntax-theme .token.variable { color: #9cdcfe !important; }
            .dark-syntax-theme .token.constant { color: #4fc1ff !important; }
            .dark-syntax-theme .token.boolean { color: #569cd6 !important; }
            .dark-syntax-theme .token.regex { color: #d16969 !important; }
            
            /* Light mode syntax highlighting overrides for better visibility */
            .light-syntax-theme .token.comment { color: #008000 !important; }
            .light-syntax-theme .token.string { color: #a31515 !important; }
            .light-syntax-theme .token.keyword { color: #0000ff !important; }
            .light-syntax-theme .token.function { color: #795e26 !important; }
            .light-syntax-theme .token.number { color: #098658 !important; }
            .light-syntax-theme .token.operator { color: #000000 !important; }
            .light-syntax-theme .token.class-name { color: #267f99 !important; }
            .light-syntax-theme .token.property { color: #0070c1 !important; }
            .light-syntax-theme .token.punctuation { color: #000000 !important; }
            .light-syntax-theme .token.tag { color: #800000 !important; }
            .light-syntax-theme .token.attr-name { color: #ff0000 !important; }
            .light-syntax-theme .token.attr-value { color: #0000ff !important; }
            .light-syntax-theme .linenumber { color: #237893 !important; border-right: 1px solid #d4d4d4 !important; }
          `}</style>
          <SyntaxHighlighter
            style={isDarkMode ? vscDarkPlus : vs}
            language={match[1]}
            PreTag="div"
            showLineNumbers={true}
            className={isDarkMode ? "dark-syntax-theme" : "light-syntax-theme"}
            lineNumberStyle={{ 
              color: isDarkMode ? '#858585' : '#237893',
              borderRight: isDarkMode ? '1px solid #404040' : '1px solid #d4d4d4',
              paddingRight: '1em',
              marginRight: '1em'
            }}
            customStyle={{
              background: isDarkMode ? "#1e1e1e" : "#ffffff",
              padding: "1rem",
              margin: 0,
              borderRadius: "0.5rem",
              fontSize: "0.9rem",
              fontFamily: "Consolas, Monaco, 'Andale Mono', monospace",
            }}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code className={className} style={{
          background: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
          padding: "0.2em 0.4em",
          borderRadius: "3px",
          fontFamily: "Consolas, Monaco, 'Andale Mono', monospace",
          fontSize: "0.9em",
          color: isDarkMode ? "#569cd6" : "#0000ff",
        }}>
          {children}
        </code>
      );
    },
  };

  return (
    <div 
      className={cn(
        "flex w-full my-4",
        role === 'user' ? "justify-end" : "justify-start",
        className
      )}
    >
      <div 
        className={cn(
          "px-4 py-3 rounded-lg max-w-[80%]",
          role === 'user' 
            ? "bg-blue-600 text-white rounded-tr-none" 
            : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-none"
        )}
      >
        {content === "Thinking..." ? (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse delay-150"></div>
            <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-pulse delay-300"></div>
            <span className="ml-1">Thinking...</span>
          </div>
        ) : (
          <div>
            <ReactMarkdown
              className="prose dark:prose-invert max-w-none"
              components={markdownComponents}
            >
              {animate ? displayText : content}
            </ReactMarkdown>
            
            {timestamp && (
              <div className="text-xs mt-1 opacity-70 text-right">
                {formattedTime}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageRenderer; 