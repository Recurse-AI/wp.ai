"use client";

import React, { useState, useEffect } from 'react';
import { Save, Upload, LayoutGrid, Columns, Monitor, Loader2, Sidebar, Eye, EyeOff, Terminal, Home, ChevronDown, HelpCircle, Bot, RefreshCw, Download, Wifi, WifiOff, AlertTriangle, History } from 'lucide-react';
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
  connectionStatus = 'connected',
  onToggleHistory
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [menuOpen, setMenuOpen] = useState(false);
  const [playgroundClient, setPlaygroundClient] = useState<PlaygroundClient | null>(null);

  // Define breakpoints for responsive design
  const MOBILE_BREAKPOINT = 640;
  const TABLET_BREAKPOINT = 768;
  const DESKTOP_BREAKPOINT = 1024;
  
  // State to track screen size
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  // Update screen size based on window width
  useEffect(() => {
    const updateScreenSize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth < MOBILE_BREAKPOINT) {
          setScreenSize('mobile');
        } else if (window.innerWidth < DESKTOP_BREAKPOINT) {
          setScreenSize('tablet');
        } else {
          setScreenSize('desktop');
        }
      }
    };
    
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  // Adjust UI based on screen size changes
  useEffect(() => {
    // Apply any specific adjustments when screen size changes
    if (screenSize === 'mobile') {
      // Mobile-specific adjustments
    } else if (screenSize === 'tablet') {
      // Tablet-specific adjustments
    }
  }, [screenSize]);

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
  
  // Adjust toolbar based on screen size
  const getButtonClassName = (isActive: boolean) => {
    const baseClasses = isActive
      ? isDark 
        ? 'bg-gray-700 text-blue-400' 
        : 'bg-white text-blue-600 shadow-sm'
      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300';
      
    // Adjust padding based on screen size
    const paddingClasses = screenSize === 'mobile' 
      ? 'p-1' 
      : screenSize === 'tablet' 
        ? 'p-1.5' 
        : 'p-1.5';
        
    return `${paddingClasses} rounded ${baseClasses}`;
  };
  
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
        
        <h1 className={`text-base sm:text-lg font-medium truncate
          ${screenSize === 'mobile' ? 'max-w-[100px]' : 
            screenSize === 'tablet' ? 'max-w-[140px]' : 'max-w-xs'}`}>
          {workspaceName}
        </h1>
        {isProcessing && (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        )}
      </div>
      
      {/* Center controls area - hidden on small screens */}
      <div className={`${screenSize === 'desktop' ? 'flex' : 'hidden'} items-center mx-auto space-x-4`}>
        {/* Primary layout controls - consolidated and simplified */}
        <div className={`flex items-center p-1 rounded-md ${
          isDark ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          {/* Editor button */}
          <button
            onClick={() => handleLayoutChange(PanelLayout.Editor)}
            className={getButtonClassName(layout === PanelLayout.Editor)}
            title="Code editor view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          
          {/* Split view button */}
          <button
            onClick={() => handleLayoutChange(PanelLayout.Split)}
            className={`${getButtonClassName(layout === PanelLayout.Split)} ml-2`}
            title="Split view (Editor + Preview)"
          >
            <Columns className="w-4 h-4" />
          </button>
          
          {/* Preview button */}
          <button
            onClick={() => handleLayoutChange(PanelLayout.Preview)}
            className={`${getButtonClassName(layout === PanelLayout.Preview)} ml-2`}
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
            className={getButtonClassName(showExplorer)}
            title={showExplorer ? "Hide file explorer" : "Show file explorer"}
          >
            <Sidebar className="w-4 h-4" />
          </button>
          
          {/* Terminal toggle */}
          <button
            onClick={onToggleTerminal}
            className={`${getButtonClassName(showTerminal)} ml-2`}
            title={showTerminal ? "Hide terminal" : "Show terminal"}
          >
            <Terminal className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Mobile and Tablet layout controls - visible on small and medium screens */}
      <div className={`${screenSize !== 'desktop' ? 'flex' : 'hidden'} items-center`}>
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
            <div className="flex items-center">
              <LayoutGrid className="w-4 h-4" />
              <ChevronDown className="w-3 h-3 ml-1" />
            </div>
          </button>
          
          {menuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40 bg-transparent"
                onClick={() => setMenuOpen(false)}
              />
              <div 
                className={`absolute right-0 z-50 mt-1 rounded-md shadow-lg ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                } ring-1 ring-black ring-opacity-5 focus:outline-none w-48`}
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
                    Code Editor
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
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  
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
                    {showExplorer ? 'Hide' : 'Show'} Files
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
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  
                  <button
                    onClick={() => {
                      handleDownloadSourceCode();
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center
                      ${isDark 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-700'
                      }`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Code
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
        
      {/* Action buttons */}
      <div className="flex items-center">
        {/* Connection status indicator - always show */}
        <div 
          className={`flex items-center p-1.5 mr-2 sm:mr-3 rounded-md ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}
          title={connectionInfo.title}
        >
          <ConnectionIcon 
            className={`w-4 h-4 ${connectionInfo.color} ${connectionInfo.animate ? 'animate-spin' : ''}`} 
          />
        </div>

        {/* History button - always visible */}
        {onToggleHistory && (
          <button
            onClick={onToggleHistory}
            className={`flex items-center p-1.5 mr-2 rounded ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title="View agent history"
          >
            <History className="w-4 h-4" />
            <span className={`ml-1 text-sm ${screenSize === 'mobile' ? 'hidden' : 'inline'}`}>History</span>
          </button>
        )}

        {/* Save button - always visible but more compact on mobile */}
        <button
          onClick={handleSave}
          className={`flex items-center p-1.5 rounded ${
            isDark 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          title="Save workspace"
        >
          <Save className="w-4 h-4" />
          <span className={`ml-1 text-sm ${screenSize === 'mobile' ? 'hidden' : 'inline'}`}>Save</span>
        </button>
      </div>

      {/* Add smooth transitions for any layout changes */}
      <style jsx global>{`
        .agent-toolbar * {
          transition: padding 0.2s, margin 0.2s, width 0.2s, height 0.2s;
        }
      `}</style>
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