"use client";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
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
      return match ? (
        <SyntaxHighlighter
          style={oneDark}
          language={match[1]}
          PreTag="div"
        >
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      ) : (
        <code className={className}>
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