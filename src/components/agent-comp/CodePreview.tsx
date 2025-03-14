"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { IoRefreshOutline } from 'react-icons/io5';
import { TbDeviceMobile, TbDeviceTablet, TbDeviceDesktop } from 'react-icons/tb';
import { detectLanguage, languageMap } from '@/lib/utils/codeHighlightUtils';
import { FiCopy, FiCheck, FiCode } from 'react-icons/fi';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Dynamically import CodeSyntaxHighlighter with no SSR to avoid hydration issues
const CodeSyntaxHighlighter = dynamic(
  () => import('@/components/ui/code-syntax-highlighter'),
  { ssr: false }
);

interface CodePreviewProps {
  code: string;
  language?: string;
  fileName?: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({
  code,
  language,
  fileName = ''
}) => {
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [displayMode, setDisplayMode] = useState<'code' | 'preview'>('code');
  const [viewportMode, setViewportMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Set client-side flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Determine the effective language for syntax highlighting
  const effectiveLanguage = detectLanguage(fileName, code);
  
  // Handle copying code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('Code copied to clipboard', {
        duration: 2000,
        style: {
          background: theme === 'dark' ? '#333' : '#fff',
          color: theme === 'dark' ? '#fff' : '#333',
        },
      });
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };
  
  // Helper function to determine if code is JSX/React
  const isReactCode = (content: string): boolean => {
    return content.includes('<') && content.includes('/>') && 
    (content.includes('import React') || 
     content.includes('useState') || 
     content.includes('className=') || 
     content.includes('props') ||
     content.includes('<div') ||
     content.includes('<span') ||
     content.includes('from "react"') ||
     content.includes("from 'react'")
    );
  };
  
  // Get preview content for iframe
  const getPreviewContent = (): string => {
    // Use our language detection utility to better detect the language
    let detectedLang = detectLanguage(fileName, code);
    
    // Check if this looks like JSX code even if not specifically marked as such
    if (isReactCode(code)) {
      detectedLang = language === 'typescript' || language === 'tsx' ? 'tsx' : 'jsx';
    }
    
    const normalizedLang = languageMap[detectedLang] || detectedLang;
    
    // Different preview templates based on language
    if (normalizedLang === 'html' || fileName.endsWith('.html')) {
      return code;
    } else if (
      normalizedLang === 'jsx' || 
      normalizedLang === 'tsx' || 
      normalizedLang === 'javascript' || 
      normalizedLang === 'typescript'
    ) {
      // For JS/TS files, wrap in HTML with React support
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen;
              padding: 20px;
              color: ${theme === 'dark' ? '#e0e0e0' : '#333'};
              background-color: ${theme === 'dark' ? '#1e1e1e' : '#f8f8f8'};
            }
            #console-output {
              margin-top: 20px;
              padding: 15px;
              background-color: ${theme === 'dark' ? '#2a2a2a' : '#f0f0f0'};
              border-radius: 4px;
              font-family: monospace;
            }
          </style>
          
          ${normalizedLang === 'jsx' || normalizedLang === 'tsx' 
            ? `<script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
               <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
               <script src="https://unpkg.com/@babel/standalone/babel.min.js" crossorigin></script>` 
            : ''}
        </head>
        <body>
          <div id="app"></div>
          <div id="console-output"></div>
          
          <script>
            // Capture console.log
            (function() {
              const oldLog = console.log;
              console.log = function(...args) {
                const output = document.getElementById('console-output');
                const line = document.createElement('div');
                line.textContent = args.map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ');
                output.appendChild(line);
                oldLog.apply(console, args);
              };
            })();
          </script>
          
          ${normalizedLang === 'jsx' || normalizedLang === 'tsx' 
            ? `<script type="text/babel">
                try {
                  ${code.replace(/import\s+.*?from\s+['"].*?['"]/g, '// $&')}
                } catch(e) {
                  console.log('Error:', e.message);
                }
              </script>` 
            : `<script>
                try {
                  ${code}
                } catch(e) {
                  console.log('Error:', e.message);
                }
              </script>`
          }
        </body>
        </html>
      `;
    } else {
      // Default for other languages - just show a message
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Preview Not Available</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              color: ${theme === 'dark' ? '#e0e0e0' : '#333'};
              background-color: ${theme === 'dark' ? '#1e1e1e' : '#f8f8f8'};
            }
            .message {
              text-align: center;
              max-width: 600px;
              padding: 20px;
            }
          </style>
        </head>
        <body>
          <div class="message">
            <h2>Preview not available for ${normalizedLang.toUpperCase()}</h2>
            <p>This language doesn't support direct preview in the browser.</p>
          </div>
        </body>
        </html>
      `;
    }
  };
  
  // Update iframe when content changes
  useEffect(() => {
    if (displayMode === 'preview' && iframeRef.current) {
      setIsLoading(true);
      
      try {
        const iframe = iframeRef.current;
        const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (iframeDocument) {
          iframeDocument.open();
          iframeDocument.write(getPreviewContent());
          iframeDocument.close();
        }
      } catch (error) {
        console.error('Error updating preview:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [code, language, fileName, theme, displayMode]);
  
  // Set viewport width based on selected mode
  const getViewportWidth = () => {
    switch (viewportMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%';
      default: return '100%';
    }
  };
  
  // Refresh preview
  const handleRefresh = () => {
    if (iframeRef.current && displayMode === 'preview') {
      setIsLoading(true);
      
      const iframe = iframeRef.current;
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (iframeDocument) {
        iframeDocument.open();
        iframeDocument.write(getPreviewContent());
        iframeDocument.close();
      }
      
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden">
      {/* Header with controls */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-gray-100 border-gray-200 text-gray-700'
      }`}>
        <div className="flex items-center gap-2">
          <FiCode size={16} className="text-gray-500" />
          <span className="font-medium">{fileName || 'Code Preview'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Display mode toggle */}
          <div className="flex border rounded overflow-hidden">
            <button 
              onClick={() => setDisplayMode('code')}
              className={`px-3 py-1 text-xs ${
                displayMode === 'code' 
                  ? theme === 'dark' 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-white text-gray-800' 
                  : theme === 'dark'
                    ? 'bg-gray-800 text-gray-400'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              Code
            </button>
            <button 
              onClick={() => setDisplayMode('preview')}
              className={`px-3 py-1 text-xs ${
                displayMode === 'preview' 
                  ? theme === 'dark' 
                    ? 'bg-gray-700 text-white' 
                    : 'bg-white text-gray-800' 
                  : theme === 'dark'
                    ? 'bg-gray-800 text-gray-400'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              Preview
            </button>
          </div>
          
          {/* Actions */}
          {displayMode === 'preview' ? (
            <div className="flex space-x-1">
              <button 
                onClick={() => setViewportMode('mobile')}
                className={`p-1.5 rounded ${
                  viewportMode === 'mobile' 
                    ? 'text-blue-500' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <TbDeviceMobile size={16} />
              </button>
              <button 
                onClick={() => setViewportMode('tablet')}
                className={`p-1.5 rounded ${
                  viewportMode === 'tablet' 
                    ? 'text-blue-500' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <TbDeviceTablet size={16} />
              </button>
              <button 
                onClick={() => setViewportMode('desktop')}
                className={`p-1.5 rounded ${
                  viewportMode === 'desktop' 
                    ? 'text-blue-500' 
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <TbDeviceDesktop size={16} />
              </button>
              <button 
                onClick={handleRefresh}
                className="p-1.5 rounded text-gray-400 hover:text-gray-200"
              >
                <IoRefreshOutline className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-gray-200"
            >
              {copied ? (
                <>
                  <FiCheck size={14} className="text-green-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <FiCopy size={14} />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {/* Code view */}
        {displayMode === 'code' ? (
          <div className="w-full h-full overflow-auto">
            {isClient ? (
              <CodeSyntaxHighlighter
                code={code}
                language={effectiveLanguage}
                showLineNumbers={true}
                wrapLines={false}
              />
            ) : (
              // Server-side rendering placeholder
              <pre className="w-full h-full p-4 overflow-auto font-mono text-sm">
                {code}
              </pre>
            )}
          </div>
        ) : (
          /* Preview mode */
          <div className="w-full h-full overflow-auto bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
            <div 
              className="transition-all duration-300 h-full bg-white" 
              style={{ width: getViewportWidth() }}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 z-10">
                  <div className="w-10 h-10 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
                </div>
              )}
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                title="Code Preview"
                sandbox="allow-scripts"
              ></iframe>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodePreview; 