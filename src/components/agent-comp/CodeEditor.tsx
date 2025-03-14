"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useTheme } from '@/context/ThemeProvider';
import { IoCodeSlashOutline } from 'react-icons/io5';
import { HiOutlineDocumentDuplicate } from 'react-icons/hi';
import { FiDownload, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import type { editor } from 'monaco-editor';
import { setupMonacoVSCodeTheme } from '@/lib/utils/monacoSetup';

interface CodeEditorProps {
  code: string;
  language: string;
  fileName?: string;
  showLineNumbers?: boolean;
  onChange?: (value: string) => void;
  theme?: 'light' | 'dark';
}

// Expanded language map with improved detection
const getLanguageFromFileName = (fileName: string): string => {
  if (!fileName) return 'plaintext';
  
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension) return 'plaintext';
  
  const extensionMap: { [key: string]: string } = {
    // JavaScript and React
    js: 'javascript',
    jsx: 'javascript',
    mjs: 'javascript',
    cjs: 'javascript',
    // TypeScript and React
    ts: 'typescript',
    tsx: 'typescript',
    // Web technologies
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    less: 'less',
    // Data formats
    json: 'json',
    jsonc: 'json',
    md: 'markdown',
    markdown: 'markdown',
    // Backend languages
    py: 'python',
    pyc: 'python',
    rb: 'ruby',
    java: 'java',
    php: 'php',
    go: 'go',
    rs: 'rust',
    c: 'c',
    h: 'c',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    hpp: 'cpp',
    cs: 'csharp',
    // Shell and configuration
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    yml: 'yaml',
    yaml: 'yaml',
    // Query languages
    sql: 'sql',
    // Markup
    xml: 'xml',
    svg: 'xml',
    // Mobile
    swift: 'swift',
    kt: 'kotlin',
    kts: 'kotlin',
  };
  
  // Check if fileName suggests a React component (e.g., Button.js, Card.jsx)
  if (/^[A-Z][a-zA-Z0-9]*\.(js|ts)$/.test(fileName)) {
    // First letter uppercase + .js/.ts -> likely a React component
    const ext = extension === 'js' ? 'javascript' : 'typescript';
    return ext;
  }
  
  return extensionMap[extension] || 'plaintext';
};

