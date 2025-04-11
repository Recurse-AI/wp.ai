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
  
  // Update editor value when file changes
  useEffect(() => {
    setValue(file.content);
    setLanguage(getLanguage(file.name));
  }, [file]);
  
  // Handle editor mount
  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    
    // Focus editor on mount
    setTimeout(() => {
      editor.focus();
    }, 100);
  };
  
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
        }
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
        }
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
        }
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
      <div className={`flex items-center justify-between px-4 py-2 ${
        isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200'
      } border-b`}>
        <div className="flex items-center">
          <Code className="w-4 h-4 mr-2 text-blue-500" />
          <div className="text-sm font-medium truncate">
            {file.name}
          </div>
          <div className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
            isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
          }`}>
            {getLanguageDisplay(language)}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleFormat}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
            title="Format code"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleCopy}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
            title="Copy code"
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          
          <button
            onClick={handleDownload}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-gray-700 text-gray-300 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Monaco Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={value}
          theme={isDark ? 'vs-dark' : 'vs-light'}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            wordWrap: 'on',
            automaticLayout: true,
            lineNumbers: 'on',
            tabSize: 2,
            fontSize: 14,
            fontFamily: '"Menlo", "Monaco", "Courier New", monospace',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            formatOnPaste: true,
            formatOnType: true,
            renderControlCharacters: true,
            scrollbar: {
              verticalScrollbarSize: 12,
              horizontalScrollbarSize: 12,
              alwaysConsumeMouseWheel: false,
            },
            padding: {
              top: 10,
              bottom: 10
            }
          }}
        />
      </div>
    </div>
  );
};

export default AgentEditor; 