import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useTheme } from '@/context/ThemeProvider';
import { LiHTMLAttributes, TableHTMLAttributes, HTMLAttributes } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { detectLanguage } from '@/lib/utils/codeHighlightUtils';

// Add type declarations for modules without types
declare module 'remark-math';
declare module 'rehype-katex';

// Custom interfaces for ReactMarkdown component props
interface MarkdownLiProps extends LiHTMLAttributes<HTMLLIElement> {
  checked?: boolean;
}

interface MarkdownTrProps extends HTMLAttributes<HTMLTableRowElement> {
  isHeader?: boolean;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
  isComplete?: boolean;
}

const MessageContent: React.FC<MessageContentProps> = ({ 
  content, 
  isStreaming = false,
  isComplete = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Handle code copying
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const handleCopyCode = useCallback((code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      }).catch(err => {
        console.error('Failed to copy code:', err);
      });
    }
  }, []);
  
  const isCodeCopied = useCallback((code: string) => {
    return code === copiedCode;
  }, [copiedCode]);

  // Focus management for keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, code: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopyCode(code);
    }
  }, [handleCopyCode]);

  // Custom components for ReactMarkdown
  const CodeBlock = useCallback(({ inline, className, children, ...rest }: CodeProps) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeContent = String(children || '').replace(/\n$/, '');
    
    if (!inline && match) {
      // Detect language or use specified language
      const language = match[1] || 'text';
      const detectedLang = detectLanguage(codeContent, language);
      
      return (
        <div className={`rounded-lg overflow-hidden my-2 ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <div className={`flex items-center justify-between px-4 py-2 text-xs ${
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
          }`}>
            <span className="font-medium">{detectedLang || language}</span>
            <button 
              className={`hover:text-blue-500 p-1 rounded-md hover:bg-opacity-20 hover:bg-gray-500 flex items-center transition-colors`} 
              title={isCodeCopied(codeContent) ? "Copied!" : "Copy code"}
              onClick={() => handleCopyCode(codeContent)}
              onKeyDown={(e) => handleKeyDown(e, codeContent)}
              aria-label={isCodeCopied(codeContent) ? "Copied to clipboard" : "Copy to clipboard"}
              tabIndex={0}
            >
              {isCodeCopied(codeContent) ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <SyntaxHighlighter
            language={detectedLang || language}
            style={isDark ? vscDarkPlus : vs}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              borderRadius: '0 0 0.375rem 0.375rem',
              background: isDark ? '#1e1e1e' : '#ffffff',
            }}
            showLineNumbers={true}
            wrapLongLines={false}
          >
            {codeContent}
          </SyntaxHighlighter>
        </div>
      );
    }
    
    // For inline code
    return (
      <code className={`px-1 py-0.5 rounded text-sm ${
        isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
      }`} {...rest}>
        {children}
      </code>
    );
  }, [isDark, isCodeCopied, handleCopyCode, handleKeyDown]);

  // Process content for lists
  useEffect(() => {
    if (!containerRef.current) return;
    
    // This approach uses a timer but is more reliable than direct DOM manipulation
    const timer = setTimeout(() => {
      const paragraphs = containerRef.current?.querySelectorAll('p');
      
      paragraphs?.forEach(p => {
        const text = p.innerHTML;
        if (text.trim().startsWith('- ')) {
          const ul = document.createElement('ul');
          ul.className = 'list-disc pl-6 my-2';
          const items = text.split('- ').filter(Boolean);
          
          items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'my-1';
            li.innerHTML = item.trim();
            ul.appendChild(li);
          });
          
          p.parentNode?.replaceChild(ul, p);
        }
      });
    }, 50);
    
    return () => clearTimeout(timer);
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className={`markdown-content prose dark:prose-invert max-w-none ${isStreaming && !isComplete ? 'typing-cursor' : ''}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code: CodeBlock,
          ol: ({ children, ...props }) => <ol className="list-decimal pl-6 my-2" {...props}>{children}</ol>,
          ul: ({ children, ...props }) => <ul className="list-disc pl-6 my-2" {...props}>{children}</ul>,
          li: ({ children, checked, ...props }: MarkdownLiProps) => {
            if (checked !== null && checked !== undefined) {
              return (
                <li className="my-1 flex items-start" {...props}>
                  <input 
                    type="checkbox" 
                    checked={checked} 
                    readOnly 
                    aria-label="Task list item" 
                    className="mt-1 mr-2" 
                  />
                  <span>{children}</span>
                </li>
              );
            }
            return <li className="my-1" {...props}>{children}</li>;
          },
          p: ({ children, ...props }) => <p className="my-2" {...props}>{children}</p>,
          blockquote: ({ children, ...props }) => (
            <blockquote 
              className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-3 text-gray-700 dark:text-gray-300" 
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Heading components with improved accessibility
          h1: ({ children, ...props }) => {
            const id = typeof children === 'string' 
              ? children.toLowerCase().replace(/\s+/g, '-') 
              : '';
            return <h1 className="text-xl font-bold mt-4 mb-2" id={`heading-${id}`} {...props}>{children}</h1>;
          },
          h2: ({ children, ...props }) => {
            const id = typeof children === 'string' 
              ? children.toLowerCase().replace(/\s+/g, '-') 
              : '';
            return <h2 className="text-lg font-bold mt-3 mb-2" id={`heading-${id}`} {...props}>{children}</h2>;
          },
          h3: ({ children, ...props }) => {
            const id = typeof children === 'string' 
              ? children.toLowerCase().replace(/\s+/g, '-') 
              : '';
            return <h3 className="text-base font-bold mt-3 mb-1" id={`heading-${id}`} {...props}>{children}</h3>;
          },
          // Table components
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => <thead className="bg-gray-100 dark:bg-gray-800" {...props}>{children}</thead>,
          tbody: ({ children, ...props }) => <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props}>{children}</tbody>,
          tr: ({ children, isHeader, ...props }: MarkdownTrProps) => (
            <tr 
              className={isHeader ? "bg-gray-50 dark:bg-gray-900" : "hover:bg-gray-50 dark:hover:bg-gray-900/50"} 
              {...props}
            >
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300" {...props}>{children}</td>,
          img: ({ src, alt, ...props }) => (
            <img 
              src={src} 
              alt={alt || "Image"} 
              className="max-w-full h-auto rounded-md my-2"
              loading="lazy"
              {...props}
            />
          ),
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a 
                href={href} 
                target={isExternal ? "_blank" : undefined} 
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                {...props}
              >
                {children}
                {isExternal && (
                  <span className="inline-block align-text-bottom ml-1">
                    <ExternalLink size={12} />
                  </span>
                )}
              </a>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>

      <style jsx global>{`
        .typing-cursor::after {
          content: '▌';
          display: inline-block;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .markdown-content pre {
          max-width: 100%;
          overflow-x: auto;
        }
        
        .markdown-content img {
          max-width: 100%;
          height: auto;
        }
        
        .markdown-content * {
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        
        /* Prevent content from causing horizontal overflow */
        * {
          box-sizing: border-box;
        }
        
        code, pre {
          white-space: pre-wrap !important;
          word-break: break-word !important;
        }
        
        /* Hide scrollbar but maintain scroll functionality */
        .markdown-content pre {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;     /* Firefox */
        }
        
        .markdown-content pre::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  );
};

export default MessageContent; 