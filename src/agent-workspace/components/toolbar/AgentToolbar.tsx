"use client";

import React, { useState, useEffect } from 'react';
import { Save, Upload, LayoutGrid, Columns, Monitor, Loader2, Sidebar, Eye, EyeOff, Terminal, Home, ChevronDown, HelpCircle, Bot, RefreshCw, Download, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { PanelLayout, AgentToolbarProps } from '../../types';
import { useTheme } from '@/context/ThemeProvider';
import Link from 'next/link';
import type { PlaygroundClient } from "@wp-playground/client";

const AgentToolbar: React.FC<AgentToolbarProps> = ({
  layout,
  onLayoutChange,
  workspaceName,
  isProcessing,
  onSaveWorkspace,
  onPublishCode,
  onToggleExplorer,
  onTogglePreview,
  onToggleTerminal,
  showExplorer = true,
  showPreview = true,
  showTerminal = true,
  connectionStatus = 'connected'
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const [playgroundClient, setPlaygroundClient] = useState<PlaygroundClient | null>(null);

  // Initialize WordPress Playground client when needed
  useEffect(() => {
    return () => {
      // Clean up playground client if it exists
      if (playgroundClient && typeof (playgroundClient as any).dispose === 'function') {
        (playgroundClient as any).dispose().catch(console.error);
      }
    };
  }, []);

  const handleLayoutChange = (newLayout: PanelLayout) => {
    if (onLayoutChange) {
      onLayoutChange(newLayout);
    }
  };
  
  const handleSave = async () => {
    if (onSaveWorkspace) {
      await onSaveWorkspace();
    }
  };
  
  const handlePublish = async () => {
    if (onPublishCode) {
      await onPublishCode();
    }
  };
  
  const handleDownloadSourceCode = () => {
    // Dispatch an event to the parent component to handle the download
    // This is a simple approach; alternatively you could pass a callback prop
    const event = new CustomEvent('download-source-code', {
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(event);
    setMenuOpen(false);
  };

  // Get connection status icon and color
  const getConnectionStatusInfo = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          color: isDark ? 'text-green-400' : 'text-green-500',
          title: 'Connected to agent server'
        };
      case 'connecting':
        return {
          icon: Loader2,
          color: isDark ? 'text-yellow-400' : 'text-yellow-500',
          title: 'Connecting to agent server...',
          animate: true
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: isDark ? 'text-red-400' : 'text-red-500',
          title: 'Disconnected from agent server'
        };
      case 'error':
        return {
          icon: AlertTriangle,
          color: isDark ? 'text-red-400' : 'text-red-500',
          title: 'Connection error'
        };
      default:
        return {
          icon: Wifi,
          color: isDark ? 'text-gray-400' : 'text-gray-500',
          title: 'Unknown connection status'
        };
    }
  };
  
  const connectionInfo = getConnectionStatusInfo();
  const ConnectionIcon = connectionInfo.icon;
  
  return (
    <div className={`flex items-center justify-between px-2 sm:px-4 py-2 border-b ${
      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Workspace name and home button */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <Link href="/" className={`p-1.5 rounded ${
          isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
        }`} title="Return to home">
          <Home className="w-4 h-4" />
        </Link>
        
        <h1 className="text-base sm:text-lg font-medium truncate max-w-[120px] sm:max-w-xs">
          {workspaceName}
        </h1>
        {isProcessing && (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        )}
      </div>
      
      {/* Center controls area - hidden on small screens */}
      <div className="hidden sm:flex items-center mx-auto space-x-4">
        {/* Primary layout controls - consolidated and simplified */}
        <div className={`flex items-center p-1 rounded-md ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          {/* Editor button */}
          <button
            onClick={() => handleLayoutChange(PanelLayout.Editor)}
            className={`p-1.5 rounded ${
              layout === PanelLayout.Editor
                ? isDark 
                  ? 'bg-gray-700 text-blue-400' 
                  : 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="Code editor view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          
          {/* Split view button */}
          <button
            onClick={() => handleLayoutChange(PanelLayout.Split)}
            className={`p-1.5 rounded ml-2 ${
              layout === PanelLayout.Split
                ? isDark 
                  ? 'bg-gray-700 text-blue-400' 
                  : 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="Split view (Editor + Preview)"
          >
            <Columns className="w-4 h-4" />
          </button>
          
          {/* Preview button */}
          <button
            onClick={() => handleLayoutChange(PanelLayout.Preview)}
            className={`p-1.5 rounded ml-2 ${
              layout === PanelLayout.Preview
                ? isDark 
                  ? 'bg-gray-700 text-blue-400' 
                  : 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title="Preview view"
          >
            <Monitor className="w-4 h-4" />
          </button>
        </div>
        
        {/* Secondary toggles for Explorer and Terminal */}
        <div className={`flex items-center p-1 rounded-md ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          {/* File Explorer toggle */}
          <button
            onClick={onToggleExplorer}
            className={`p-1.5 rounded ${
              showExplorer
                ? isDark 
                  ? 'bg-gray-700 text-blue-400' 
                  : 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title={showExplorer ? "Hide file explorer" : "Show file explorer"}
          >
            <Sidebar className="w-4 h-4" />
          </button>
          
          {/* Terminal toggle */}
          <button
            onClick={onToggleTerminal}
            className={`p-1.5 rounded ml-2 ${
              showTerminal
                ? isDark 
                  ? 'bg-gray-700 text-blue-400' 
                  : 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            title={showTerminal ? "Hide terminal" : "Show terminal"}
          >
            <Terminal className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Mobile layout controls - only visible on small screens */}
      <div className="flex sm:hidden items-center">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-1.5 rounded ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Layout options"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          
          {menuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setMenuOpen(false)}
              />
              <div 
                className={`absolute left-0 z-50 mt-1 rounded-md shadow-lg ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                } ring-1 ring-black ring-opacity-5 focus:outline-none w-40`}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleLayoutChange(PanelLayout.Editor);
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                      layout === PanelLayout.Editor
                        ? isDark 
                          ? 'bg-gray-700 text-blue-400'
                          : 'bg-gray-100 text-blue-600'
                        : isDark 
                          ? 'hover:bg-gray-700 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Editor
                  </button>
                  
                  <button
                    onClick={() => {
                      handleLayoutChange(PanelLayout.Split);
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                      layout === PanelLayout.Split
                        ? isDark 
                          ? 'bg-gray-700 text-blue-400'
                          : 'bg-gray-100 text-blue-600'
                        : isDark 
                          ? 'hover:bg-gray-700 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Columns className="w-4 h-4 mr-2" />
                    Split View
                  </button>
                  
                  <button
                    onClick={() => {
                      handleLayoutChange(PanelLayout.Preview);
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                      layout === PanelLayout.Preview
                        ? isDark 
                          ? 'bg-gray-700 text-blue-400'
                          : 'bg-gray-100 text-blue-600'
                        : isDark 
                          ? 'hover:bg-gray-700 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Preview
                  </button>
                  
                  <button
                    onClick={() => {
                      onToggleExplorer && onToggleExplorer();
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                      showExplorer
                        ? isDark 
                          ? 'bg-gray-700 text-blue-400'
                          : 'bg-gray-100 text-blue-600'
                        : isDark 
                          ? 'hover:bg-gray-700 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Sidebar className="w-4 h-4 mr-2" />
                    {showExplorer ? 'Hide' : 'Show'} Explorer
                  </button>
                  
                  <button
                    onClick={() => {
                      onToggleTerminal && onToggleTerminal();
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                      showTerminal
                        ? isDark 
                          ? 'bg-gray-700 text-blue-400'
                          : 'bg-gray-100 text-blue-600'
                        : isDark 
                          ? 'hover:bg-gray-700 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Terminal className="w-4 h-4 mr-2" />
                    {showTerminal ? 'Hide' : 'Show'} Terminal
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
        
      {/* Action buttons and connection status */}
      <div className="flex items-center">
        {/* Connection status indicator */}
        <div 
          className={`hidden sm:flex items-center p-1.5 mr-3 rounded-md ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}
          title={connectionInfo.title}
        >
          <ConnectionIcon 
            className={`w-4 h-4 ${connectionInfo.color} ${connectionInfo.animate ? 'animate-spin' : ''}`} 
          />
        </div>
        
        {/* Menu dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`p-1.5 rounded ${
              isDark 
                ? 'hover:bg-gray-800 text-gray-300' 
                : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="More options"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="6" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="18" r="1" />
            </svg>
          </button>
          
          {menuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setMenuOpen(false)}
              />
              <div 
                className={`absolute right-0 z-50 mt-1 w-48 rounded-md shadow-lg ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                } ring-1 ring-black ring-opacity-5 focus:outline-none custom-scrollbar`}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      window.open('https://wp.ai/docs', '_blank');
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                      isDark 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help & Documentation
                  </button>
                  
                  <button
                    onClick={handleDownloadSourceCode}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                      isDark 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Source Code
                  </button>
                  
                  {onSaveWorkspace && (
                    <button
                      onClick={() => {
                        handleSave();
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                        isDark 
                          ? 'hover:bg-gray-700 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Workspace
                    </button>
                  )}
                  
                  {onPublishCode && (
                    <button
                      onClick={() => {
                        handlePublish();
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                        isDark 
                          ? 'hover:bg-gray-700 text-gray-300' 
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Publish Code
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      if (onSaveWorkspace) {
                        onSaveWorkspace().then(() => {
                          window.location.href = '/';
                        });
                      } else {
                        window.location.href = '/';
                      }
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center ${
                      isDark 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    New Workspace
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        
        <button
          onClick={handleSave}
          disabled={isProcessing || !onSaveWorkspace}
          className={`p-1.5 rounded flex items-center mr-3 ${
            isProcessing || !onSaveWorkspace
              ? 'opacity-50 cursor-not-allowed'
              : isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
          }`}
          title="Save workspace"
        >
          <Save className="w-4 h-4" />
          <span className="ml-1 text-sm hidden sm:inline">Save</span>
        </button>
        
        {onPublishCode && (
          <button
            onClick={handlePublish}
            disabled={isProcessing}
            className={`p-1.5 rounded flex items-center ${
              isProcessing
                ? 'opacity-50 cursor-not-allowed'
                : isDark
                  ? 'bg-green-900/30 hover:bg-green-900/50 text-green-400'
                  : 'bg-green-50 hover:bg-green-100 text-green-600'
            }`}
            title="Publish code"
          >
            <Upload className="w-4 h-4" />
            <span className="ml-1 text-sm hidden sm:inline">Publish</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Add custom scrollbar styles
const styles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }
  
  .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

// Inject the styles into the document
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

export default AgentToolbar; 