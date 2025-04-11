"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { ChevronRight, X, Copy, DownloadCloud } from 'lucide-react';

interface AgentTerminalProps {
  onRunCommand?: (command: string) => Promise<string>;
}

const AgentTerminal: React.FC<AgentTerminalProps> = ({ onRunCommand }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [command, setCommand] = useState<string>('');
  const [history, setHistory] = useState<Array<{ type: 'command' | 'output', content: string }>>([
    { type: 'output', content: 'WordPress Terminal v1.0.0\nType "help" to see available commands.' }
  ]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);
  
  // Focus the input when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    // Add command to history
    setHistory(prev => [...prev, { type: 'command', content: command }]);
    setCommandHistory(prev => [command, ...prev]);
    
    // Process command
    if (command.toLowerCase() === 'clear') {
      setHistory([{ type: 'output', content: 'Terminal cleared.' }]);
    } else if (command.toLowerCase() === 'help') {
      setHistory(prev => [...prev, { 
        type: 'output', 
        content: `
Available commands:
  help - Display this help message
  clear - Clear the terminal
  wp - WordPress CLI commands (e.g., wp plugin list)
  php - Run PHP commands
  npm - Run NPM commands
  git - Git commands
  ls - List directory contents
  cd - Change directory
`
      }]);
    } else {
      // Try to execute the command
      if (onRunCommand) {
        try {
          setHistory(prev => [...prev, { type: 'output', content: 'Executing command...' }]);
          const result = await onRunCommand(command);
          setHistory(prev => [...prev.slice(0, prev.length - 1), { type: 'output', content: result }]);
        } catch (error) {
          setHistory(prev => [...prev.slice(0, prev.length - 1), { 
            type: 'output', 
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` 
          }]);
        }
      } else {
        // Mock response for demo purposes
        setHistory(prev => [...prev, { 
          type: 'output', 
          content: `Command "${command}" executed (simulated).` 
        }]);
      }
    }
    
    setCommand('');
    setHistoryIndex(-1);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    }
  };

  const handleCopyToClipboard = () => {
    const text = history.map(item => {
      if (item.type === 'command') {
        return `$ ${item.content}`;
      }
      return item.content;
    }).join('\n');
    
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Terminal history copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const handleDownload = () => {
    const text = history.map(item => {
      if (item.type === 'command') {
        return `$ ${item.content}`;
      }
      return item.content;
    }).join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'terminal-history.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Terminal header */}
      <div className={`flex justify-between items-center p-2 border-b ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'
      }`}>
        <div className="flex items-center">
          <span className="font-medium">WordPress Terminal</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleCopyToClipboard}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Copy to clipboard"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDownload}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Download history"
          >
            <DownloadCloud className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setHistory([{ type: 'output', content: 'Terminal cleared.' }])}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Clear terminal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Terminal output */}
      <div 
        ref={terminalRef}
        className={`flex-1 overflow-auto p-2 font-mono text-sm ${
          isDark ? 'bg-gray-900 text-gray-200' : 'bg-black text-gray-200'
        }`}
      >
        {history.map((item, index) => (
          <div key={index} className="whitespace-pre-wrap break-words">
            {item.type === 'command' ? (
              <div className="flex items-start">
                <span className="text-green-400 mr-2">$</span>
                <span>{item.content}</span>
              </div>
            ) : (
              <div className={item.content.includes('Error') ? 'text-red-400' : ''}>
                {item.content}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Command input */}
      <div className={`border-t ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-black border-gray-600'
      }`}>
        <form onSubmit={handleCommandSubmit} className="flex items-center p-2">
          <span className="text-green-400 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`flex-1 bg-transparent border-none outline-none ${
              isDark ? 'text-white' : 'text-white'
            }`}
            placeholder="Type a command..."
            autoComplete="off"
            spellCheck="false"
          />
        </form>
      </div>
    </div>
  );
};

export default AgentTerminal; 