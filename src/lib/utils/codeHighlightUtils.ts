// React-syntax-highlighter already includes language definitions for these languages
// so we don't need to import them separately
import DOMPurify from 'isomorphic-dompurify';
import { marked } from 'marked';

/**
 * Maps file extensions and language identifiers to proper syntax highlighting language identifiers
 */
export const languageMap: Record<string, string> = {
  // JavaScript & React
  'js': 'javascript',
  'jsx': 'jsx',
  'javascript': 'javascript',
  'react': 'jsx',
  'reactjs': 'jsx',
  'react-jsx': 'jsx',
  
  // TypeScript & React
  'ts': 'typescript',
  'tsx': 'tsx',
  'typescript': 'typescript',
  
  // Other common languages
  'py': 'python',
  'python': 'python',
  'html': 'html',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'json': 'json',
  'md': 'markdown',
  'markdown': 'markdown',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'go': 'go',
  'php': 'php',
  'rb': 'ruby',
  'ruby': 'ruby',
  'rust': 'rust',
  'shell': 'bash',
  'bash': 'bash',
  'sh': 'bash',
  'sql': 'sql',
  'yaml': 'yaml',
  'yml': 'yaml',
  'xml': 'xml',
  'swift': 'swift',
  'kt': 'kotlin',
  'kotlin': 'kotlin',
  'cs': 'csharp',
  'csharp': 'csharp',
};

/**
 * Detects the programming language from code content if not explicitly specified
 * Uses heuristics to identify common patterns in different languages
 */
