import React, { useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Copy, Check } from "lucide-react";
import { detectLanguage } from "@/lib/utils/codeHighlightUtils";
import { useTheme } from "@/context/ThemeProvider";

// Function to transform paragraphs starting with "- " into list items
export const transformDashesToLists = () => {
  // Run with a delay to ensure DOM is fully rendered
  setTimeout(() => {
    try {
      const aiResponseElements = document.querySelectorAll('.ai-response-text, .markdown-content');
      
      aiResponseElements.forEach(container => {
        // First, handle numbered lists with proper nesting
        processNumberedLists(container);
        
        // Then process regular dash lists
        processDashLists(container);
        
        // Fix any incorrectly processed inline lists
        fixInlineListStyles(container);
      });
    } catch (error) {
      console.error("Error transforming dashes to lists:", error);
    }
  }, 75); // Faster delay for more responsive rendering
};

// New helper function to fix any inline list issues
const fixInlineListStyles = (container: Element) => {
  // Find all ul/ol elements and ensure they have proper styling
  const lists = container.querySelectorAll('ul, ol');
  lists.forEach(list => {
    if (!list.classList.contains('markdown-ul') && !list.classList.contains('markdown-ol')) {
      if (list.tagName.toLowerCase() === 'ul') {
        list.classList.add('markdown-ul');
      } else {
        list.classList.add('markdown-ol');
      }
    }
    
    // Fix list items missing class
    const items = list.querySelectorAll('li');
    items.forEach(item => {
      if (!item.classList.contains('markdown-li')) {
        item.classList.add('markdown-li');
      }
    });
  });
};

// Process ordered/numbered lists
const processNumberedLists = (container: Element) => {
  // Find potential numbered list items (paragraphs starting with a number followed by period or dot)
  const paragraphs = container.querySelectorAll('p:not(pre p):not(.code-block-content p)');
  const numberedParagraphs: Element[] = [];
  
  // First pass: identify numbered paragraphs and mark them
  paragraphs.forEach(paragraph => {
    // Skip if already processed
    if (paragraph.classList.contains('has-list-handling')) return;
    
    const text = paragraph.textContent || '';
    const trimmedText = text.trim();
    
    // Match patterns like "1.", "2.", "1)", "2)", etc.
    const isNumbered = /^\d+[\.\)]\s+/.test(trimmedText);
    
    if (isNumbered) {
      // Mark this paragraph as a numbered list item
      paragraph.setAttribute('data-list-type', 'numbered');
      paragraph.classList.add('has-list-handling');
      paragraph.classList.add('numbered-list-item');
      numberedParagraphs.push(paragraph);
      
      // Format the numbered item for better visibility
      const number = trimmedText.match(/^\d+/)?.[0] || '';
      const restOfContent = trimmedText.replace(/^\d+[\.\)]\s+/, '');
      
      // Create the number and content spans
      const numberSpan = document.createElement('span');
      numberSpan.className = 'number-marker';
      numberSpan.textContent = number + '.';
      numberSpan.style.marginRight = '0.5em';
      numberSpan.style.fontWeight = 'var(--font-weight-medium)';
      
      // Replace content with formatted version
      paragraph.innerHTML = '';
      paragraph.appendChild(numberSpan);
      paragraph.appendChild(document.createTextNode(' ' + restOfContent));
    }
  });
  
  // Process and convert numbered paragraphs into proper ordered lists
  if (numberedParagraphs.length > 0) {
    // Group consecutive numbered items
    let currentGroup: Element[] = [];
    let currentNumber = 1;
    
    for (let i = 0; i < numberedParagraphs.length; i++) {
      const item = numberedParagraphs[i];
      const itemText = item.textContent || '';
      const leadingNumber = parseInt(itemText.match(/^\d+/)?.[0] || '0');
      
      // Start a new group or continue current one
      if (currentGroup.length === 0) {
        currentGroup.push(item);
        currentNumber = leadingNumber;
      } else if (leadingNumber === currentNumber + 1 || 
                isAdjacentElement(currentGroup[currentGroup.length - 1], item)) {
        currentGroup.push(item);
        currentNumber = leadingNumber;
      } else {
        // Process current group and start a new one
        createOrderedListFromGroup(currentGroup);
        currentGroup = [item];
        currentNumber = leadingNumber;
      }
    }
    
    // Process the final group
    if (currentGroup.length > 0) {
      createOrderedListFromGroup(currentGroup);
    }
  }
};

