/**
 * This file initializes any global configurations needed before the application starts.
 * It ensures that syntax highlighting is properly registered and configured.
 */

import { useEffect, useState } from 'react';
import './utils/syntaxRegistration';

// Create a custom hook to handle syntax highlighting setup
export function useSyntaxHighlighting() {
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    // Only run this code on the client side
    // Define global styles for code syntax highlighting
    let styleEl = document.getElementById('syntax-highlight-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'syntax-highlight-styles';
      document.head.appendChild(styleEl);
    }

    // Add CSS rules for better syntax highlighting
    styleEl.textContent = `
      /* VS Code-like styling */
      pre {
        border-radius: 4px;
        overflow: auto;
        font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
        font-size: 14px;
        line-height: 1.5;
        padding: 0;
        margin: 0;
        background: #1e1e1e;
      }
      
      /* VS Code scrollbars */
      pre::-webkit-scrollbar {
        width: 14px;
        height: 14px;
      }
      
      pre::-webkit-scrollbar-track {
        background: #1e1e1e;
      }
      
      pre::-webkit-scrollbar-thumb {
        background: #424242;
        border-radius: 3px;
        border: 4px solid transparent;
        background-clip: padding-box;
      }
      
      pre::-webkit-scrollbar-thumb:hover {
        background: #4f4f4f;
        border: 4px solid transparent;
        background-clip: padding-box;
      }
      
      .light-syntax-theme pre {
        background: #ffffff;
      }
      
      .light-syntax-theme pre::-webkit-scrollbar-track {
        background: #f3f3f3;
      }
      
      .light-syntax-theme pre::-webkit-scrollbar-thumb {
        background: #c1c1c1;
      }
      
      .light-syntax-theme pre::-webkit-scrollbar-thumb:hover {
        background: #a9a9a9;
      }
      
      /* Line numbers styling - VS Code style */
      code {
        counter-reset: line;
      }
      
      code .line-number {
        counter-increment: line;
        display: inline-block;
        padding: 0 1em 0 0;
        margin-right: 1em;
        text-align: right;
        color: #858585;
        border-right: 1px solid #333333;
        min-width: 4em;
      }
      
      .vscode-theme pre {
        box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(0, 0, 0, 0.2);
      }
      
      /* Enhanced token colors for various languages */
      /* Common syntax */
      .token.comment,
      .token.prolog,
      .token.doctype,
      .token.cdata {
        color: #6a9955;
      }
      
      /* Improved React/JSX highlighting */
      .react-code .token.tag,
      .jsx-syntax .token.tag,
      .tsx-syntax .token.tag {
        color: #569cd6 !important;
      }
      
      .react-code .token.attr-name,
      .jsx-syntax .token.attr-name,
      .tsx-syntax .token.attr-name {
        color: #9cdcfe !important;
      }
      
      .react-code .token.attr-value,
      .jsx-syntax .token.attr-value,
      .tsx-syntax .token.attr-value {
        color: #ce9178 !important;
      }
      
      .react-code .token.punctuation,
      .jsx-syntax .token.punctuation,
      .tsx-syntax .token.punctuation {
        color: #d4d4d4 !important;
      }
      
      .react-code .token.string,
      .jsx-syntax .token.string,
      .tsx-syntax .token.string {
        color: #ce9178 !important;
      }
      
      .react-code .token.keyword,
      .jsx-syntax .token.keyword,
      .tsx-syntax .token.keyword {
        color: #c586c0 !important;
      }
      
      .react-code .token.function-name,
      .jsx-syntax .token.function-name,
      .tsx-syntax .token.function-name,
      .react-code .token.function,
      .jsx-syntax .token.function,
      .tsx-syntax .token.function {
        color: #dcdcaa !important;
      }
      
      .react-code .token.component,
      .jsx-syntax .token.component,
      .tsx-syntax .token.component {
        color: #4ec9b0 !important;
      }
      
      /* Special case for React component names in declarations */
      .react-code .token.class-name,
      .jsx-syntax .token.class-name,
      .tsx-syntax .token.class-name {
        color: #4ec9b0 !important;
      }
      
      /* Visual distinction for JSX code blocks */
      .react-code {
        border-left: 3px solid #61dafb80;
      }
      
      /* Light theme variants */
      .light-syntax-theme .react-code .token.tag,
      .light-syntax-theme .jsx-syntax .token.tag,
      .light-syntax-theme .tsx-syntax .token.tag {
        color: #0000ff !important;
      }
      
      .light-syntax-theme .react-code .token.attr-name,
      .light-syntax-theme .jsx-syntax .token.attr-name,
      .light-syntax-theme .tsx-syntax .token.attr-name {
        color: #ff0000 !important;
      }
      
      .light-syntax-theme .react-code .token.attr-value,
      .light-syntax-theme .jsx-syntax .token.attr-value,
      .light-syntax-theme .tsx-syntax .token.attr-value,
      .light-syntax-theme .react-code .token.string,
      .light-syntax-theme .jsx-syntax .token.string,
      .light-syntax-theme .tsx-syntax .token.string {
        color: #a31515 !important;
      }
      
      .light-syntax-theme .react-code .token.function,
      .light-syntax-theme .jsx-syntax .token.function,
      .light-syntax-theme .tsx-syntax .token.function {
        color: #795e26 !important;
      }
      
      .light-syntax-theme .react-code .token.class-name,
      .light-syntax-theme .jsx-syntax .token.class-name,
      .light-syntax-theme .tsx-syntax .token.class-name {
        color: #267f99 !important;
      }
      
      .light-syntax-theme .react-code .token.keyword,
      .light-syntax-theme .jsx-syntax .token.keyword,
      .light-syntax-theme .tsx-syntax .token.keyword {
        color: #0000ff !important;
      }
      
      /* Ensure file extension detection triggers proper highlighting */
      pre[data-language="jsx"],
      pre[data-language="tsx"],
      pre.language-jsx,
      pre.language-tsx {
        border-left: 3px solid #61dafb80;
      }
      
      /* Token colors for various languages */
      .token.punctuation {
        color: #d4d4d4;
      }
      
      .token.property,
      .token.tag,
      .token.constant,
      .token.symbol,
      .token.deleted {
        color: #569cd6;
      }
      
      .token.boolean,
      .token.number {
        color: #b5cea8;
      }
      
      .token.selector,
      .token.char,
      .token.builtin,
      .token.inserted {
        color: #ce9178;
      }
      
      .token.operator,
      .token.entity,
      .token.url,
      .language-css .token.string,
      .style .token.string {
        color: #d4d4d4;
      }
      
      .token.atrule,
      .token.attr-value,
      .token.keyword {
        color: #c586c0;
      }
      
      .token.function,
      .token.class-name {
        color: #dcdcaa;
      }
      
      .token.regex,
      .token.important,
      .token.variable {
        color: #d16969;
      }
      
      /* React JSX/TSX specific styles */
      .language-jsx .token.tag,
      .language-jsx .token.tag .token.punctuation,
      .language-tsx .token.tag,
      .language-tsx .token.tag .token.punctuation {
        color: #569cd6;
      }
      
      .language-jsx .token.tag .token.script,
      .language-tsx .token.tag .token.script {
        color: inherit;
      }
      
      .language-jsx .token.tag .token.attr-name,
      .language-tsx .token.tag .token.attr-name {
        color: #9cdcfe;
      }
      
      .language-jsx .token.tag .token.attr-value,
      .language-tsx .token.tag .token.attr-value,
      .language-jsx .token.tag .token.attr-value .token.punctuation,
      .language-tsx .token.tag .token.attr-value .token.punctuation {
        color: #ce9178;
      }
      
      /* JavaScript specific styles */
      .language-javascript .token.string,
      .language-js .token.string {
        color: #ce9178;
      }
      
      .language-javascript .token.function,
      .language-js .token.function,
      .language-jsx .token.function,
      .language-tsx .token.function {
        color: #dcdcaa;
      }
      
      .language-javascript .token.keyword,
      .language-js .token.keyword,
      .language-jsx .token.keyword,
      .language-tsx .token.keyword {
        color: #569cd6;
      }
      
      /* Make sure we override language-text (which defaults to plain text) */
      .language-text {
        color: inherit;
      }
      
      /* Fix for visual glitches in very long code blocks */
      pre[class*="language-"] {
        position: relative;
        overflow: auto;
        max-width: 100%;
      }
      
      /* Ensure code blocks have proper padding */
      pre.code-block {
        margin: 1em 0;
        padding: 1em;
        overflow: auto;
      }
    `;
    
    // Fix for hydration issues with syntax highlighting
    setTimeout(() => {
      document.querySelectorAll('pre').forEach(block => {
        if (block.className.includes('language-') && !block.getAttribute('data-syntax-processed')) {
          block.setAttribute('data-syntax-processed', 'true');
          const language = Array.from(block.classList)
            .find(cls => cls.startsWith('language-'))
            ?.replace('language-', '');
          
          if (language) {
            block.classList.add(`${language}-syntax`);
          }
        }
      });
    }, 0);
    
    setInitialized(true);
  }, []);
  
  return initialized;
}

// Export an empty object to maintain module structure
export default {}; 