// Improved detection for React/JSX code
const isReactCode = (content: string): boolean => {
  return (
    content.includes('import React') ||
    content.includes('from "react"') ||
    content.includes("from 'react'") ||
    content.includes('extends React.Component') ||
    content.includes('extends Component') ||
    content.includes('useState') ||
    content.includes('useEffect') ||
    content.includes('className=') ||
    /\bfunction\s+[A-Z][a-zA-Z0-9]*\s*\(/g.test(content) || // Function components
    /\bconst\s+[A-Z][a-zA-Z0-9]*\s*=\s*(\(\)|React\.memo|\s*\(props|\s*\(\{\s*[\w\s,]*\}\))/g.test(content) || // Arrow function components
    (content.includes('<') && content.includes('>') && 
      (content.includes('</') || content.includes('/>')) &&
      (content.includes('props') || content.includes('className=') || content.includes('onClick=')))
  );
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  fileName = 'code.txt',
  showLineNumbers = true,
  onChange,
  theme: editorTheme = 'dark'
}) => {
  const { theme } = useTheme();
  const isDarkTheme = editorTheme === 'dark' || theme === 'dark';
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [copied, setCopied] = useState(false);
  const [value, setValue] = useState(code);

  // Update value when code prop changes
  useEffect(() => {
    setValue(code);
  }, [code]);

  const detectedLanguage = useCallback(() => {
    const fileType = language || getLanguageFromFileName(fileName);
    
    // Check if this is likely a React component
    if (isReactCode(code)) {
      if (fileType === 'javascript' || fileName.endsWith('.js') || fileName.endsWith('.jsx')) {
        return 'javascript';
      }
      if (fileType === 'typescript' || fileName.endsWith('.ts') || fileName.endsWith('.tsx')) {
        return 'typescript';
      }
    }
    
    return fileType;
  }, [code, language, fileName]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Apply VS Code theme setup
    setupMonacoVSCodeTheme(monaco);
    
    // Use our custom theme
    monaco.editor.setTheme(isDarkTheme ? 'vs-code-dark-plus' : 'vs-code-light');
    
    // Force tokenization refresh for better syntax highlighting
    setTimeout(() => {
      editor.trigger('source', 'editor.action.forceTokenize', {});
    }, 100);
    
    // Set initial options
    editor.updateOptions({
      fontFamily: '"Consolas", "Monaco", "JetBrains Mono", monospace',
      fontSize: 14,
      lineNumbers: showLineNumbers ? 'on' : 'off',
      matchBrackets: 'always',
      autoIndent: 'full',
      minimap: {
        enabled: true,
        renderCharacters: false,
        showSlider: 'mouseover',
        maxColumn: 120,
      },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorBlinking: 'phase',
      cursorStyle: 'line',
      cursorWidth: 2,
      wordWrap: 'on',
      wrappingIndent: 'indent',
      renderLineHighlight: 'all',
      scrollbar: {
        verticalSliderSize: 14,
        horizontalSliderSize: 14,
        verticalScrollbarSize: 14,
        horizontalScrollbarSize: 14,
        alwaysConsumeMouseWheel: false,
      },
      bracketPairColorization: {
        enabled: true,
      },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
    });
    
    // Configure specific language syntax highlighting for JSX/TSX
    if (detectedLanguage() === 'javascript' || detectedLanguage() === 'typescript') {
      // Add custom token providers if needed
      if (fileName?.endsWith('.jsx') || fileName?.endsWith('.tsx') || 
          code.includes('import React') || code.includes('<div') || code.includes('className=')) {
        // Use JSX/TSX tokenization
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
          jsx: monaco.languages.typescript.JsxEmit.React,
          jsxFactory: 'React.createElement',
          reactNamespace: 'React',
          allowNonTsExtensions: true,
          allowJs: true,
          target: monaco.languages.typescript.ScriptTarget.Latest,
        });
      }
    }
  };

  const handleCopyCode = async () => {
    if (!value) return;
    
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success('Code copied to clipboard!', {
        duration: 2000,
        style: {
          background: isDarkTheme ? '#333' : '#fff',
          color: isDarkTheme ? '#fff' : '#333',
        },
      });
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
      toast.error('Failed to copy code');
    }
  };

  const handleDownload = () => {
    if (!value) return;
    
    const element = document.createElement('a');
    const file = new Blob([value], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success(`Downloaded as ${fileName}`, {
      duration: 2000,
      style: {
        background: isDarkTheme ? '#333' : '#fff',
        color: isDarkTheme ? '#fff' : '#333',
      },
    });
  };

  const handleChange = (newValue: string | undefined) => {
    const updatedValue = newValue || '';
    setValue(updatedValue);
    if (onChange) {
      onChange(updatedValue);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden border rounded-md">
      <div className="w-full flex-1 overflow-hidden flex flex-col">
        {/* Editor header */}
        <div className={`flex items-center justify-between px-4 py-2 ${
          isDarkTheme ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
        } border-b`}>
          <div className="flex items-center space-x-2">
            <IoCodeSlashOutline className="text-lg" />
            <span className="font-medium truncate">
              {fileName}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={handleCopyCode}
              className={`p-1.5 rounded ${isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} text-gray-400 hover:text-${isDarkTheme ? 'white' : 'black'}`}
              title="Copy code"
            >
              {copied ? 
                <span className="flex items-center text-green-500"><FiCheck className="mr-1" /> Copied</span> : 
                <HiOutlineDocumentDuplicate />
              }
            </button>
            <button 
              onClick={handleDownload}
              className={`p-1.5 rounded ${isDarkTheme ? 'hover:bg-gray-700' : 'hover:bg-gray-200'} text-gray-400 hover:text-${isDarkTheme ? 'white' : 'black'}`}
              title="Download file"
            >
              <FiDownload />
            </button>
          </div>
        </div>
        
        {/* Code editor */}
        <div className="flex-1 overflow-hidden vscode-theme">
          <Editor
            height="100%"
            language={detectedLanguage()}
            value={value}
            theme={isDarkTheme ? 'vs-code-dark-plus' : 'vs-code-light'}
            options={{
              readOnly: false,
              automaticLayout: true,
              fontFamily: '"Consolas", "Monaco", "JetBrains Mono", monospace',
              fontSize: 14,
              lineHeight: 1.5,
              minimap: { 
                enabled: true,
                renderCharacters: false,
              },
              scrollbar: {
                useShadows: true,
                verticalScrollbarSize: 14,
                horizontalScrollbarSize: 14,
              },
              renderLineHighlight: 'all',
              occurrencesHighlight: 'singleFile',
              selectionHighlight: true,
              colorDecorators: true,
              guides: {
                indentation: true,
                bracketPairs: true,
              },
              bracketPairColorization: {
                enabled: true,
              },
              folding: true,
              tabSize: 2,
              renderValidationDecorations: 'on',
              renderControlCharacters: true,
              links: true,
            }}
            onChange={handleChange}
            onMount={handleEditorDidMount}
            className="vs-code-editor-wrapper"
          />
        </div>
      </div>
      
      {/* Add VS Code-like scrollbar styling */}
      <style jsx global>{`
        /* VS Code-like styling for Monaco editor */
        .vs-code-editor-wrapper {
          font-family: 'Consolas', 'Monaco', 'JetBrains Mono', monospace !important;
        }
        
        /* Improved line numbers */
        .monaco-editor .margin-view-overlays .line-numbers {
          color: ${isDarkTheme ? '#858585' : '#a0a0a0'} !important;
          font-family: 'Consolas', 'Monaco', 'JetBrains Mono', monospace !important;
        }
        
        /* Improved scrollbars */
        .monaco-editor .scrollbar .slider {
          background: ${isDarkTheme ? 'rgba(121, 121, 121, 0.4)' : 'rgba(100, 100, 100, 0.4)'} !important;
          border-radius: 5px !important;
        }
        
        .monaco-editor .scrollbar .slider:hover {
          background: ${isDarkTheme ? 'rgba(140, 140, 140, 0.6)' : 'rgba(100, 100, 100, 0.6)'} !important;
        }
        
        /* Syntax color enhancement for React specific elements */
        .monaco-editor .jsx-tags {
          color: ${isDarkTheme ? '#569cd6' : '#0000ff'} !important;
        }
        
        .monaco-editor .jsx-attribute-name {
          color: ${isDarkTheme ? '#9cdcfe' : '#ff0000'} !important;
        }
        
        .monaco-editor .jsx-attribute-value {
          color: ${isDarkTheme ? '#ce9178' : '#a31515'} !important;
        }
      `}</style>
    </div>
  );
};

export default CodeEditor; 