// Process dash-prefixed paragraphs into lists
const processDashLists = (container: Element) => {
  // Find all paragraphs that are not inside code blocks and not already processed
  const paragraphs = container.querySelectorAll('p:not(pre p):not(.code-block-content p):not(.has-list-handling)');
  let dashPrefixedParagraphs: Element[] = [];
  
  // First pass: identify all dash-prefixed paragraphs
  paragraphs.forEach(paragraph => {
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
      
      // Replace the dash prefix with a proper bullet, but keep the content
      // Handle various dash formats and whitespace consistently
      if (paragraph.firstChild && paragraph.firstChild.nodeType === Node.TEXT_NODE) {
        const content = paragraph.firstChild.nodeValue || '';
        // Extract content after dash and preserve it
        const cleanContent = content
          .replace(/^[-–—•]\s*/, '')  // Remove dash prefix
          .trim()                      // Trim leading/trailing whitespace
          .replace(/\s{2,}/g, ' ');    // Replace multiple spaces with single space
          
        // Create a bullet point span and the content span
        const bulletPoint = document.createElement('span');
        bulletPoint.className = 'bullet-point';
        bulletPoint.innerHTML = '•';
        bulletPoint.style.marginRight = '0.5em';
        bulletPoint.style.display = 'inline-block';
        bulletPoint.style.width = '0.5em';
        
        // Replace text node with formatted content
        paragraph.innerHTML = '';
        paragraph.appendChild(bulletPoint);
        paragraph.appendChild(document.createTextNode(cleanContent));
      } else {
        // For more complex content (with HTML), use innerHTML replacement
        const html = paragraph.innerHTML;
        // Extract content after dash
        const cleanContent = html
          .replace(/^[-–—•]\s*/, '')   // Remove dash prefix
          .trim()                       // Trim leading/trailing whitespace
          .replace(/\s{2,}/g, ' ');     // Replace multiple spaces with single space
          
        // Add bullet point and content
        paragraph.innerHTML = `<span class="bullet-point" style="margin-right: 0.5em; display: inline-block; width: 0.5em;">•</span>${cleanContent}`;
      }
    }
  });
  
  // Second pass: create proper grouped lists
  if (dashPrefixedParagraphs.length > 0) {
    // Find consecutive groups
    let currentGroup: Element[] = [];
    
    // Process all dash-prefixed paragraphs
    for (let i = 0; i < dashPrefixedParagraphs.length; i++) {
      const item = dashPrefixedParagraphs[i];
      
      // Start a new group or add to existing group
      if (currentGroup.length === 0) {
        currentGroup.push(item);
      } else {
        const lastItem = currentGroup[currentGroup.length - 1];
        
        // Check if this item directly follows the last one
        if (lastItem.nextElementSibling === item || 
            // Check for one element in between (could be a blank line)
            (lastItem.nextElementSibling && 
             lastItem.nextElementSibling.nextElementSibling === item &&
             (lastItem.nextElementSibling as HTMLElement).innerText.trim() === '')) {
          currentGroup.push(item);
        } else {
          // Process the current group and start a new one
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
};

// Helper function to check if two elements are adjacent
const isAdjacentElement = (el1: Element, el2: Element): boolean => {
  // Elements are adjacent if they follow each other directly
  // or if there's a single blank line between them
  if (!el1.nextElementSibling) return false;
  
  return el1.nextElementSibling === el2 || 
        (el1.nextElementSibling && 
         el1.nextElementSibling.nextElementSibling === el2 &&
         el1.nextElementSibling instanceof HTMLElement &&
         el1.nextElementSibling.innerText.trim() === '');
};

// Helper function to create a list from a group of elements
const createListFromGroup = (group: Element[]): void => {
  if (group.length === 0) return;
  
  // Create a new list
  const list = document.createElement('ul');
  list.className = 'generated-list';
  
  // Insert the list before the first element in the group
  group[0].parentNode?.insertBefore(list, group[0]);
  
  // Convert each paragraph to a list item with optimized styling
  group.forEach(item => {
    const listItem = document.createElement('li');
    
    // Get the inner HTML and normalize it (trim and fix spaces)
    const content = item.innerHTML
      .trim()
      .replace(/\s{2,}/g, ' ');
    
    // Ensure we handle bullet points consistently
    // If content already has a bullet point span, keep it as the visual bullet
    // Otherwise add our own bullet point
    if (content.includes('class="bullet-point"')) {
      listItem.innerHTML = content;
    } else {
      // Add a bullet point span for consistent styling
      const bulletSpan = document.createElement('span');
      bulletSpan.className = 'bullet-point';
      bulletSpan.innerHTML = '•';
      bulletSpan.style.marginRight = '0.5em';
      bulletSpan.style.display = 'inline-block';
      bulletSpan.style.width = '0.5em';
      
      listItem.appendChild(bulletSpan);
      listItem.insertAdjacentHTML('beforeend', content);
    }
    
    // Ensure proper styling for list items with bullet points
    listItem.style.position = 'relative';
    listItem.style.display = 'flex';
    listItem.style.marginBottom = '0.4rem';
    listItem.style.lineHeight = '1.5';
    listItem.style.paddingLeft = '0';
    
    // Add the item to the list
    list.appendChild(listItem);
    
    // Remove the original paragraph immediately to prevent spacing issues
    if (item.parentNode) {
      item.parentNode.removeChild(item);
    }
  });
  
  // Apply consistent spacing and styling to the list
  list.style.marginTop = '0.4rem';
  list.style.marginBottom = '0.8rem';
  list.style.paddingLeft = '1.25rem';
  list.style.listStyleType = 'none'; // No CSS bullets, we use manual bullets
  
  // Add a CSS class for animations
  list.classList.add('animated-list');
};

// Helper function to create an ordered list from a group of elements
const createOrderedListFromGroup = (group: Element[]): void => {
  if (group.length === 0) return;
  
  // Create a new ordered list
  const list = document.createElement('ol');
  list.className = 'generated-ordered-list';
  
  // Insert the list before the first element in the group
  group[0].parentNode?.insertBefore(list, group[0]);
  
  // Convert each paragraph to a list item with optimized styling
  group.forEach((item, index) => {
    const listItem = document.createElement('li');
    
    // Get the inner HTML but remove the number marker
    const content = item.innerHTML
      .replace(/<span class="number-marker">.*?<\/span>\s*/, '')
      .trim()
      .replace(/\s{2,}/g, ' ');
    
    // We'll use the index + 1 as our number for styling
    const numIndex = index + 1;
    
    // Create a number marker span
    const numberSpan = document.createElement('span');
    numberSpan.className = 'number-marker';
    numberSpan.textContent = `${numIndex}.`;
    numberSpan.style.marginRight = '0.5em';
    numberSpan.style.fontWeight = 'var(--font-weight-medium)';
    numberSpan.style.minWidth = '1.5em';
    numberSpan.style.display = 'inline-block';
    
    // Add number marker and content
    listItem.appendChild(numberSpan);
    listItem.insertAdjacentHTML('beforeend', content);
    
    // Ensure proper styling for numbered list items
    listItem.style.position = 'relative';
    listItem.style.display = 'flex';
    listItem.style.marginBottom = '0.4rem';
    listItem.style.lineHeight = '1.5';
    
    // Add the item to the list
    list.appendChild(listItem);
    
    // Remove the original paragraph immediately to prevent spacing issues
    if (item.parentNode) {
      item.parentNode.removeChild(item);
    }
  });
  
  // Apply consistent spacing and styling to the ordered list
  list.style.margin = '0.5rem 0 0.8rem 0.5rem';
  list.style.paddingLeft = '1.25rem';
  list.style.listStyleType = 'none'; // We're using our own custom markers
  
  // Add a CSS class for animations and styling
  list.classList.add('animated-list');
  list.classList.add('ordered-list');
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
        backgroundColor: 'transparent', 
        padding: '2px 4px', 
        borderRadius: '3px',
        fontFamily: 'var(--font-code)',
        fontSize: '0.9em',
        color: 'var(--code-text-light)',
        borderBottom: '1px dotted rgba(0, 0, 0, 0.2)'
      }
    }, content);
  }
  
  // Process PHP filenames (like functions.php, index.php)
  if (/^[a-zA-Z0-9_\-]+\.php$/.test(code)) {
    return React.createElement('span', { 
      className: 'php-file',
      style: { 
        color: '#9D6ABF', 
        fontWeight: 'medium',
        fontFamily: 'var(--font-code)',
      }
    }, code);
  }
  
  // Process PHP functions (like __())
  if (/^__\([^)]+\)$/.test(code)) {
    return React.createElement('span', { 
      className: 'php-function',
      style: { 
        color: '#61AFEF', 
        fontWeight: 'medium',
        fontFamily: 'var(--font-code)',
      }
    }, code);
  }
  
  // Process PHP strings
  if (/^['"][^'"]*['"]$/.test(code)) {
    return React.createElement('span', { 
      className: 'php-string',
      style: { 
        color: '#98C379',
        fontFamily: 'var(--font-code)',
      }
    }, code);
  }
  
  // For any other inline code, apply generic styling
  return React.createElement('span', { 
    className: 'generic-code inline-code',
    style: { 
      backgroundColor: 'transparent', 
      padding: '2px 4px', 
      borderRadius: '3px',
      fontFamily: 'var(--font-code)',
      fontSize: '0.9em',
      color: 'var(--code-text-light)',
      borderBottom: '1px dotted rgba(0, 0, 0, 0.2)'
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
  onCopy: (code: string) => void;
  isCopied: boolean;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ className, children, onCopy, isCopied }) => {
  const match = /language-(\w+)/.exec(className || "");
  const { theme } = useTheme();
  
  // Call the transformation function when component mounts or updates
  useEffect(() => {
    transformDashesToLists();
  }, [children]); // Re-run when content changes
  
  // Simple trimming that preserves code formatting
  const codeString = children ? String(children).replace(/^\n|\n$/g, "") : "";
  
  // For inline code (no language specified)
  if (!match) {
    return (
      <code className="inline-code text-base px-1.5 py-0.5 rounded font-medium" style={{ 
        fontSize: '0.95rem',
        backgroundColor: 'transparent',
        color: theme === "dark" ? 'var(--code-text-dark)' : 'var(--code-text-light)',
        fontFamily: 'var(--font-code)',
        borderBottom: '1px dotted',
        borderBottomColor: theme === "dark" ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'
      }}>
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
    <div className="code-block-container relative" style={{ 
      width: '100%', 
      display: 'block', 
      margin: '0', 
      padding: '0',
      position: 'relative' 
    }}>
      {/* Copy button - fixed position that doesn't affect layout */}
      <button 
        onClick={() => onCopy(codeString)}
        className="absolute p-1.5 rounded-md transition-colors z-20 shadow-sm"
        aria-label="Copy code"
        style={{ 
          top: "4px",
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
          top: "4px",
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
          padding: '1.5rem 0.75rem 0.5rem 0.75rem',
          fontFamily: "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
          border: `1px solid ${borderColor}`,
          borderRadius: "6px",
          margin: 0,
          textAlign: 'left',
          display: 'block',
          position: 'relative',
          boxSizing: 'border-box',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
        wrapLines={true}
        wrapLongLines={false}
        useInlineStyles={true}
      >
        {processedCode}
      </SyntaxHighlighter>
      
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
          margin: 0.5rem 0 !important;
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