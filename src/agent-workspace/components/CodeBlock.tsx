import React, { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface CodeBlockProps {
  language: string;
  code: string;
  title?: string;
  showLineNumbers?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ 
  language,
  code,
  title,
  showLineNumbers = true
}) => {
  const [isCopied, setIsCopied] = useState(false);
  
  // Handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  return (
    <div className="code-block rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Optional title bar */}
      {title && (
        <div className="code-title bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-mono border-b border-gray-200 dark:border-gray-700">
          {title}
        </div>
      )}
      
      {/* Code header with language and copy button */}
      <div className="code-header flex justify-between items-center bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="copy-button flex items-center space-x-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none transition-colors"
          aria-label="Copy code"
        >
          {isCopied ? (
            <>
              <FiCheck className="w-4 h-4 text-green-500" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <FiCopy className="w-4 h-4" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Syntax highlighted code */}
      <SyntaxHighlighter
        language={language.toLowerCase()}
        style={vscDarkPlus}
        showLineNumbers={showLineNumbers}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: '0.9rem',
          backgroundColor: '#1e1e1e',
        }}
        lineNumberStyle={{
          color: '#6e7681',
          minWidth: '3.5em',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}; 