export const detectLanguage = (code: string, specifiedLang?: string): string => {
  // If a valid language is specified, use it
  if (specifiedLang && specifiedLang !== 'text' && languageMap[specifiedLang.toLowerCase()]) {
    return languageMap[specifiedLang.toLowerCase()];
  }
  
  // Check for file extension in the first line (like ```jsx or ```Card.jsx)
  const firstLine = code.split('\n')[0];
  if (firstLine) {
    // Check for file extension in the first line
    const fileExtMatch = firstLine.match(/\.(jsx|tsx|js|ts|md|py|html|css|json|php)$/i);
    if (fileExtMatch) {
      const ext = fileExtMatch[1].toLowerCase();
      return languageMap[ext] || ext;
    }
    
    // Check for React component name pattern in the first line (like Card, Button, etc.)
    const componentNameMatch = firstLine.match(/^([A-Z][a-zA-Z0-9]*)(\.jsx?)?$/);
    if (componentNameMatch) {
      // This is likely a React component
      return 'jsx';
    }
  }
  
  // React/JSX detection - improved to better detect React components
  if (
    (code.includes('import React') || 
     code.includes('from "react"') || 
     code.includes("from 'react'") ||
     code.includes('extends React.Component') ||
     code.includes('extends Component') ||
     code.includes('function Component') ||
     code.includes('const Component') ||
     /function\s+[A-Z][a-zA-Z]*\s*\(/g.test(code) || // Function components
     /const\s+[A-Z][a-zA-Z]*\s*=\s*(\(\)|React\.memo|\(props)/g.test(code) || // Arrow function components
     /import.*from\s+['"]react-router-dom['"]/g.test(code) || // React Router imports
     /import.*from\s+['"]@mui\/material['"]/g.test(code) || // Material UI imports
     /import.*from\s+['"]react-bootstrap['"]/g.test(code) || // React Bootstrap imports
     code.includes('<Route') || code.includes('<Link') || // React Router components
     code.includes('<Button') || code.includes('<Card') || code.includes('<Container')) && // Common UI components
    (code.includes('<') && code.includes('>') && // Has JSX brackets
     (code.includes('</') || code.includes('/>')) && // Has closing tags
     (code.includes('className=') || code.includes('onClick=') || 
      code.includes('props') || code.includes('children') ||
      code.includes('style=') || code.includes('id=')))
  ) {
    // If it has TypeScript syntax too, mark as TSX
    if (code.includes(': React.') || code.includes('<T>') || 
        code.includes('interface ') || code.includes('type ') ||
        code.includes(': Props') || /:\s*[A-Z][a-zA-Z]*Props/.test(code)) {
      return 'tsx';
    }
    return 'jsx';
  }
  
  // TypeScript detection
  if (
    code.includes('interface ') || 
    code.includes('type ') || 
    code.includes(': string') || 
    code.includes(': number') ||
    code.includes(': boolean') ||
    code.includes(': any') ||
    code.includes('<T>')
  ) {
    return 'typescript';
  }
  
  // JavaScript detection
  if (
    code.includes('const ') || 
    code.includes('let ') || 
    code.includes('function ') || 
    code.includes('=>') ||
    code.includes('import ') ||
    code.includes('export ')
  ) {
    return 'javascript';
  }
  
  // If no specific patterns detected, return specified language or default to text
  return specifiedLang?.toLowerCase() || 'text';
};

/**
 * CSS styles for syntax highlighting for different themes
 */
export const syntaxHighlightingStyles = `
  /* JSX/TSX Syntax - Dark Theme */
  .jsx-syntax .token.tag,
  .tsx-syntax .token.tag {
    color: #569CD6 !important;
  }
  
  .jsx-syntax .token.attr-name,
  .tsx-syntax .token.attr-name {
    color: #9CDCFE !important;
  }
  
  .jsx-syntax .token.attr-value,
  .tsx-syntax .token.attr-value,
  .jsx-syntax .token.string,
  .tsx-syntax .token.string {
    color: #CE9178 !important;
  }
  
  .jsx-syntax .token.punctuation,
  .tsx-syntax .token.punctuation {
    color: #D4D4D4 !important;
  }
  
  .jsx-syntax .token.operator,
  .tsx-syntax .token.operator {
    color: #D4D4D4 !important;
  }
  
  .jsx-syntax .token.comment,
  .tsx-syntax .token.comment {
    color: #6A9955 !important;
  }
  
  /* Common to JS, JSX, TS, TSX */
  .javascript-syntax .token.keyword,
  .jsx-syntax .token.keyword,
  .typescript-syntax .token.keyword,
  .tsx-syntax .token.keyword {
    color: #C586C0 !important;
  }
  
  .javascript-syntax .token.function,
  .jsx-syntax .token.function,
  .typescript-syntax .token.function,
  .tsx-syntax .token.function {
    color: #DCDCAA !important;
  }
  
  .javascript-syntax .token.boolean,
  .jsx-syntax .token.boolean,
  .typescript-syntax .token.boolean,
  .tsx-syntax .token.boolean,
  .javascript-syntax .token.number,
  .jsx-syntax .token.number,
  .typescript-syntax .token.number,
  .tsx-syntax .token.number {
    color: #b5cea8 !important;
  }
  
  .javascript-syntax .token.class-name,
  .jsx-syntax .token.class-name,
  .typescript-syntax .token.class-name,
  .tsx-syntax .token.class-name {
    color: #4EC9B0 !important;
  }
  
  /* Light theme overrides */
  .light-syntax-theme.jsx-syntax .token.tag,
  .light-syntax-theme.tsx-syntax .token.tag {
    color: #0000FF !important;
  }
  
  .light-syntax-theme.jsx-syntax .token.attr-name,
  .light-syntax-theme.tsx-syntax .token.attr-name {
    color: #FF0000 !important;
  }
  
  .light-syntax-theme.jsx-syntax .token.attr-value,
  .light-syntax-theme.tsx-syntax .token.attr-value,
  .light-syntax-theme.jsx-syntax .token.string,
  .light-syntax-theme.tsx-syntax .token.string {
    color: #A31515 !important;
  }
  
  .light-syntax-theme.jsx-syntax .token.keyword,
  .light-syntax-theme.tsx-syntax .token.keyword,
  .light-syntax-theme.javascript-syntax .token.keyword,
  .light-syntax-theme.typescript-syntax .token.keyword {
    color: #0000FF !important;
  }
  
  .light-syntax-theme.jsx-syntax .token.function,
  .light-syntax-theme.tsx-syntax .token.function,
  .light-syntax-theme.javascript-syntax .token.function,
  .light-syntax-theme.typescript-syntax .token.function {
    color: #795E26 !important;
  }
  
  .light-syntax-theme.jsx-syntax .token.comment,
  .light-syntax-theme.tsx-syntax .token.comment,
  .light-syntax-theme.javascript-syntax .token.comment,
  .light-syntax-theme.typescript-syntax .token.comment {
    color: #008000 !important;
  }
`;

/**
 * Interface for code block content
 */
export interface CodeBlock {
  type: 'code' | 'text';
  content: string;
  language?: string;
}

/**
 * Extract code blocks from markdown text
 * @param text The markdown text to process
 * @returns Array of code blocks and text segments
 */
export function extractCodeBlocks(text: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  
  // Early return for empty text
  if (!text?.trim()) {
    return blocks;
  }
  
  // Regex to find code blocks (text between triple backticks with optional language identifier)
  const codeBlockRegex = /```(\w+)?\s*(?:\(\s*([^)]+)\s*\))?\s*([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  
  // Process text and extract code blocks
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textContent = text.substring(lastIndex, match.index);
      // Only add if there's actual content
      if (textContent.trim()) {
        blocks.push({
          type: 'text',
          content: renderMarkdown(textContent),
        });
      }
    }
    
    // Extract language (if specified) and code content
    const language = match[1]?.toLowerCase();
    const fileName = match[2]; // Optional file name within parentheses
    const codeContent = match[3].trim();
    
    // Get effective language from file name or specified language
    let effectiveLanguage = language;
    if (fileName && !effectiveLanguage) {
      const fileExt = fileName.split('.').pop()?.toLowerCase();
      if (fileExt && languageMap[fileExt]) {
        effectiveLanguage = languageMap[fileExt];
      }
    }
    
    // Add the code block
    blocks.push({
      type: 'code',
      content: codeContent,
      language: effectiveLanguage || 'text',
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after the last code block
  if (lastIndex < text.length) {
    const textContent = text.substring(lastIndex);
    // Only add if there's actual content
    if (textContent.trim()) {
      blocks.push({
        type: 'text',
        content: renderMarkdown(textContent),
      });
    }
  }
  
  return blocks;
}

/**
 * Render markdown text to HTML
 * @param text Markdown text to render
 * @returns Sanitized HTML
 */
function renderMarkdown(text: string): string {
  // Parse markdown to HTML
  const rawHtml = marked.parse(text, { breaks: true });
  
  // Sanitize the HTML to prevent XSS
  const sanitizedHtml = DOMPurify.sanitize(
    // Ensure we're passing a string to sanitize by resolving any promise
    typeof rawHtml === 'string' ? rawHtml : String(rawHtml),
    {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'a', 'strong', 'em', 'code', 'pre',
        'blockquote', 'img', 'br', 'hr', 'table', 'thead', 'tbody',
        'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target'],
    }
  );
  
  return sanitizedHtml;
} 