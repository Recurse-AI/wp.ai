"use client";

import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { AgentEditorProps } from '../../types';
import { useTheme } from '@/context/ThemeProvider';
import { Copy, Download, Code, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const AgentEditor: React.FC<AgentEditorProps> = ({
  file,
  onChange
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);
  const [value, setValue] = useState(file.content);
  const [language, setLanguage] = useState('');
  const editorRef = useRef<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Update editor value when file changes
  useEffect(() => {
    setValue(file.content);
    setLanguage(getLanguage(file.name));
  }, [file]);
  
  // Handle editor mount with improved configuration
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Configure editor
    editor.updateOptions({
      scrollBeyondLastLine: false,
      minimap: { enabled: !isMobile },
      scrollbar: {
        verticalScrollbarSize: isMobile ? 4 : 10,
        horizontalScrollbarSize: isMobile ? 4 : 10,
        vertical: 'visible',
        horizontal: 'visible',
        verticalHasArrows: false,
        horizontalHasArrows: false,
        useShadows: true,
      },
      padding: {
        top: 8,
        bottom: 8
      },
      fontSize: isMobile ? 13 : 14,
      lineHeight: 1.5,
    });
    
    // Focus editor on mount with a small delay to ensure it's fully rendered
    setTimeout(() => {
      editor.focus();
    }, 100);
  };
  
  // Update editor options when mobile status changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        minimap: { enabled: !isMobile },
        scrollbar: {
          verticalScrollbarSize: isMobile ? 4 : 10,
          horizontalScrollbarSize: isMobile ? 4 : 10,
        },
        fontSize: isMobile ? 13 : 14,
      });
    }
  }, [isMobile]);
  
  // Handle editor change
  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || '';
    setValue(newValue);
    onChange(newValue);
  };
  
  // Format code
  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
      toast.success('Code formatted', {
        style: {
          background: isDark ? '#333' : '#fff',
          color: isDark ? '#fff' : '#333',
        },
        duration: 1500
      });
    }
  };
  
  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Code copied to clipboard', {
        style: {
          background: isDark ? '#333' : '#fff',
          color: isDark ? '#fff' : '#333',
        },
        duration: 1500
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };
  
  // Handle download file
  const handleDownload = () => {
    try {
      const element = document.createElement('a');
      const blob = new Blob([value], { type: 'text/plain' });
      element.href = URL.createObjectURL(blob);
      element.download = file.name;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast.success(`Downloaded ${file.name}`, {
        style: {
          background: isDark ? '#333' : '#fff',
          color: isDark ? '#fff' : '#333',
        },
        duration: 1500
      });
    } catch (err) {
      console.error('Failed to download:', err);
      toast.error('Failed to download file');
    }
  };
  
  // Get language from file extension
  const getLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return 'plaintext';
    
    const extensionMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      html: 'html',
      htm: 'html',
      css: 'css',
      scss: 'scss',
      json: 'json',
      md: 'markdown',
      php: 'php',
      py: 'python',
      rb: 'ruby',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      swift: 'swift',
      kt: 'kotlin',
      sql: 'sql',
      yaml: 'yaml',
      yml: 'yaml',
      xml: 'xml',
      sh: 'shell'
    };
    
    return extensionMap[ext] || 'plaintext';
  };

  // Get a user-friendly language name
  const getLanguageDisplay = (langId: string): string => {
    const displayMap: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      html: 'HTML',
      css: 'CSS',
      scss: 'SCSS',
      json: 'JSON',
      markdown: 'Markdown',
      php: 'PHP',
      python: 'Python',
      ruby: 'Ruby',
      java: 'Java',
      c: 'C',
      cpp: 'C++',
      csharp: 'C#',
      go: 'Go',
      rust: 'Rust',
      swift: 'Swift',
      kotlin: 'Kotlin',
      sql: 'SQL',
      yaml: 'YAML',
      xml: 'XML',
      shell: 'Shell',
      plaintext: 'Plain Text'
    };
    
    return displayMap[langId] || langId.charAt(0).toUpperCase() + langId.slice(1);
  };
  
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Editor header */}
      <div className={`flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 ${
        isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200'
      } border-b`}>
        <div className="flex items-center overflow-hidden">
          <Code className="w-4 h-4 mr-2 text-blue-500 flex-shrink-0" />
          <div className="text-sm font-medium truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">
            {file.name}
          </div>
          <div className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          } flex-shrink-0`}>
            {getLanguageDisplay(language)}
          </div>
        </div>
        
        <div className="flex space-x-1 sm:space-x-2">
          <button
            onClick={handleFormat}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            } transition-colors duration-200`}
            title="Format code"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          
          <button
            onClick={handleCopy}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            } transition-colors duration-200`}
            title="Copy code"
          >
            {copied ? 
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" /> : 
              <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            }
          </button>
          
          <button
            onClick={handleDownload}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            } transition-colors duration-200`}
            title="Download file"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1 overflow-hidden bg-opacity-80 relative">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={language}
          value={value}
          theme={isDark ? 'vs-dark' : 'vs'}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            automaticLayout: true,
            wordWrap: 'on',
            wrappingIndent: 'same',
            tabSize: 2,
            renderWhitespace: 'selection',
            colorDecorators: true,
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            cursorSmoothCaretAnimation: 'explicit',
            scrollBeyondLastLine: false,
            hideCursorInOverviewRuler: true,
            renderControlCharacters: true,
            quickSuggestions: isMobile ? false : { other: true, comments: true, strings: true },
            lineNumbers: isMobile ? 'off' : 'on', // hide line numbers on mobile
            folding: isMobile ? false : true, // disable folding on mobile
          }}
          className="editor-container"
        />
      </div>
      
      {/* Custom styles for Monaco editor scrollbars */}
      <style jsx global>{`
        .monaco-editor .scrollbar .slider {
          background: ${isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'} !important;
          border-radius: 10px !important;
        }
        
        .monaco-editor .scrollbar .slider:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'} !important;
        }
        
        .monaco-editor .scrollbar .slider.active {
          background: ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'} !important;
        }
        
        /* Improve selection color */
        .monaco-editor .selected-text {
          background-color: ${isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.2)'} !important;
        }
        
        /* Make active line highlight more subtle */
        .monaco-editor .current-line {
          border: none !important;
          background-color: ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'} !important;
        }
        
        /* Make cursor more visible */
        .monaco-editor .cursor {
          background-color: ${isDark ? '#3B82F6' : '#3B82F6'} !important;
          width: 2px !important;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .monaco-editor {
            padding: 4px 0 !important;
          }
          
          .monaco-editor .scrollbar {
            width: 4px !important;
            height: 4px !important;
          }
          
          .monaco-editor .scrollbar .slider {
            width: 4px !important;
            height: 4px !important;
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default AgentEditor; 