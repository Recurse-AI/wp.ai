"use client";
import React, { useRef, useEffect, useState } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useTheme } from '@/context/ThemeProvider';
import { IoCodeSlashOutline } from 'react-icons/io5';
import { HiOutlineDocumentDuplicate } from 'react-icons/hi';
import { FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import type { editor } from 'monaco-editor';

interface CodeEditorProps {
  content: string;
  language: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  fileName?: string;
  path?: string;
}

// Map file extensions to Monaco language IDs
const getLanguageFromFileName = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'md': 'markdown',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'go': 'go',
    'php': 'php',
    'rb': 'ruby',
    'rs': 'rust',
    'sh': 'shell',
    'sql': 'sql',
    'yaml': 'yaml',
    'yml': 'yaml',
  };
  
  return languageMap[ext] || 'plaintext';
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  content,
  language,
  readOnly = false,
  onChange,
  fileName = 'code.txt',
  path = ''
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  
  const detectedLanguage = language || getLanguageFromFileName(fileName);
  
  // Handle editor mounting
  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Set initial options
    editor.updateOptions({
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 14,
      lineNumbers: 'on',
      matchBrackets: 'always',
      autoIndent: 'full',
      formatOnPaste: true,
      formatOnType: true,
    });
  };
  
  // Copy code to clipboard
  const handleCopyCode = async () => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const code = model.getValue();
        await navigator.clipboard.writeText(code);
        setCopied(true);
        toast.success('Code copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };
  
  // Download code as file
  const handleDownload = () => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const code = model.getValue();
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(`Downloaded ${fileName}`);
      }
    }
  };
  
  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden">
      {/* Editor header */}
      <div className={`flex items-center justify-between px-4 py-2 ${
        theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
      }`}>
        <div className="flex items-center space-x-2">
          <IoCodeSlashOutline className="text-lg" />
          <span className="font-medium truncate">
            {path ? `${path}/${fileName}` : fileName}
          </span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleCopyCode}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Copy code"
          >
            <HiOutlineDocumentDuplicate className="text-lg" />
          </button>
          <button 
            onClick={handleDownload}
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            title="Download file"
          >
            <FiDownload className="text-lg" />
          </button>
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1 min-h-[300px]">
        <Editor
          height="100%"
          language={detectedLanguage}
          value={content}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            readOnly,
            automaticLayout: true,
          }}
          onChange={(value: any) => onChange && onChange(value || '')}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
};

export default CodeEditor; 