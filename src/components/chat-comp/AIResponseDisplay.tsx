"use client";
import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from "@/context/ThemeProvider";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";
import { Bot } from "lucide-react";
import Loader from '@/components/ui/Loader';

interface AIResponseDisplayProps {
  content: string;
  isResponding: boolean;
  isComplete: boolean;
  onComplete?: () => void;
  onCopyCode?: (code: string) => void;
  copiedCode?: string | null;
}

const AIResponseDisplay: React.FC<AIResponseDisplayProps> = ({
  content,
  isResponding,
  isComplete,
  onComplete,
  onCopyCode,
  copiedCode
}) => {
  const { theme } = useTheme();
  const responseBoxRef = useRef<HTMLDivElement>(null);
  const [displayedContent, setDisplayedContent] = useState('');
  const lastCharIndexRef = useRef(0);

  // Simulate streaming effect for AI response
  useEffect(() => {
    if (!isResponding || !content || isComplete) return;

    const currentCharIndex = lastCharIndexRef.current;
    if (currentCharIndex >= content.length) {
      if (onComplete) setTimeout(onComplete, 500);
      return;
    }

    const timer = setTimeout(() => {
      // Show more characters at once for a natural reading flow
      const nextCharIndex = Math.min(currentCharIndex + (3 + Math.floor(Math.random() * 5)), content.length);
      setDisplayedContent(content.substring(0, nextCharIndex));
      lastCharIndexRef.current = nextCharIndex;
    }, 10 + Math.random() * 20); // Fast but varied timing for natural flow

    return () => clearTimeout(timer);
  }, [content, isResponding, displayedContent, isComplete, onComplete]);

  // Show full content when complete
  useEffect(() => {
    if (isComplete && content) {
      setDisplayedContent(content);
      if (onComplete) onComplete();
    }
  }, [isComplete, content, onComplete]);

  // If no content and not responding, don't render anything
  if (!isResponding && !displayedContent) return null;

  return (
    <div 
      className={`w-full border rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${
        theme === 'dark' 
          ? 'bg-gray-900/30 border-gray-700/50' 
          : 'bg-white border-gray-200/70'
      }`}
      ref={responseBoxRef}
    >
      <div className={`flex items-center px-4 py-2 ${
        theme === 'dark' ? 'bg-gray-800/30' : 'bg-gray-50/80'
      }`}>
        <Bot className="w-4 h-4 mr-2 text-green-500" />
        <span className="text-sm font-medium">
          AI Response
        </span>
        {isResponding && (
          <div className="ml-auto">
            <Loader size="sm" color="#22c55e" />
          </div>
        )}
      </div>

      <div className="p-4">
        {displayedContent ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  if (inline) {
                    return (
                      <code className={`${className} px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm`} {...props}>
                        {children}
                      </code>
                    );
                  }
                  
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const code = String(children).replace(/\n$/, '');
                  
                  return (
                    <CodeBlock
                      key={code}
                      language={language}
                      value={code}
                      onCopy={onCopyCode}
                      isCopied={code === copiedCode}
                      showLineNumbers
                    />
                  );
                }
              }}
            >
              {displayedContent}
            </ReactMarkdown>
            {isResponding && (
              <span className="inline-block w-2 h-4 ml-1 bg-green-500 animate-pulse" />
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center py-8">
            <Loader color="#22c55e" />
            <span className="ml-2 text-sm text-gray-500">Generating response...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIResponseDisplay; 