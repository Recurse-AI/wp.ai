"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AgentPreviewProps } from '../../types';
import { useTheme } from '@/context/ThemeProvider';
import { Loader2, RefreshCw } from 'lucide-react';
import WordPressPlayground from './WordPressPlayground';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

const AgentPreview: React.FC<AgentPreviewProps> = ({
  files,
  activeFile,
  currentService
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'code' | 'wordpress'>('code');
  
  // Auto-detect WordPress content in addition to checking service ID
  const isWordPressContent = React.useMemo(() => {
    // Check for WordPress plugin structure
    const hasWordPressFiles = Object.entries(files).some(([key, value]) => {
      if (typeof value === 'object' && value.type === 'folder') {
        // Look for PHP files with WordPress plugin header
        const hasPluginFile = Object.entries(value.children || {}).some(([childKey, childValue]) => {
          if (childKey.endsWith('.php') && 
              typeof childValue === 'object' && 
              childValue.type === 'file' && 
              typeof childValue.content === 'string') {
            return childValue.content.includes('Plugin Name:') || 
                   childValue.content.includes('Theme Name:');
          }
          return false;
        });
        return hasPluginFile;
      }
      return false;
    });
    
    return hasWordPressFiles;
  }, [files]);
  
  const isWordPressPlayground = currentService?.id === 'wp-playground' || isWordPressContent;

  // Fix for the content type error
  const getFileContent = (file: any): string => {
    return file && typeof file.content === 'string' ? file.content : '';
  };

  // Generate HTML preview content from the current files
  const generatePreviewContent = () => {
    // If we have an active HTML file, use that as the main content
    const htmlFile = findFileByExtension('.html');
    const cssFiles = findAllFilesByExtension('.css');
    const jsFiles = findAllFilesByExtension('.js', '.jsx', '.ts', '.tsx');
    
    let htmlContent = '';
    
    if (htmlFile) {
      htmlContent = getFileContent(htmlFile);
    } else {
      // If no HTML file, create a simple HTML wrapper
      htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.5; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    pre { background: #f5f5f5; border-radius: 4px; padding: 10px; overflow: auto; }
    ${isDark ? 'body { background: #1a1a1a; color: #fff; } pre { background: #333; color: #eee; }' : ''}
  </style>
  ${cssFiles.map(file => `<style>${getFileContent(file)}</style>`).join('\n')}
</head>
<body>
  <div class="container">
    <h1>Preview</h1>
    ${activeFile ? `<p>Viewing: ${activeFile.name}</p>` : ''}
    ${activeFile ? `<pre>${getFileContent(activeFile)}</pre>` : '<p>No file selected</p>'}
  </div>
  ${jsFiles.map(file => `<script>${getFileContent(file)}</script>`).join('\n')}
</body>
</html>`;
    }
    
    return htmlContent;
  };
  
  // Find a file with the specified extension
  const findFileByExtension = (...extensions: string[]) => {
    if (!files) return null;
    
    // First try to find in the root
    for (const [name, file] of Object.entries(files)) {
      if (file.type === 'file' && extensions.some(ext => name.endsWith(ext))) {
        return file;
      }
    }
    
    // Then look in folders
    for (const [_, folder] of Object.entries(files)) {
      if (folder.type === 'folder' && folder.children) {
        for (const [name, file] of Object.entries(folder.children)) {
          if (file.type === 'file' && extensions.some(ext => name.endsWith(ext))) {
            return file;
          }
        }
      }
    }
    
    return null;
  };
  
  // Find all files with the specified extensions
  const findAllFilesByExtension = (...extensions: string[]) => {
    const result: any[] = [];
    
    if (!files) return result;
    
    // First check root files
    Object.entries(files).forEach(([name, file]) => {
      if (file.type === 'file' && extensions.some(ext => name.endsWith(ext))) {
        result.push(file);
      }
    });
    
    // Then check in folders
    Object.entries(files).forEach(([_, folder]) => {
      if (folder.type === 'folder' && folder.children) {
        Object.entries(folder.children).forEach(([name, file]) => {
          if (file.type === 'file' && extensions.some(ext => name.endsWith(ext))) {
            result.push(file);
          }
        });
      }
    });
    
    return result;
  };

  // Get preview content based on file type
  const getPreviewContent = () => {
    if (!activeFile) {
      return (
        <div className="flex-1 flex items-center justify-center p-4 text-gray-500">
          <p>Select a file to preview</p>
        </div>
      );
    }
    
    const fileExt = activeFile.name.split('.').pop()?.toLowerCase();
    const fileContent = getFileContent(activeFile);
    
    // For HTML files, we can render directly in an iframe
    if (fileExt === 'html' || fileExt === 'htm') {
      const blob = new Blob([fileContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      return (
        <iframe 
          src={url} 
          className="w-full h-full border-0" 
          title="HTML Preview"
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => URL.revokeObjectURL(url)}
        />
      );
    }
    
    // For CSS files, generate a preview with a sample of styled elements
    if (fileExt === 'css') {
      return (
        <iframe
          srcDoc={`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>${fileContent}</style>
              <style>
                body { padding: 20px; font-family: system-ui, sans-serif; }
                .sample { margin-bottom: 20px; }
                h3 { margin-top: 30px; }
              </style>
            </head>
            <body>
              <h1>CSS Preview</h1>
              <p>This is how your CSS styles affect HTML elements:</p>
              
              <h3>Headings</h3>
              <div class="sample">
                <h1>Heading 1</h1>
                <h2>Heading 2</h2>
                <h3>Heading 3</h3>
              </div>
              
              <h3>Text Elements</h3>
              <div class="sample">
                <p>This is a paragraph with <a href="#">a link</a> and <strong>bold text</strong>.</p>
                <blockquote>This is a blockquote element.</blockquote>
              </div>
              
              <h3>Lists</h3>
              <div class="sample">
                <ul>
                  <li>Unordered list item 1</li>
                  <li>Unordered list item 2</li>
                </ul>
                
                <ol>
                  <li>Ordered list item 1</li>
                  <li>Ordered list item 2</li>
                </ol>
              </div>
              
              <h3>Form Elements</h3>
              <div class="sample">
                <form>
                  <div>
                    <label for="input">Input:</label>
                    <input type="text" id="input" placeholder="Text input">
                  </div>
                  <div>
                    <label for="select">Select:</label>
                    <select id="select">
                      <option>Option 1</option>
                      <option>Option 2</option>
                    </select>
                  </div>
                  <div>
                    <button type="button">Button</button>
                  </div>
                </form>
              </div>
            </body>
            </html>
          `}
          className="w-full h-full border-0"
          title="CSS Preview"
        />
      );
    }
    
    // For JavaScript files, display the code and output
    if (fileExt === 'js' || fileExt === 'jsx' || fileExt === 'ts' || fileExt === 'tsx') {
      return (
        <iframe
          srcDoc={`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: system-ui, sans-serif; padding: 20px; line-height: 1.5; }
                pre { background: #f5f5f5; border-radius: 4px; padding: 10px; overflow: auto; }
                .console { 
                  background: #2d2d2d; 
                  color: #fff; 
                  padding: 10px; 
                  border-radius: 4px; 
                  margin-top: 20px;
                  font-family: monospace;
                  height: 150px;
                  overflow: auto;
                }
                .console-item { margin-bottom: 4px; border-bottom: 1px solid #444; padding-bottom: 4px; }
                ${isDark ? 'body { background: #1a1a1a; color: #fff; } pre { background: #333; color: #eee; }' : ''}
              </style>
            </head>
            <body>
              <h1>JavaScript Preview</h1>
              <p>Source code:</p>
              <pre>${fileContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
              
              <h3>Console Output:</h3>
              <div id="console" class="console"></div>
              
              <script>
                // Capture console outputs
                const consoleEl = document.getElementById('console');
                const originalConsole = console;
                
                function logToElement(type, args) {
                  const item = document.createElement('div');
                  item.className = 'console-item';
                  item.innerHTML = \`<span>\${type}: \${Array.from(args).map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                  ).join(' ')}</span>\`;
                  consoleEl.appendChild(item);
                }
                
                console.log = function() { 
                  originalConsole.log.apply(this, arguments);
                  logToElement('log', arguments);
                };
                console.error = function() {
                  originalConsole.error.apply(this, arguments);
                  logToElement('error', arguments);
                };
                console.warn = function() {
                  originalConsole.warn.apply(this, arguments);
                  logToElement('warn', arguments);
                };
                console.info = function() {
                  originalConsole.info.apply(this, arguments);
                  logToElement('info', arguments);
                };
                
                // Try to execute the JS (wrapped in try/catch to prevent page crashes)
                try {
                  setTimeout(() => {
                    // Execute in a timeout to ensure UI is ready
                    const script = document.createElement('script');
                    script.textContent = \`
                      try {
                        ${fileContent}
                      } catch (error) {
                        console.error('Execution error:', error.message);
                      }
                    \`;
                    document.body.appendChild(script);
                  }, 100);
                } catch (error) {
                  console.error('Script load error:', error.message);
                }
              </script>
            </body>
            </html>
          `}
          className="w-full h-full border-0"
          title="JavaScript Preview"
          sandbox="allow-scripts"
        />
      );
    }
    
    // For other file types, display the raw content
    return (
      <div className="flex-1 p-4 overflow-auto">
        <pre className={`text-sm p-4 rounded ${isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
          {fileContent}
        </pre>
      </div>
    );
  };

  // Initialize preview when component mounts
  useEffect(() => {
    let mounted = true;
    let timeout: NodeJS.Timeout;

    const initializePreview = async () => {
      if (!mounted) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // For non-WordPress playground services, simulate loading
        if (!isWordPressPlayground) {
          // Generate preview content
          const content = generatePreviewContent();
          setPreviewContent(content);
          
          timeout = setTimeout(() => {
            if (mounted) {
              setLoading(false);
              setPreviewReady(true);
            }
          }, 500);
        } else {
          // For WordPress playground, the loading state is managed by the component
          setPreviewReady(true);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error initializing preview:', error);
          setError('Failed to initialize preview');
          setLoading(false);
        }
      }
    };
    
    initializePreview();
    
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [isWordPressPlayground, files, activeFile, isDark]);

  // Update preview when files change
  useEffect(() => {
    if (!previewReady || !files) return;
    
    const updateFiles = async () => {
      if (!isWordPressPlayground) {
        console.log('Updating preview with files:', files);
        // Update preview content
        const content = generatePreviewContent();
        setPreviewContent(content);
      }
      // WordPress Playground component handles its own file updates
    };
    
    updateFiles();
  }, [files, previewReady, isWordPressPlayground, activeFile]);

  // Handle refresh preview
  const handleRefresh = () => {
    setLoading(true);
    
    // For non-WordPress playground services
    if (!isWordPressPlayground) {
      // Re-generate preview content
      const content = generatePreviewContent();
      setPreviewContent(content);
      
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } else {
      // For WordPress playground, we force a re-render by toggling the key
      setPreviewReady(false);
      setTimeout(() => {
        setPreviewReady(true);
        setLoading(false);
      }, 100);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Preview header */}
      <div className={`flex items-center justify-between px-4 py-2 ${
        isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200'
      } border-b`}>
        <div className="text-sm font-medium">
          {isWordPressPlayground ? 'WordPress Preview' : 
           activeFile ? `Preview: ${activeFile.name}` : 'Preview'}
        </div>
        
        <div className="flex items-center space-x-2">
          <Select
            value={previewMode}
            onValueChange={(value: 'code' | 'wordpress') => {
              setPreviewMode(value);
              console.log(`Setting preview mode to ${value}`);
            }}
          >
            <SelectTrigger className="h-7 text-xs w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="wordpress">WordPress</SelectItem>
            </SelectContent>
          </Select>
          
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh preview"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      {/* Preview content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Loading state for non-WordPress services */}
        {loading && !isWordPressPlayground && (
          <div className={`absolute inset-0 flex items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="text-center">
              <Loader2 className={`w-8 h-8 mx-auto animate-spin ${
                isDark ? 'text-blue-400' : 'text-blue-500'
              }`} />
              <p className="mt-2 text-sm text-gray-500">
                Loading preview...
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 p-4">
            <div className="max-w-md text-center">
              <p className="text-red-500 font-medium">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {/* WordPress Playground */}
        {(isWordPressPlayground || previewMode === 'wordpress') && previewReady && (
          <WordPressPlayground 
            files={files || {}} 
            className="w-full h-full"
          />
        )}
        
        {/* Default iframe for other services */}
        {!isWordPressPlayground && previewMode === 'code' && !loading && !error && (
          <div className="w-full h-full">
            {getPreviewContent()}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentPreview; 