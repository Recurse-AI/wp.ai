import React, { useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Copy, Check } from "lucide-react";
import { detectLanguage } from "@/lib/utils/codeHighlightUtils";

// Function to transform paragraphs starting with "- " into list items
export const transformDashesToLists = () => {
  // Run this after component mount and content updates
  setTimeout(() => {
    const aiResponseElements = document.querySelectorAll('.ai-response-text');
    
    aiResponseElements.forEach(container => {
      // Find all paragraphs that are not inside code blocks
      const paragraphs = container.querySelectorAll('p:not(pre p):not(.code-block-content p)');
      let dashPrefixedParagraphs: Element[] = [];
      
      paragraphs.forEach(paragraph => {
        // Skip if already processed
        if (paragraph.classList.contains('has-list-handling')) return;
        
        const text = paragraph.textContent || '';
        const trimmedText = text.trim();
        
        // More comprehensive detection for dash-prefixed paragraphs
        // Check if paragraph starts with "- " or just "-" with content after it
        const isDashPrefixed = 
          trimmedText.startsWith('- ') || 
          (trimmedText.startsWith('-') && trimmedText.length > 1) ||
          /^[-–—•]\s+.+/i.test(trimmedText); // Handle various dash-like characters with content
        
        if (isDashPrefixed) {
          // Mark this paragraph as a list item
          paragraph.setAttribute('data-starts-with', '-');
          paragraph.classList.add('has-list-handling');
          paragraph.classList.add('list-item-dash');
          dashPrefixedParagraphs.push(paragraph);
          
          // Remove the dash prefix but keep the content
          // Handle various dash formats and whitespace consistently
          if (paragraph.firstChild && paragraph.firstChild.nodeType === Node.TEXT_NODE) {
            const content = paragraph.firstChild.nodeValue || '';
            // Remove dash, trim, and normalize spaces (replace multiple spaces with single space)
            paragraph.firstChild.nodeValue = content
              .replace(/^[-–—•]\s*/, '')  // Remove dash prefix
              .trim()                      // Trim leading/trailing whitespace
              .replace(/\s{2,}/g, ' ');    // Replace multiple spaces with single space
          } else {
            // For more complex content (with HTML), use innerHTML replacement
            const html = paragraph.innerHTML;
            // Apply the same transformations to HTML content
            paragraph.innerHTML = html
              .replace(/^[-–—•]\s*/, '')   // Remove dash prefix
              .trim()                       // Trim leading/trailing whitespace
              .replace(/\s{2,}/g, ' ');     // Replace multiple spaces with single space
          }
        }
      });
      
      // Group adjacent list items into proper list structures
      if (dashPrefixedParagraphs.length > 0) {
        let currentGroup: Element[] = [];
        let currentList: HTMLUListElement | null = null;
        
        for (let i = 0; i < dashPrefixedParagraphs.length; i++) {
          const item = dashPrefixedParagraphs[i];
          
          // Check if this item is part of the current group
          if (currentGroup.length === 0 || isAdjacentElement(currentGroup[currentGroup.length - 1], item)) {
            currentGroup.push(item);
          } else {
            // Process the current group before starting a new one
            if (currentGroup.length > 0) {
              createListFromGroup(currentGroup);
              currentGroup = [item];
            }
          }
        }
        
        // Process the final group
        if (currentGroup.length > 0) {
          createListFromGroup(currentGroup);
        }
      }
    });
  }, 150); // Slightly longer delay to ensure content is rendered
};

// Helper function to check if two elements are adjacent
const isAdjacentElement = (el1: Element, el2: Element): boolean => {
  // Check if elements are direct siblings or separated by just one element
  return el1.nextElementSibling === el2 || 
         el1.nextElementSibling?.nextElementSibling === el2;
};

// Helper function to create a list from a group of elements
const createListFromGroup = (group: Element[]): void => {
  if (group.length === 0) return;
  
  // Create a new list
  const list = document.createElement('ul');
  list.className = 'generated-list';
  group[0].parentNode?.insertBefore(list, group[0]);
  
  // Convert each paragraph to a list item
  group.forEach(item => {
    const listItem = document.createElement('li');
    
    // Get the inner HTML and normalize it (trim and fix spaces)
    const content = item.innerHTML
      .trim()
      .replace(/\s{2,}/g, ' ');
    
    listItem.innerHTML = content;
    list.appendChild(listItem);
    
    // Hide original paragraph (we'll remove it after the animation completes)
    (item as HTMLElement).style.display = 'none';
    
    // Schedule removal of the original paragraph
    setTimeout(() => {
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
    }, 500);
  });
};

