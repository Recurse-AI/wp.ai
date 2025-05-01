"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { ChevronRight, X, Copy, DownloadCloud } from 'lucide-react';

interface AgentTerminalProps {
  onRunCommand?: (command: string) => Promise<string>;
  onToggleTerminal: () => void;
  showTerminal: boolean;
}

const AgentTerminal: React.FC<AgentTerminalProps> = ({ onRunCommand, onToggleTerminal, showTerminal }) => {
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
  const [isMobile, setIsMobile] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  
  // Check if we're on a mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Auto-scroll to bottom when history changes if auto-scroll is enabled
  useEffect(() => {
    if (isAutoScrollEnabled) {
      scrollToBottom();
    }
  }, [history, isAutoScrollEnabled]);
  
  // Scroll to bottom helper function
  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };
  
  // Focus the input when the component mounts or after mobile keyboard closes
  useEffect(() => {
    if (inputRef.current && showTerminal) {
      inputRef.current.focus();
    }
  }, [showTerminal]);
  
  // Track scrolling to determine if auto-scroll should be enabled
  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) return;
    
    const handleScroll = () => {
      // If user scrolls up more than 100px from bottom, disable auto-scroll
      const isNearBottom = terminal.scrollHeight - terminal.scrollTop - terminal.clientHeight < 100;
      setIsAutoScrollEnabled(isNearBottom);
    };
    
    terminal.addEventListener('scroll', handleScroll);
    return () => {
      terminal.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) return;
    
    // Add command to history
    setHistory(prev => [...prev, { type: 'command', content: command }]);
    setCommandHistory(prev => [command, ...prev]);
    
    // Re-enable auto-scroll when submitting a command
    setIsAutoScrollEnabled(true);
    
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
    
    // Focus the input field again after command execution
    if (inputRef.current) {
      inputRef.current.focus();
    }
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
    <div className="flex flex-col h-full w-full">
      {/* Terminal header */}
      <div className={`flex justify-between items-center p-2 border-b ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'
      }`}>
        <div className="flex items-center">
          <span className="font-medium text-sm sm:text-base">WordPress Terminal</span>
        </div>
        <div className="flex space-x-1 sm:space-x-2">
          <button 
            onClick={handleCopyToClipboard}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Copy to clipboard"
          >
            <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button 
            onClick={handleDownload}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Download history"
          >
            <DownloadCloud className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button 
            onClick={() => {
              setHistory([{ type: 'output', content: 'Terminal cleared.' }]);
              if (inputRef.current) inputRef.current.focus();
              setIsAutoScrollEnabled(true);
            }}
            className={`p-1 rounded ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Clear terminal"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
      
      {/* Terminal output with improved scrolling */}
      <div 
        ref={terminalRef}
        className={`flex-1 overflow-y-auto p-2 font-mono text-xs sm:text-sm ${
          isDark ? 'bg-gray-900 text-gray-200' : 'bg-black text-gray-200'
        } terminal-scrollbar`}
        style={{ 
          height: isMobile ? '150px' : '200px',
          minHeight: isMobile ? '150px' : '200px',
          maxHeight: isMobile ? '250px' : '400px',
          width: '100%',
          resize: 'vertical',
          overflow: 'auto',
          paddingBottom: '20px' // Extra padding to ensure text isn't cut off
        }}
      >
        {history.map((item, index) => (
          <div key={index} className="whitespace-pre-wrap break-words mb-1">
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
        {/* Invisible element to help with scrolling to the very bottom */}
        <div className="h-4"></div>
      </div>
      
      {/* Command input - Make sticky to ensure it's always visible */}
      <div className={`sticky bottom-0 border-t w-full ${
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
            className={`flex-1 bg-transparent border-none outline-none text-sm sm:text-base ${
              isDark ? 'text-white' : 'text-white'
            }`}
            placeholder="Type a command..."
            autoComplete="off"
            spellCheck="false"
          />
        </form>
      </div>
      
      {/* Scroll to bottom button - shows when auto-scroll is disabled */}
      {!isAutoScrollEnabled && (
        <button 
          onClick={() => {
            scrollToBottom();
            setIsAutoScrollEnabled(true);
          }}
          className={`absolute bottom-16 right-3 p-1.5 rounded-full shadow-md
            ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-600 text-gray-200 hover:bg-gray-500'}
            transition-all duration-200 z-10`}
          title="Scroll to bottom"
        >
          <ChevronRight className="w-4 h-4 rotate-90" />
        </button>
      )}
      
      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .terminal-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .terminal-scrollbar::-webkit-scrollbar-track {
          background: ${isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          border-radius: 4px;
        }
        
        .terminal-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.3)'};
          border-radius: 4px;
        }
        
        .terminal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.4)'};
        }
        
        /* For Firefox */
        .terminal-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: ${isDark ? 'rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3) rgba(0, 0, 0, 0.2)'};
        }
      `}</style>
    </div>
  );
};

export default AgentTerminal; 