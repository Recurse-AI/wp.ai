import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { transformDashesToLists } from './CodeBlock';
import CodeBlock from './CodeBlock';
import { useTheme } from '@/context/ThemeProvider';
import { LiHTMLAttributes, TableHTMLAttributes, HTMLAttributes } from 'react';

// Add type declarations for modules without types
declare module 'remark-math';
declare module 'rehype-katex';

// Custom interfaces for ReactMarkdown component props
interface MarkdownLiProps extends LiHTMLAttributes<HTMLLIElement> {
  checked?: boolean;
  node?: any;
}

interface MarkdownTrProps extends HTMLAttributes<HTMLTableRowElement> {
  isHeader?: boolean;
  node?: any;
}

interface MarkdownContentProps {
  content: string;
  onCopyCode: (code: string) => void;
  isCodeCopied: (code: string) => boolean;
  className?: string;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ 
  content, 
  onCopyCode,
  isCodeCopied,
  className = ''
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  // Apply list transformations after markdown renders
  useEffect(() => {
    if (containerRef.current) {
      // Apply transformations with a slight delay to ensure DOM is ready
      const timer = setTimeout(() => {
        transformDashesToLists();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [content]);

  return (
    <div ref={containerRef} className={`markdown-content ai-response-text ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Handle code blocks with our custom component
          code(props: any) {
            const { inline, className, children, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');
            
            if (!inline && match) {
              return (
                <CodeBlock 
                  className={className}
                  onCopy={onCopyCode}
                  isCopied={isCodeCopied(codeContent)}
                >
                  {codeContent}
                </CodeBlock>
              );
            }
            
            // For inline code
            return (
              <code className={inline ? "inline-code" : className} {...rest}>
                {children}
              </code>
            );
          },
          // Ensure proper styling for lists
          ol({ children, ...props }) {
            return <ol className="markdown-ol" {...props} />;
          },
          ul({ children, ...props }) {
            return <ul className="markdown-ul" {...props} />;
          },
          li({ children, checked, ...props }: MarkdownLiProps) {
            // Handle task lists (checked items)
            if (checked !== null && checked !== undefined) {
              return (
                <li className="markdown-li task-list-item" {...props}>
                  <input type="checkbox" checked={checked} readOnly aria-label="Task list item" />
                  <span>{children}</span>
                </li>
              );
            }
            return <li className="markdown-li" {...props} />;
          },
          // Custom paragraph to handle spacing
          p({ node, ...props }) {
            return <p className="markdown-p" {...props} />;
          },
          // Better blockquote styling
          blockquote({ node, ...props }) {
            return <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-3 text-gray-700 dark:text-gray-300" {...props} />;
          },
          // Improved heading styles with proper accessibility
          h1({ node, ...props }) {
            return <h1 className="text-2xl font-bold mt-6 mb-4" id={`heading-${props.children?.toString().toLowerCase().replace(/\s+/g, '-')}`} {...props} />;
          },
          h2({ node, ...props }) {
            return <h2 className="text-xl font-bold mt-5 mb-3" id={`heading-${props.children?.toString().toLowerCase().replace(/\s+/g, '-')}`} {...props} />;
          },
          h3({ node, ...props }) {
            return <h3 className="text-lg font-bold mt-4 mb-2" id={`heading-${props.children?.toString().toLowerCase().replace(/\s+/g, '-')}`} {...props} />;
          },
          h4({ node, ...props }) {
            return <h4 className="text-base font-bold mt-3 mb-2" id={`heading-${props.children?.toString().toLowerCase().replace(/\s+/g, '-')}`} {...props} />;
          },
          // Enhanced table styling
          table({ node, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700" {...props} />
              </div>
            );
          },
          thead({ node, ...props }) {
            return <thead className="bg-gray-100 dark:bg-gray-800" {...props} />;
          },
          tbody({ node, ...props }) {
            return <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props} />;
          },
          tr({ node, isHeader, ...props }: MarkdownTrProps) {
            return <tr className={isHeader ? "bg-gray-50 dark:bg-gray-900" : "hover:bg-gray-50 dark:hover:bg-gray-900/50"} {...props} />;
          },
          th({ node, ...props }) {
            return <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider" {...props} />;
          },
          td({ node, ...props }) {
            return <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300" {...props} />;
          },
          // Improved image handling with proper alt text
          img({ src, alt, ...props }) {
            return (
              <img 
                src={src} 
                alt={alt || "Image"} 
                className="max-w-full h-auto rounded-md my-2"
                loading="lazy"
                {...props}
              />
            );
          },
          // Add links with proper attributes for security
          a({ node, href, ...props }) {
            const isExternal = href?.startsWith('http');
            return (
              <a 
                href={href} 
                className="text-blue-600 dark:text-blue-400 hover:underline" 
                target={isExternal ? "_blank" : undefined} 
                rel={isExternal ? "noopener noreferrer" : undefined}
                {...props} 
              />
            );
          },
          // Horizontal rule with better styling
          hr() {
            return <hr className="my-6 border-t border-gray-300 dark:border-gray-700" />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent; 