// Component for processing inline code for syntax highlighting
export const processInlineCode = (code: string) => {
  // Don't process if it's not a string or if it's wrapped in backticks
  if (typeof code !== 'string') return code;
  
  // Special handling for content inside backticks
  if (code.startsWith('`') && code.endsWith('`')) {
    // Extract content without backticks
    const content = code.slice(1, -1);
    return React.createElement('span', { 
      className: 'backtick-content inline-code',
      style: { 
        backgroundColor: 'var(--code-bg-light)', 
        padding: '2px 4px', 
        borderRadius: '3px',
        fontFamily: 'var(--font-code)',
        fontSize: '0.9em',
        color: 'var(--code-text-light)'
      }
    }, content);
  }
  
  // Process PHP filenames (like functions.php, index.php)
  if (/^[a-zA-Z0-9_\-]+\.php$/.test(code)) {
    return React.createElement('span', { 
      className: 'php-file',
      style: { 
        color: '#9D6ABF', 
        fontWeight: 'medium' 
      }
    }, code);
  }
  
  // Process PHP functions (like __())
  if (/^__\([^)]+\)$/.test(code)) {
    return React.createElement('span', { 
      className: 'php-function',
      style: { 
        color: '#61AFEF', 
        fontWeight: 'medium' 
      }
    }, code);
  }
  
  // Process PHP strings
  if (/^['"][^'"]*['"]$/.test(code)) {
    return React.createElement('span', { 
      className: 'php-string',
      style: { 
        color: '#98C379' 
      }
    }, code);
  }
  
  // For any other inline code, apply generic styling
  return React.createElement('span', { 
    className: 'generic-code inline-code',
    style: { 
      backgroundColor: 'var(--code-bg-light)', 
      padding: '2px 4px', 
      borderRadius: '3px',
      fontFamily: 'var(--font-code)',
      fontSize: '0.9em',
      color: 'var(--code-text-light)'
    }
  }, code);
};

// Function to process links in code to open in new tab
const processCodeLinks = (codeString: string) => {
  // If the code contains URL patterns, wrap them in anchor tags with target="_blank"
  return codeString.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="code-link">$1</a>'
  );
};

