import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { transformDashesToLists } from './CodeBlock';
import CodeBlock from './CodeBlock';

interface MarkdownContentProps {
  content: string;
  theme: string;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
}

const MarkdownContent: React.FC<MarkdownContentProps> = ({ 
  content, 
  theme, 
  onCopyCode,
  copiedCode
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Apply list transformations after markdown renders
  React.useEffect(() => {
    if (containerRef.current) {
      transformDashesToLists();
    }
  }, [content]);

  return (
    <div ref={containerRef} className="markdown-content ai-response-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Handle code blocks with our custom component
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = String(children).replace(/\n$/, '');
            
            if (!inline && match) {
              return (
                <CodeBlock 
                  className={className}
                  theme={theme}
                  onCopy={onCopyCode}
                  copiedCode={copiedCode}
                >
                  {codeContent}
                </CodeBlock>
              );
            }
            
            // For inline code
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Ensure proper styling for lists
          ol({ node, ordered, ...props }) {
            return <ol className="markdown-ol" {...props} />;
          },
          ul({ node, ordered, ...props }) {
            return <ul className="markdown-ul" {...props} />;
          },
          li({ node, ordered, ...props }) {
            return <li className="markdown-li" {...props} />;
          },
          // Custom paragraph to handle spacing
          p({ node, ...props }) {
            return <p className="markdown-p" {...props} />;
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent; 