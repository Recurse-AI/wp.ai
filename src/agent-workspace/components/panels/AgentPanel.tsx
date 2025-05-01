"use client";

import React, { useState, useEffect } from 'react';
import { AgentPanelProps, AgentFile, FileNode, PanelLayout } from '../../types';
import FileExplorer from './FileExplorer';
import AgentEditor from './AgentEditor';
import AgentPreview from './AgentPreview';
import AgentChat from './AgentChat';
import { useTheme } from '@/context/ThemeProvider';

interface ExtendedAgentPanelProps extends AgentPanelProps {
  onSendMessage: (message: string) => Promise<any>;
  onFileContentChange: (content: string) => void;
}

const AgentPanel: React.FC<ExtendedAgentPanelProps> = ({
  sessionState,
  layout,
  onLayoutChange,
  onFileSelect,
  onFilesChange,
  onSendMessage,
  onFileContentChange
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Define breakpoints for responsive design
  const MOBILE_BREAKPOINT = 640;
  const TABLET_BREAKPOINT = 768;
  const DESKTOP_BREAKPOINT = 1024;

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Helper function to render panels based on layout
  const renderPanels = () => {
    // On mobile, adjust layouts to be more vertical
    const isMobile = windowWidth < MOBILE_BREAKPOINT;
    const isTablet = windowWidth >= MOBILE_BREAKPOINT && windowWidth < DESKTOP_BREAKPOINT;

    switch (layout) {
      case PanelLayout.Split:
        if (isMobile) {
          // Mobile-friendly split view (stacked vertically)
          return (
            <div className="flex flex-col h-full">
              {/* File Explorer (collapsible on mobile) */}
              <div className={`h-52 w-full overflow-auto border-b ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <FileExplorer
                  files={sessionState.files}
                  selectedFileId={sessionState.activeFile?.id}
                  onFileSelect={onFileSelect}
                  onFilesChange={onFilesChange}
                />
              </div>
              
              {/* Content area */}
              <div className="flex-1 flex flex-col h-full">
                {/* Editor */}
                <div className="h-1/2 w-full overflow-hidden border-b">
                  {sessionState.activeFile ? (
                    <AgentEditor
                      file={sessionState.activeFile}
                      onChange={onFileContentChange}
                    />
                  ) : (
                    <div className={`flex items-center justify-center h-full ${
                      isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
                    }`}>
                      <p className="text-center p-4">Select a file to edit</p>
                    </div>
                  )}
                </div>
                
                {/* Preview/Chat */}
                <div className="h-1/2 w-full overflow-hidden">
                  <AgentChat
                    sessionState={sessionState}
                    onSendMessage={onSendMessage}
                  />
                </div>
              </div>
            </div>
          );
        } else if (isTablet) {
          // Tablet-friendly split view (adjusted ratios)
          return (
            <div className="flex h-full">
              {/* File Explorer (narrower on tablet) */}
              <div className={`w-48 h-full overflow-auto border-r ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <FileExplorer
                  files={sessionState.files}
                  selectedFileId={sessionState.activeFile?.id}
                  onFileSelect={onFileSelect}
                  onFilesChange={onFilesChange}
                />
              </div>
              
              {/* Content area */}
              <div className="flex-1 flex h-full">
                {/* Editor */}
                <div className="w-3/5 h-full overflow-hidden border-r">
                  {sessionState.activeFile ? (
                    <AgentEditor
                      file={sessionState.activeFile}
                      onChange={onFileContentChange}
                    />
                  ) : (
                    <div className={`flex items-center justify-center h-full ${
                      isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
                    }`}>
                      <p className="text-center p-4">Select a file to edit</p>
                    </div>
                  )}
                </div>
                
                {/* Preview/Chat */}
                <div className="w-2/5 h-full overflow-hidden">
                  <AgentChat
                    sessionState={sessionState}
                    onSendMessage={onSendMessage}
                  />
                </div>
              </div>
            </div>
          );
        } else {
          // Desktop view (original)
          return (
            <div className="flex h-full">
              {/* File Explorer (persistent in all layouts except Chat) */}
              <div className={`w-64 h-full overflow-auto border-r ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <FileExplorer
                  files={sessionState.files}
                  selectedFileId={sessionState.activeFile?.id}
                  onFileSelect={onFileSelect}
                  onFilesChange={onFilesChange}
                />
              </div>
              
              {/* Content area */}
              <div className="flex-1 flex h-full">
                {/* Editor */}
                <div className="w-1/2 h-full overflow-hidden border-r">
                  {sessionState.activeFile ? (
                    <AgentEditor
                      file={sessionState.activeFile}
                      onChange={onFileContentChange}
                    />
                  ) : (
                    <div className={`flex items-center justify-center h-full ${
                      isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
                    }`}>
                      <p className="text-center p-4">Select a file to edit</p>
                    </div>
                  )}
                </div>
                
                {/* Preview/Chat */}
                <div className="w-1/2 h-full overflow-hidden">
                  <AgentChat
                    sessionState={sessionState}
                    onSendMessage={onSendMessage}
                  />
                </div>
              </div>
            </div>
          );
        }
        
      case PanelLayout.Editor:
        if (isMobile) {
          // Mobile-friendly editor view (file explorer as a top panel)
          return (
            <div className="flex flex-col h-full">
              {/* File Explorer */}
              <div className={`h-52 w-full overflow-auto border-b ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <FileExplorer
                  files={sessionState.files}
                  selectedFileId={sessionState.activeFile?.id}
                  onFileSelect={onFileSelect}
                  onFilesChange={onFilesChange}
                />
              </div>
              
              {/* Editor (Full Width) */}
              <div className="flex-1 h-full overflow-hidden">
                {sessionState.activeFile ? (
                  <AgentEditor
                    file={sessionState.activeFile}
                    onChange={onFileContentChange}
                  />
                ) : (
                  <div className={`flex items-center justify-center h-full ${
                    isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
                  }`}>
                    <p className="text-center p-4">Select a file to edit</p>
                  </div>
                )}
              </div>
            </div>
          );
        } else {
          // Desktop view with responsive explorer width
          return (
            <div className="flex h-full">
              {/* File Explorer */}
              <div className={`${isTablet ? 'w-48' : 'w-64'} h-full overflow-auto border-r ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <FileExplorer
                  files={sessionState.files}
                  selectedFileId={sessionState.activeFile?.id}
                  onFileSelect={onFileSelect}
                  onFilesChange={onFilesChange}
                />
              </div>
              
              {/* Editor (Full Width) */}
              <div className="flex-1 h-full overflow-hidden">
                {sessionState.activeFile ? (
                  <AgentEditor
                    file={sessionState.activeFile}
                    onChange={onFileContentChange}
                  />
                ) : (
                  <div className={`flex items-center justify-center h-full ${
                    isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
                  }`}>
                    <p className="text-center p-4">Select a file to edit</p>
                  </div>
                )}
              </div>
            </div>
          );
        }
        
      case PanelLayout.Preview:
        if (isMobile) {
          // Mobile-friendly preview view
          return (
            <div className="flex flex-col h-full">
              {/* File Explorer */}
              <div className={`h-40 w-full overflow-auto border-b ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <FileExplorer
                  files={sessionState.files}
                  selectedFileId={sessionState.activeFile?.id}
                  onFileSelect={onFileSelect}
                  onFilesChange={onFilesChange}
                />
              </div>
              
              {/* Preview (Full Width) */}
              <div className="flex-1 h-full overflow-hidden">
                <AgentPreview
                  files={sessionState.files}
                  activeFile={sessionState.activeFile}
                />
              </div>
            </div>
          );
        } else {
          // Desktop view with responsive explorer width
          return (
            <div className="flex h-full">
              {/* File Explorer */}
              <div className={`${isTablet ? 'w-48' : 'w-64'} h-full overflow-auto border-r ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <FileExplorer
                  files={sessionState.files}
                  selectedFileId={sessionState.activeFile?.id}
                  onFileSelect={onFileSelect}
                  onFilesChange={onFilesChange}
                />
              </div>
              
              {/* Preview (Full Width) */}
              <div className="flex-1 h-full overflow-hidden">
                <AgentPreview
                  files={sessionState.files}
                  activeFile={sessionState.activeFile}
                />
              </div>
            </div>
          );
        }
        
      case PanelLayout.Chat:
        return (
          <div className="h-full">
            {/* Chat (Full Width) */}
            <AgentChat
              sessionState={sessionState}
              onSendMessage={onSendMessage}
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`h-full overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'} transition-all duration-200`}>
      {renderPanels()}
    </div>
  );
};

export default AgentPanel; 