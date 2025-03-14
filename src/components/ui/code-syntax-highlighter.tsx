"use client";
import React, { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { SyntaxHighlighter } from '@/lib/utils/syntaxRegistration';
import { vs, vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { detectLanguage } from '@/lib/utils/codeHighlightUtils';

interface CodeSyntaxHighlighterProps {
  code: string;
  language?: string;
  wrapLines?: boolean;
  showLineNumbers?: boolean;
  className?: string;
}

const CodeSyntaxHighlighter: React.FC<CodeSyntaxHighlighterProps> = ({
  code,
  language,
  wrapLines = false,
  showLineNumbers = false,
  className = '',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mountComplete, setMountComplete] = useState(false);
  
  useEffect(() => {
    // Mark component as mounted to ensure client-side rendering is complete
    setMountComplete(true);
  }, []);
  
  // Detect language from code if not specified
  const detectedLanguage = detectLanguage(code, language);
  
  // Special handling for JSX/TSX files
  let effectiveLanguage = detectedLanguage || 'text';
  let isReactCode = false;
  
  // Additional check for React/JSX code
  if (
    effectiveLanguage === 'jsx' || 
    effectiveLanguage === 'tsx' || 
    code.includes('import React') || 
    code.includes('<') && code.includes('>') && code.includes('</') && 
    (code.includes('className=') || code.includes('props') || code.includes('Component'))
  ) {
    isReactCode = true;
    // Ensure we use jsx or tsx for React code
    if (effectiveLanguage === 'javascript' || effectiveLanguage === 'js') {
      effectiveLanguage = 'jsx';
    } else if (effectiveLanguage === 'typescript' || effectiveLanguage === 'ts') {
      effectiveLanguage = 'tsx';
    }
  }
  
  // Default to system theme if theme isn't resolved yet
  const style = isDark ? vscDarkPlus : vs;
  
  // Enhanced styles for React code
  const customStyle = {
    padding: '0.75rem 0', // VS Code-like padding
    margin: 0,
    borderRadius: '4px',
    fontSize: '14px',
    fontFamily: '"Consolas", "Monaco", "Andale Mono", "Ubuntu Mono", monospace',
    lineHeight: '1.5',
    whiteSpace: wrapLines ? 'pre-wrap' : 'pre',
    background: isDark ? '#1e1e1e' : '#ffffff', // VS Code exact background colors
    boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${isDark ? '#252526' : '#e4e4e4'}`, // VS Code-like borders
  };

  const lineNumberStyle = {
    minWidth: '2.5em',
    paddingRight: '1em',
    textAlign: 'right' as const,
    color: isDark ? '#858585' : '#a0a0a0',
    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    borderRight: `1px solid ${isDark ? '#333333' : '#e4e4e4'}`,
    userSelect: 'none' as const,
    fontSize: '13px',
    fontFamily: '"Consolas", "Monaco", "Andale Mono", "Ubuntu Mono", monospace',
  };

  return (
    <div className={`relative overflow-hidden rounded-md vscode-theme ${className}`}>
      {mountComplete && (
        <SyntaxHighlighter
          language={effectiveLanguage}
          style={style}
          showLineNumbers={showLineNumbers}
          wrapLongLines={wrapLines}
          customStyle={customStyle}
          lineNumberStyle={lineNumberStyle}
          codeTagProps={{
            style: {
              fontFamily: '"Consolas", "Monaco", "Andale Mono", "Ubuntu Mono", monospace',
              fontSize: '14px',
            }
          }}
          className={`language-${effectiveLanguage} ${effectiveLanguage}-syntax ${isDark ? 'dark' : 'light'}-syntax-theme ${isReactCode ? 'react-code' : ''}`}
        >
          {code}
        </SyntaxHighlighter>
      )}
    </div>
  );
};

export default CodeSyntaxHighlighter; 