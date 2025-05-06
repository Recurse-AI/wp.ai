import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useTheme } from '@/context/ThemeProvider';
import { LiHTMLAttributes, TableHTMLAttributes, HTMLAttributes } from 'react';
import { Check, Copy, ExternalLink, Folder, FileText, File, Code as CodeIcon } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { detectLanguage } from '@/lib/utils/codeHighlightUtils';

// Add type declarations for modules without types
declare module 'remark-math';
declare module 'rehype-katex';

// Custom interfaces for ReactMarkdown component props
interface MarkdownLiProps extends LiHTMLAttributes<HTMLLIElement> {
  checked?: boolean;
}

interface MarkdownTrProps extends HTMLAttributes<HTMLTableRowElement> {
  isHeader?: boolean;
}

interface CodeProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface MessageContentProps {
  content: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  hideCodeInMessages?: boolean;
}

// Improved renderFileHierarchy function for better plugin structure display
const renderFileHierarchy = (content: string, isDark: boolean) => {
  // Check if this is a file structure block
  if (content.includes('File:') || content.includes('📂') || /^\s*[├└─│]/.test(content)) {
    // Extract file structure lines and organize them
    const lines = content.split('\n').filter(line => line.trim());
    let rootFolder = '';
    
    // Try to identify root folder
    if (lines.length > 0 && lines[0].includes('📂')) {
      rootFolder = lines[0].replace('📂', '').trim();
    }
    
    return (
      <div className={`rounded-md overflow-hidden my-3 ${
        isDark ? 'bg-gray-800/80 border-l-2 border-blue-600' : 'bg-gray-900/90 border-l-2 border-green-600'
      }`}>
        <div className={`flex items-center justify-between px-4 py-2 text-xs ${
          isDark ? 'bg-gray-700/80 text-gray-200' : 'bg-gray-800/90 text-green-300'
        }`}>
          <div className="flex items-center">
            <Folder className={`w-4 h-4 mr-2 ${isDark ? 'text-blue-400' : 'text-green-500'}`} />
            <span className="font-medium">{rootFolder ? `Plugin Structure: ${rootFolder}` : 'Plugin Structure'}</span>
          </div>
        </div>
        <div className={`p-3 font-mono text-sm ${
          isDark ? 'text-gray-300' : 'text-green-400'
        }`}>
          {lines.map((line, index) => {
            // Calculate indentation level based on directory nesting
            const indentMatch = line.match(/^\s+/);
            const indentLevel = indentMatch ? Math.floor(indentMatch[0].length / 2) : 0;
            
            // Style based on line content
            let lineClass = 'whitespace-pre flex items-center py-0.5';
            
            if (line.includes('📂')) {
              lineClass += isDark ? ' text-blue-400' : ' text-green-500';
            } else if (line.includes('📄')) {
              lineClass += isDark ? ' text-gray-300' : ' text-green-400';
            } else if (line.includes('🐘')) {
              lineClass += ' text-purple-500';
            } else if (line.includes('📜')) {
              lineClass += ' text-yellow-500';
            } else if (line.includes('🎨')) {
              lineClass += ' text-pink-500';
            } else if (line.includes('└─') || line.includes('┌─')) {
              lineClass += isDark ? ' text-gray-500' : ' text-green-700';
            }
            
            // Format file path with proper indentation and tree structure
            return (
              <div key={index} className={lineClass} style={{ paddingLeft: `${indentLevel * 0.75}rem` }}>
                {index > 0 && (
                  <span className={`mr-2 ${isDark ? 'text-gray-500' : 'text-green-700'}`}>
                    {line.includes('📂') ? '├─' : index === lines.length - 1 ? '└─' : '├─'}
                  </span>
                )}
                {line.trim()}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const MessageContent: React.FC<MessageContentProps> = ({ 
  content, 
  isStreaming = false,
  isComplete = true,
  containerRef: externalContainerRef,
  hideCodeInMessages = false
}) => {
  const localContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = externalContainerRef || localContainerRef;
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // State to force re-renders
  const [updateKey, setUpdateKey] = useState(0);
  
  // Handle code copying
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const handleCopyCode = useCallback((code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      }).catch(err => {
        console.error('Failed to copy code:', err);
      });
    }
  }, []);
  
  const isCodeCopied = useCallback((code: string) => {
    return code === copiedCode;
  }, [copiedCode]);

  // Focus management for keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, code: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopyCode(code);
    }
  }, [handleCopyCode]);

  // Custom components for ReactMarkdown
  const CodeBlock = useCallback(({ inline, className, children, ...rest }: CodeProps) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeContent = String(children || '').replace(/\n$/, '');
    
    if (!inline && match) {
      // Detect language or use specified language
      const language = match[1] || 'text';
      const detectedLang = detectLanguage(codeContent, language);
      
      // Special handling for file structure blocks
      if (
        language === 'tree' || 
        language === 'plaintext' || 
        codeContent.includes('File:') || 
        codeContent.includes('📂') || 
        /^\s*[├└─│]/.test(codeContent)
      ) {
        return renderFileHierarchy(codeContent, isDark) || (
          <div className={`rounded-lg overflow-hidden my-2 ${
            isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
          }`}>
            <div className={`flex items-center px-4 py-2 text-xs ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
            }`}>
              <Folder className="w-4 h-4 mr-2 text-blue-500" />
              <span className="font-medium">File Structure</span>
            </div>
            <div className={`p-3 font-mono text-sm whitespace-pre ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {codeContent}
            </div>
          </div>
        );
      }
      
      // Determine icon based on language
      let langIcon = <CodeIcon className="w-4 h-4 mr-2 text-blue-500" />;
      if (detectedLang === 'php') {
        langIcon = <span className="mr-2 text-purple-500">🐘</span>;
      } else if (['javascript', 'js', 'jsx', 'ts', 'tsx'].includes(detectedLang || '')) {
        langIcon = <span className="mr-2 text-yellow-500">📜</span>;
      } else if (['css', 'scss', 'sass'].includes(detectedLang || '')) {
        langIcon = <span className="mr-2 text-pink-500">🎨</span>;
      } else if (['html', 'xml'].includes(detectedLang || '')) {
        langIcon = <span className="mr-2 text-orange-500">🌐</span>;
      }
      
      return (
        <div className={`rounded-lg overflow-hidden my-2 ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
        }`}>
          <div className={`flex items-center justify-between px-4 py-2 text-xs ${
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
          }`}>
            <div className="flex items-center">
              {langIcon}
              <span className="font-medium">{detectedLang || language}</span>
            </div>
            <button 
              className={`hover:text-blue-500 p-1 rounded-md hover:bg-opacity-20 hover:bg-gray-500 flex items-center transition-colors`} 
              title={isCodeCopied(codeContent) ? "Copied!" : "Copy code"}
              onClick={() => handleCopyCode(codeContent)}
              onKeyDown={(e) => handleKeyDown(e, codeContent)}
              aria-label={isCodeCopied(codeContent) ? "Copied to clipboard" : "Copy to clipboard"}
              tabIndex={0}
            >
              {isCodeCopied(codeContent) ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <SyntaxHighlighter
            language={detectedLang || language}
            style={isDark ? oneDark : oneLight}
            customStyle={{
              margin: 0,
              padding: '12px 16px', 
              background: isDark ? '#1f2937' : '#0f1219',
              fontSize: '0.875rem',
              borderRadius: language ? '0 0 6px 6px' : '6px',
              color: isDark ? '#e5e7eb' : '#4ade80',
            }}
            PreTag="div"
            {...rest}
          >
            {codeContent}
          </SyntaxHighlighter>
        </div>
      );
    }
    
    // For inline code
    return (
      <code className={`px-1 py-0.5 rounded text-sm ${
        isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
      }`} {...rest}>
        {children}
      </code>
    );
  }, [isDark, isCodeCopied, handleCopyCode, handleKeyDown]);

  // Add a function to enhance the display of directory listings
  const enhanceDirectoryDisplay = useCallback(() => {
    if (!containerRef.current) return;
    
    // Find directory listings in the message content
    const directoryListings = containerRef.current.querySelectorAll('p');
    
    directoryListings.forEach(listing => {
      const text = listing.textContent || '';
      
      // Check if this paragraph is a directory header
      if (text.match(/(?:Folder|Directory):\s*.+\s*Contents of directory:/)) {
        listing.classList.add('font-medium', 'mt-4', 'mb-2');
        
        // Find the folder name
        const folderNameMatch = text.match(/(?:Folder|Directory):\s*(.+?)\s*Contents/);
        if (folderNameMatch && folderNameMatch[1]) {
          const folderName = folderNameMatch[1].trim();
          
          // Replace the content with styled version
          listing.innerHTML = `
            <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <span class="inline-block">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
                </svg>
              </span>
              <span>${folderName}</span>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">Contents of directory:</div>
          `;
        }
      }
      
      // Check if this is a file or directory entry
      const fileMatch = text.match(/\[file\]\s+([^\s(]+)(?:\s+\(([^)]+)\))?/);
      const dirMatch = text.match(/\[dir\]\s+([^\s(]+)(?:\s*\(([^)]+)\))?/);
      
      if (fileMatch || dirMatch) {
        const isDir = !!dirMatch;
        const name = (fileMatch ? fileMatch[1] : dirMatch?.[1]) || '';
        const meta = (fileMatch ? fileMatch[2] : dirMatch?.[2]) || '';
        
        // Create styled version
        listing.classList.add('pl-6', 'py-1', 'flex', 'items-center', 'gap-2');
        
        if (isDir) {
          listing.innerHTML = `
            <span class="inline-block text-yellow-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
              </svg>
            </span>
            <span class="flex-grow">${name}</span>
            ${meta ? `<span class="text-xs text-gray-500">${meta}</span>` : ''}
          `;
        } else {
          listing.innerHTML = `
            <span class="inline-block text-gray-500">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </span>
            <span class="flex-grow">${name}</span>
            ${meta ? `<span class="text-xs text-gray-500">${meta}</span>` : ''}
          `;
        }
      }
    });
  }, [containerRef]);

  // Add a function to enhance file listings display
  const enhanceFileListings = useCallback(() => {
    if (!containerRef.current) return;
    
    // Find any pre-formatted file listings in the Markdown content
    const preElements = containerRef.current.querySelectorAll('pre');
    
    preElements.forEach(pre => {
      const codeElement = pre.querySelector('code');
      const text = codeElement?.textContent || '';
      
      // Check if this is a file listing in the format we're looking for
      if (text.includes('┌─ File:') && text.includes('└─ Available in File Explorer')) {
        pre.classList.add('file-structure-block');
        
        // Split by lines to style each part
        const lines = text.split('\n').filter(line => line.trim());
        
        // Create a container for the file listing
        const container = document.createElement('div');
        container.className = 'file-listing-container';
        
        lines.forEach(line => {
          const lineDiv = document.createElement('div');
          lineDiv.className = 'file-listing-line';
          
          if (line.startsWith('┌─')) {
            lineDiv.className += ' file-listing-header';
          } else if (line.startsWith('│')) {
            lineDiv.className += ' file-listing-content';
          } else if (line.startsWith('└─')) {
            lineDiv.className += ' file-listing-footer';
          }
          
          lineDiv.textContent = line;
          container.appendChild(lineDiv);
        });
        
        // Replace the pre element with our styled container
        pre.parentNode?.replaceChild(container, pre);
      }
    });
  }, [containerRef]);

  // Filter code blocks from content if hideCodeInMessages is true
  const getFilteredContent = useCallback((content: string): string => {
    if (!hideCodeInMessages) return content;
    
    // Format plain text file listings first
    const withFormattedFileLists = content.replace(/\[File available in File Explorer: ([^\]]+)\]/g, (match, filePath) => {
      // Extract filename from path
      const fileName = filePath.split('/').pop() || filePath;
      const fileExt = fileName.split('.').pop() || '';
      
      // Determine file type icon based on extension
      let fileIcon = '📄';
      if (['php', 'js', 'css', 'html'].includes(fileExt)) {
        fileIcon = fileExt === 'php' ? '🐘' : 
                  fileExt === 'js' ? '📜' : 
                  fileExt === 'css' ? '🎨' : '🌐';
      }
      
      // Return formatted file with path
      return `\`\`\`
┌─ File: ${filePath}
│  ${fileIcon} ${fileName}
└─ Available in File Explorer
\`\`\``;
    });
    
    // Also handle project structure listings in plaintext
    const withFormattedProjectStructure = withFormattedFileLists.replace(/\[Project structure available in File Explorer\]([^\[]+)/g, (match, structureText) => {
      const lines = structureText.split('\n').filter((line: string) => line.trim());
      
      if (lines.length > 0) {
        // Extract project name (first line)
        const projectName = lines[0].trim().replace(/\/$/, '');
        
        let formattedStructure = `\`\`\`
📂 ${projectName}/
`;
        // Process any additional lines
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || line === '...') continue;
          
          // Try to detect indentation/structure
          const parts = line.split('/');
          if (parts.length > 0) {
            const fileName = parts[parts.length - 1];
            const isDirectory = line.endsWith('/');
            const icon = isDirectory ? '📂' : '📄';
            formattedStructure += `  ${icon} ${fileName}${isDirectory ? '/' : ''}\n`;
          }
        }
        
        formattedStructure += '```';
        return formattedStructure;
      }
      
      return match; // Return original if we can't parse it
    });
    
    // Filter out code blocks but preserve file paths and structure information
    const withoutCodeBlocks = withFormattedProjectStructure.replace(/```[\s\S]*?```/g, (match) => {
      // Check if this code block is a file structure or our generated format
      if (match.includes('tree') || 
          /[├└─│]/.test(match) || 
          match.includes('/') ||
          match.includes('File:') ||
          match.includes('📂')) {
        return match; // Keep file structure blocks
      }
      return '[Code available in File Explorer]';
    });
    
    // Process <FILE> tags to show paths with terminal-like formatting
    const withFilePaths = withoutCodeBlocks.replace(/<(?:FILE|file)\s+path="([^"]+)">[\s\S]*?<\/(?:FILE|file)>/g, 
      (match, filePath) => {
        // Extract filename from path
        const fileName = filePath.split('/').pop() || filePath;
        const fileExt = fileName.split('.').pop() || '';
        
        // Determine file type icon based on extension
        let fileIcon = '📄';
        if (['php', 'js', 'css', 'html'].includes(fileExt)) {
          fileIcon = fileExt === 'php' ? '🐘' : 
                    fileExt === 'js' ? '📜' : 
                    fileExt === 'css' ? '🎨' : '🌐';
        }
        
        // Return formatted file with path
        return `\`\`\`
┌─ File: ${filePath}
│  ${fileIcon} ${fileName}
└─ Available in File Explorer
\`\`\``;
      });
    
    // Enhance project structure display
    const withStructureInfo = withFilePaths.replace(/<PROJECT_STRUCTURE>([\s\S]*?)<\/PROJECT_STRUCTURE>/g, 
      (match, structure) => {
        // Parse and format the structure to look like a terminal tree
        const lines = structure.split('\n').filter((line: string) => line.trim());
        let formattedStructure = '';
        
        if (lines.length > 0) {
          // Extract project name (first line)
          const projectName = lines[0].trim().replace(/\/$/, '');
          
          formattedStructure = `\`\`\`
📂 ${projectName}/
`;
          // Add the remaining structure with proper indentation
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Clean line and detect if it's a file or directory
            const cleanLine = line.replace(/[│├└─\s]/g, '').trim();
            const isDirectory = cleanLine.endsWith('/');
            const displayName = cleanLine.split('/').pop() || cleanLine;
            
            // Determine indentation level based on line content
            const indentLevel = (line.match(/├|└|│/) || []).length;
            const prefix = ' '.repeat(indentLevel * 2) + (isDirectory ? '📂' : '📄');
            
            formattedStructure += `${prefix} ${displayName}${isDirectory ? '/' : ''}\n`;
          }
          
          formattedStructure += '```';
        } else {
          formattedStructure = '```\nProject structure available in File Explorer\n```';
        }
        
        return formattedStructure;
      });
    
    return withStructureInfo;
  }, [hideCodeInMessages]);
  
  // Apply content filtering
  const processedContent = getFilteredContent(content);

  // Process content for lists and listen for content-updated events
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Function to process lists
    const processLists = () => {
      const paragraphs = containerRef.current?.querySelectorAll('p');
      
      paragraphs?.forEach(p => {
        const text = p.innerHTML;
        if (text.trim().startsWith('- ')) {
          const ul = document.createElement('ul');
          ul.className = 'list-disc pl-6 my-2';
          const items = text.split('- ').filter(Boolean);
          
          items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'my-1';
            li.innerHTML = item.trim();
            ul.appendChild(li);
          });
          
          p.parentNode?.replaceChild(ul, p);
        }
      });
    };
    
    // Function to process lists and enhance display
    const processContent = () => {
      processLists();
      enhanceDirectoryDisplay();
      enhanceFileListings();
    };
    
    // Process on initial render
    const timer = setTimeout(() => {
      processContent();
    }, 50);
    
    // Set up event listener for content updates
    const handleContentUpdated = () => {
      // Force a re-render with a new key
      setUpdateKey(prevKey => prevKey + 1);
      // Process after update
      setTimeout(() => {
        processContent();
      }, 50);
    };
    
    containerRef.current.addEventListener('content-updated', handleContentUpdated);
    
    return () => {
      clearTimeout(timer);
      containerRef.current?.removeEventListener('content-updated', handleContentUpdated);
    };
  }, [content, containerRef, enhanceDirectoryDisplay, enhanceFileListings]);

  // Fix for the custom handler for file structures and file listings
  const CustomPreComponent = ({ children, ...props }: React.ComponentPropsWithRef<'pre'>) => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    // Check children for file listings
    let childText = '';
    
    // Safely extract text content from children
    try {
      if (children) {
        // Handle string children directly
        if (typeof children === 'string') {
          childText = children;
        }
        // Handle React element children
        else if (React.isValidElement(children)) {
          const childrenProps = children.props as any;
          if (childrenProps && childrenProps.children) {
            if (typeof childrenProps.children === 'string') {
              childText = childrenProps.children;
            }
          }
        }
        // Handle array of children
        else if (Array.isArray(children)) {
          React.Children.forEach(children, (child) => {
            if (typeof child === 'string') {
              childText += child;
            } else if (React.isValidElement(child)) {
              const childProps = child.props as any;
              if (childProps && childProps.children) {
                if (typeof childProps.children === 'string') {
                  childText += childProps.children;
                }
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error parsing pre children:', error);
    }
    
    // If it contains a file listing, handle it specially
    if (childText.includes('┌─ File:') && childText.includes('└─ Available in File Explorer')) {
      const lines = childText.split('\n').filter(line => line.trim());
      
      return (
        <div className="file-listing-block my-2 not-prose">
          {lines.map((line, i) => (
            <div 
              key={i} 
              className={`font-mono text-sm ${
                line.startsWith('┌─') ? 'text-blue-500 dark:text-blue-400' : 
                line.startsWith('│') ? 'pl-4' : 
                line.startsWith('└─') ? 'text-blue-500 dark:text-blue-400' : ''
              }`}
            >
              {line}
            </div>
          ))}
        </div>
      );
    }
    
    // If it contains a plugin structure, handle it specially
    if (childText.includes('📂') && (childText.includes('Plugin Structure') || childText.includes('simple-contact-form'))) {
      return renderFileHierarchy(childText, isDark);
    }
    
    // Default pre rendering
    return <pre {...props}>{children}</pre>;
  };

  return (
    <div 
      ref={containerRef} 
      className={`markdown-content prose dark:prose-invert max-w-none ${isStreaming && !isComplete ? 'typing-cursor' : ''}`}
      key={updateKey} // Force re-render when content is updated
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code: CodeBlock,
          ol: ({ children, ...props }) => <ol className="list-decimal pl-6 my-2" {...props}>{children}</ol>,
          ul: ({ children, ...props }) => <ul className="list-disc pl-6 my-2" {...props}>{children}</ul>,
          li: ({ children, checked, ...props }: MarkdownLiProps) => {
            if (checked !== null && checked !== undefined) {
              return (
                <li className="my-1 flex items-start" {...props}>
                  <input 
                    type="checkbox" 
                    checked={checked} 
                    readOnly 
                    aria-label="Task list item" 
                    className="mt-1 mr-2" 
                  />
                  <span>{children}</span>
                </li>
              );
            }
            return <li className="my-1" {...props}>{children}</li>;
          },
          p: ({ children, ...props }) => <p className="my-2" {...props}>{children}</p>,
          blockquote: ({ children, ...props }) => (
            <blockquote 
              className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 my-3 text-gray-700 dark:text-gray-300" 
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Heading components with improved accessibility
          h1: ({ children, ...props }) => {
            const id = typeof children === 'string' 
              ? children.toLowerCase().replace(/\s+/g, '-') 
              : '';
            return <h1 className="text-xl font-bold mt-4 mb-2" id={`heading-${id}`} {...props}>{children}</h1>;
          },
          h2: ({ children, ...props }) => {
            const id = typeof children === 'string' 
              ? children.toLowerCase().replace(/\s+/g, '-') 
              : '';
            return <h2 className="text-lg font-bold mt-3 mb-2" id={`heading-${id}`} {...props}>{children}</h2>;
          },
          h3: ({ children, ...props }) => {
            const id = typeof children === 'string' 
              ? children.toLowerCase().replace(/\s+/g, '-') 
              : '';
            return <h3 className="text-base font-bold mt-3 mb-1" id={`heading-${id}`} {...props}>{children}</h3>;
          },
          // Table components
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => <thead className="bg-gray-100 dark:bg-gray-800" {...props}>{children}</thead>,
          tbody: ({ children, ...props }) => <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props}>{children}</tbody>,
          tr: ({ children, isHeader, ...props }: MarkdownTrProps) => (
            <tr 
              className={isHeader ? "bg-gray-50 dark:bg-gray-900" : "hover:bg-gray-50 dark:hover:bg-gray-900/50"} 
              {...props}
            >
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => <td className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300" {...props}>{children}</td>,
          img: ({ src, alt, ...props }) => (
            <img 
              src={src} 
              alt={alt || "Image"} 
              className="max-w-full h-auto rounded-md my-2"
              loading="lazy"
              {...props}
            />
          ),
          a: ({ href, children, ...props }) => {
            const isExternal = href?.startsWith('http');
            return (
              <a 
                href={href} 
                target={isExternal ? "_blank" : undefined} 
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                {...props}
              >
                {children}
                {isExternal && (
                  <span className="inline-block align-text-bottom ml-1">
                    <ExternalLink size={12} />
                  </span>
                )}
              </a>
            );
          },
          // Use our custom pre component to avoid linter errors
          pre: CustomPreComponent
        }}
      >
        {processedContent}
      </ReactMarkdown>

      <style jsx global>{`
        .typing-cursor::after {
          content: '▌';
          display: inline-block;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        /* Plugin Structure styles */
        .plugin-structure-container {
          margin: 1rem 0;
          border-radius: 6px;
          overflow: hidden;
          border-left: 2px solid ${isDark ? '#3b82f6' : '#10b981'};
        }
        
        .plugin-structure-header {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          background: ${isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.8)'};
          color: ${isDark ? '#93c5fd' : '#10b981'};
          font-weight: 500;
          font-size: 0.875rem;
        }
        
        .plugin-structure-content {
          padding: 0.75rem;
          background: ${isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(15, 23, 42, 0.5)'};
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
        }
        
        .plugin-structure-item {
          display: flex;
          align-items: center;
          line-height: 1.5;
          padding: 0.125rem 0;
        }
        
        .plugin-structure-folder {
          color: ${isDark ? '#60a5fa' : '#10b981'};
        }
        
        .plugin-structure-file {
          color: ${isDark ? '#e5e7eb' : '#34d399'};
        }
        
        /* File listing styles */
        .file-listing-container {
          margin: 1rem 0;
          padding: 0.5rem;
          background: ${isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(15, 23, 42, 0.5)'};
          border-radius: 6px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.875rem;
          white-space: pre;
          border-left: 2px solid ${isDark ? '#3b82f6' : '#10b981'};
        }
        
        .file-listing-line {
          line-height: 1.4;
        }
        
        .file-listing-header {
          color: ${isDark ? '#60a5fa' : '#10b981'};
        }
        
        .file-listing-content {
          padding-left: 1rem;
        }
        
        .file-listing-footer {
          color: ${isDark ? '#60a5fa' : '#10b981'};
        }
        
        .file-listing-block {
          background: ${isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(15, 23, 42, 0.5)'};
          border-radius: 6px;
          padding: 0.5rem;
          border-left: 2px solid ${isDark ? '#3b82f6' : '#10b981'};
        }
        
        .markdown-content pre {
          max-width: 100%;
          overflow-x: auto;
        }
        
        .markdown-content img {
          max-width: 100%;
          height: auto;
        }
        
        .markdown-content * {
          overflow-wrap: break-word;
          word-wrap: break-word;
        }
        
        /* Prevent content from causing horizontal overflow */
        * {
          box-sizing: border-box;
        }
        
        code, pre {
          white-space: pre-wrap !important;
          word-break: break-word !important;
        }
        
        /* Hide scrollbar but maintain scroll functionality */
        .markdown-content pre {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;     /* Firefox */
        }
        
        .markdown-content pre::-webkit-scrollbar {
          display: none;  /* Chrome, Safari and Opera */
        }
      `}</style>
    </div>
  );
};

export default MessageContent; 