// Code block component for syntax highlighting
interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
  theme: string;
  onCopy: (code: string) => void;
  copiedCode: string | null;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className, children, theme, onCopy, copiedCode }) => {
  const match = /language-(\w+)/.exec(className || "");
  
  // Call the transformation function when component mounts or updates
  useEffect(() => {
    transformDashesToLists();
  }, [children]); // Re-run when content changes
  
  // Simple trimming that preserves code formatting
  const codeString = children ? String(children).replace(/^\n|\n$/g, "") : "";
  const isCopied = copiedCode === codeString;
  
  // For inline code (no language specified)
  if (!match) {
    return (
      <code className="inline-code text-base px-1.5 py-0.5 rounded bg-gray-100/80 dark:bg-gray-800/50 font-medium" style={{ fontSize: '0.95rem' }}>
        {processInlineCode(children ? String(children) : "")}
      </code>
    );
  }
  
  // Extract the specified language from the match
  const specifiedLanguage = match[1].toLowerCase();
  
  // Use our enhanced detection logic to determine the actual language
  const language = detectLanguage(codeString, specifiedLanguage);
  
  // Special styling for PHP language
  const isPhp = language === 'php';
  
  // Common background color for controls - special case for PHP
  const controlBgColor = isPhp 
    ? theme === "dark" ? "rgba(48, 36, 64, 0.9)" : "rgba(230, 220, 240, 0.9)"
    : theme === "dark" ? "rgba(40, 40, 40, 0.9)" : "rgba(240, 240, 240, 0.9)";
  
  const textColor = theme === "dark" ? "#e0e0e0" : "#333";
  
  // Process URLs in code to open in new tabs
  const processedCode = processCodeLinks(codeString);
  
  // Background color for the code block - special case for PHP
  const codeBackground = isPhp 
    ? theme === "dark" ? "#2A1B3D" : "#F8F5FB" 
    : theme === "dark" ? "#1e1e1e" : "#fafafa";
  
  // Border color - special case for PHP
  const borderColor = isPhp 
    ? theme === "dark" ? "#3D2A57" : "#E2D5EC" 
    : theme === "dark" ? "#333" : "#e0e0e0";
  
  return (
    <div className="relative group/code" style={{ width: '100%', display: 'block', margin: '0.5rem 0' }}>
      {/* Code block container with proper spacing for controls */}
      <div className="code-block-wrapper code-wrapper mt-2 mb-2" style={{ width: '100%', display: 'block', position: 'relative' }}>
        <div className="code-block-content relative" style={{ width: '100%', display: 'block' }}>
          {/* Copy button - fixed position that doesn't affect layout */}
          <button 
            onClick={() => onCopy(codeString)}
            className="absolute p-1.5 rounded-md transition-colors z-20 shadow-sm"
            aria-label="Copy code"
            style={{ 
              top: "8px",
              right: "8px",
              opacity: "0.9", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              background: controlBgColor,
              color: textColor,
              border: "none", // Remove border
              zIndex: 30
            }}
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          
          {/* Language label - fixed position */}
          <div 
            className="absolute text-xs font-medium px-2 py-1 rounded-sm z-10"
            style={{
              top: "8px",
              left: "8px",
              background: controlBgColor,
              color: textColor,
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              fontWeight: "bold",
              zIndex: 30
            }}
          >
            {match[1].toUpperCase()}
          </div>
          
          <SyntaxHighlighter
            style={theme === "dark" ? vscDarkPlus : vs}
            language={language}
            PreTag="div"
            showLineNumbers={true}
            lineNumberStyle={{ 
              color: theme === "dark" ? '#858585' : '#a0a0a0',
              borderRight: theme === "dark" ? '1px solid #333333' : '1px solid #e4e4e4',
              paddingRight: '1em',
              marginRight: '1em',
              fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
              fontSize: '13px',
              minWidth: '2.5em',
              textAlign: 'right',
              userSelect: 'none'
            }}
            className={`${theme === "dark" ? "dark-syntax-theme" : "light-syntax-theme"} full-height-code ${language}-syntax vscode-theme`}
            customStyle={{
              background: codeBackground,
              overflow: 'visible',
              overflowX: 'auto',
              whiteSpace: 'pre',
              wordWrap: 'normal',
              wordBreak: 'normal',
              width: '100%',
              fontSize: '14px',
              padding: '2.5rem 0.75rem 0.75rem 0.75rem',
              fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
              border: `1px solid ${borderColor}`,
              borderRadius: "4px",
              margin: 0,
              textAlign: 'left',
              display: 'block',
              position: 'relative',
              boxSizing: 'border-box',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)'
            }}
            wrapLines={true}
            wrapLongLines={false}
            useInlineStyles={true}
          >
            {processedCode}
          </SyntaxHighlighter>
        </div>
      </div>
      
      {/* Add custom styling for links in code blocks and ensure full height */}
      <style jsx global>{`
        .code-link {
          color: #2563EB;
          text-decoration: underline;
          cursor: pointer;
        }
        .code-link:hover {
          text-decoration: none;
        }
        .full-height-code {
          height: auto !important;
          min-height: auto !important;
          max-height: none !important;
          margin-bottom: 0 !important;
        }
        .full-height-code pre {
          height: auto !important;
          min-height: auto !important;
          max-height: none !important;
          overflow: visible !important;
          white-space: pre !important;
        }
        .full-height-code code {
          white-space: pre !important;
          word-break: keep-all !important;
        }
        /* Fix for container sizing */
        .code-block-wrapper {
          margin: 0.75rem 0 !important;
        }
        /* Ensure line numbers are visible */
        .full-height-code span.linenumber {
          display: inline-block !important;
        }
        /* Fix for PHP entity styling in dark mode */
        .php-syntax .token.string {
          color: #98C379 !important;
        }
        .php-syntax .token.function {
          color: #61AFEF !important;
        }
        .dark .php-syntax .token.string {
          color: #98C379 !important;
        }
        .dark .php-syntax .token.function {
          color: #61AFEF !important;
        }
        /* Dark mode styling for inline code */
        .dark .inline-code {
          background-color: var(--code-bg-dark) !important;
          color: var(--code-text-dark) !important;
        }
        
        /* AI Response List Styling */
        .ai-response-text .generated-list {
          list-style-type: none;
          padding-left: 1.5em;
          margin: 0.5em 0 1em 0;
        }
        
        .ai-response-text .generated-list li {
          padding-left: 1.25em;
          position: relative;
          display: list-item;
          animation: listItemFadeIn 0.3s ease-out forwards;
          margin-bottom: 0.4em;
        }
        
        .ai-response-text .generated-list li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: inherit;
          font-size: 1.2em;
          line-height: 1;
        }
        
        /* Ensure proper spacing for list content */
        .ai-response-text .generated-list li > * {
          display: inline-block;
          margin-top: 0;
        }
        
        @keyframes listItemFadeIn {
          from { 
            opacity: 0;
            transform: translateX(-5px);
          }
          to { 
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Styling for paragraphs marked as list items */
        .ai-response-text p.list-item-dash {
          position: relative;
          padding-left: 1.25em;
          margin-bottom: 0.4em;
          display: flex;
        }
        
        .ai-response-text p.list-item-dash::before {
          content: "•";
          position: absolute;
          left: 0.5em;
          color: inherit;
          font-size: 1.2em;
          line-height: 1;
        }
        
        /* Ensure we don't show bullets twice */
        .ai-response-text ul.generated-list > li::before {
          content: none;
        }
        
        /* Fix for paragraph alignment in lists */
        .ai-response-text ul li p,
        .ai-response-text ol li p,
        .ai-response-text .generated-list li p {
          margin-bottom: 0.3em;
          display: inline;
        }
        
        /* Improved handling for dash-prefixed text */
        .ai-response-text p[data-starts-with="-"] {
          position: relative;
          padding-left: 1.25em;
          margin-bottom: 0.4em;
          display: flex;
        }
        
        .ai-response-text p[data-starts-with="-"]::before {
          content: "•";
          position: absolute;
          left: 0.5em;
          color: inherit;
        }
      `}</style>
    </div>
  );
};

export default CodeBlock; 