"use client";
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { FaUser, FaRobot } from 'react-icons/fa';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { getToastStyle } from '@/lib/toastConfig';

interface AgentMessageProps {
  content: string;
  isUser: boolean;
  isLatestMessage?: boolean;
}

const AgentMessage: React.FC<AgentMessageProps> = ({ content, isUser, isLatestMessage = false }) => {
  const { theme } = useTheme();
  const [displayText, setDisplayText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamComplete, setStreamComplete] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Stream the text for the latest assistant message
  useEffect(() => {
    if (!isUser && isLatestMessage && !streamComplete) {
      setIsStreaming(true);
      setDisplayText("");
      
      let index = 0;
      const textContent = content || "";
      const length = textContent.length;
      const speed = length > 500 ? 5 : length > 200 ? 10 : length > 50 ? 15 : 20;

      const interval = setInterval(() => {
        setDisplayText(textContent.slice(0, index));
        index++;

        if (index > textContent.length) {
          clearInterval(interval);
          setStreamComplete(true);
          setIsStreaming(false);
        }
      }, speed);

      return () => clearInterval(interval);
    }
  }, [content, isUser, isLatestMessage, streamComplete]);
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(
      'Code copied to clipboard!',
      { style: getToastStyle(theme) as React.CSSProperties }
    );
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };
  
  // Function to render code blocks with copy button
  const renderContentWithCodeBlocks = (text: string) => {
    // Simple regex to find code blocks (text between triple backticks)
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Add code block with copy button
      const codeContent = match[1].trim();
      const isCopied = copiedCode === codeContent;
      
      parts.push(
        <div key={`code-${match.index}`} className="relative my-2 bg-gray-800 rounded-md p-3 text-gray-200">
          <button 
            onClick={() => handleCopyCode(codeContent)}
            className="absolute right-2 top-2 p-1.5 rounded-md bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
            aria-label="Copy code"
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <pre className="overflow-x-auto text-sm pt-2">{codeContent}</pre>
        </div>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text after the last code block
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return parts;
  };
  
  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 ml-2' 
            : 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300 mr-2'
        }`}>
          {isUser ? <FaUser /> : <FaRobot />}
        </div>
        
        <div className={`p-3 rounded-lg ${
          isUser 
            ? 'bg-blue-500 text-white dark:bg-blue-600' 
            : theme === 'dark' 
              ? 'bg-gray-700 text-gray-100' 
              : 'bg-gray-100 text-gray-800'
        }`}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div>
              {isStreaming && isLatestMessage 
                ? <p className="whitespace-pre-wrap">{displayText}</p>
                : renderContentWithCodeBlocks(content)
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentMessage; 