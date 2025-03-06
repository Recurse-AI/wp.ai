"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { IoRefreshOutline } from 'react-icons/io5';
import { TbDeviceMobile, TbDeviceTablet, TbDeviceDesktop } from 'react-icons/tb';

interface CodePreviewProps {
  content?: string;
  language?: string;
  fileName?: string;
}

const CodePreview: React.FC<CodePreviewProps> = ({
  content = '',
  language = 'html',
  fileName = 'index.html'
}) => {
  const { theme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewportMode, setViewportMode] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  
  // Get appropriate content for preview based on language
  const getPreviewContent = (): string => {
    if (language === 'html' || fileName.endsWith('.html')) {
      return content;
    } else if (language === 'jsx' || language === 'tsx' || language === 'js' || language === 'ts') {
      // For JS files, wrap in HTML to preview output
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>JS Preview</title>
          <script>
            // Console log interceptor
            (function(){
              const oldLog = console.log;
              const output = document.getElementById('console-output');
              
              console.log = function(...args) {
                const line = document.createElement('div');
                line.textContent = args.map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg) : arg
                ).join(' ');
                if (output) output.appendChild(line);
                oldLog.apply(console, args);
              };
            })();
          </script>
        </head>
        <body style="font-family: sans-serif; margin: 0; padding: 12px;">
          <div id="app"></div>
          <div style="margin-top: 20px; border-top: 1px solid #eaeaea; padding-top: 12px;">
            <h3>Console Output:</h3>
            <pre id="console-output" style="background-color: #f7f7f7; padding: 12px; border-radius: 4px; overflow: auto;"></pre>
          </div>
          <script type="module">
            try {
              ${content}
              
              // Execute any exported render functions if they exist
              if (typeof render === 'function') {
                render(document.getElementById('app'));
              }
            } catch (error) {
              console.log('Error: ' + error.message);
            }
          </script>
        </body>
        </html>
      `;
    } else if (language === 'css') {
      // For CSS files, create a demo HTML with the CSS applied
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>CSS Preview</title>
          <style>
            ${content}
          </style>
        </head>
        <body style="font-family: sans-serif; margin: 0; padding: 12px;">
          <div class="container">
            <h1>CSS Preview</h1>
            <p>This is a preview of your CSS. Add specific HTML in your CSS file comments to customize this preview.</p>
            <div class="demo-box" style="width: 100px; height: 100px; background-color: #ddd;">Demo Box</div>
            <button class="button">Button</button>
          </div>
        </body>
        </html>
      `;
    } else {
      // For other languages, show "preview not available"
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview Not Available</title>
        </head>
        <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: ${theme === 'dark' ? '#1a1a1a' : '#f5f5f5'}; color: ${theme === 'dark' ? '#fff' : '#333'};">
          <div style="text-align: center;">
            <h2>Preview not available for ${language} files</h2>
            <p>Only HTML, CSS, and JavaScript files can be previewed.</p>
          </div>
        </body>
        </html>
      `;
    }
  };
  
  // Update preview when content changes
  useEffect(() => {
    if (iframeRef.current) {
      setIsLoading(true);
      
      try {
        const iframe = iframeRef.current;
        const previewContent = getPreviewContent();
        
        // Write content to iframe
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(previewContent);
          iframeDoc.close();
        }
      } catch (error) {
        console.error('Error updating preview:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [content, language, fileName, theme]);
  
  // Handle iframe load event
  const handleIframeLoad = () => {
    setIsLoading(false);
  };
  
  // Refresh preview
  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true);
      const iframe = iframeRef.current;
      iframe.src = 'about:blank';
      
      setTimeout(() => {
        const previewContent = getPreviewContent();
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(previewContent);
          iframeDoc.close();
        }
      }, 100);
    }
  };
  
  // Set viewport width based on selected mode
  const getViewportWidth = () => {
    switch (viewportMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      case 'desktop': return '100%';
      default: return '100%';
    }
  };
  
  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden">
      {/* Preview header */}
      <div className={`flex items-center justify-between px-4 py-2 ${
        theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
      }`}>
        <div className="font-medium">
          Preview: {fileName}
        </div>
        <div className="flex space-x-3">
          <div className="flex space-x-1">
            <button 
              onClick={() => setViewportMode('mobile')}
              className={`p-1.5 rounded ${viewportMode === 'mobile' 
                ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-800' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title="Mobile view"
            >
              <TbDeviceMobile />
            </button>
            <button 
              onClick={() => setViewportMode('tablet')}
              className={`p-1.5 rounded ${viewportMode === 'tablet' 
                ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-800' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title="Tablet view"
            >
              <TbDeviceTablet />
            </button>
            <button 
              onClick={() => setViewportMode('desktop')}
              className={`p-1.5 rounded ${viewportMode === 'desktop' 
                ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-800' 
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              title="Desktop view"
            >
              <TbDeviceDesktop />
            </button>
          </div>
          <button 
            onClick={handleRefresh}
            className={`p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white`}
            title="Refresh preview"
          >
            <IoRefreshOutline className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {/* Preview Container */}
      <div className="flex-1 flex items-center justify-center overflow-auto bg-gray-100">
        <div 
          className={`transition-all duration-300 h-full bg-white ${
            viewportMode !== 'desktop' ? 'border-x border-gray-300 shadow-md' : ''
          }`}
          style={{ width: getViewportWidth() }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-10">
              <div className="w-10 h-10 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            </div>
          )}
          <iframe 
            ref={iframeRef}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin"
            title="Code Preview"
            onLoad={handleIframeLoad}
          />
        </div>
      </div>
    </div>
  );
};

export default CodePreview; 