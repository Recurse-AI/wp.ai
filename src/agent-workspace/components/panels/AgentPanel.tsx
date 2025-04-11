"use client";

import React from 'react';
import { AgentPanelProps, AgentFile, FileNode, PanelLayout } from '../../types';
import FileExplorer from './FileExplorer';
import AgentEditor from './AgentEditor';
import AgentPreview from './AgentPreview';
import AgentChat from './AgentChat';
import { useTheme } from '@/context/ThemeProvider';

interface ExtendedAgentPanelProps extends AgentPanelProps {
  onSendMessage: (message: string) => Promise<any>;
  onRegenerateMessage?: () => Promise<any>;
  onFileContentChange: (content: string) => void;
}

const AgentPanel: React.FC<ExtendedAgentPanelProps> = ({
  sessionState,
  layout,
  onLayoutChange,
  onFileSelect,
  onFilesChange,
  onSendMessage,
  onRegenerateMessage,
  onFileContentChange
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Helper function to render panels based on layout
  const renderPanels = () => {
    switch (layout) {
      case PanelLayout.Split:
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
                    <p>Select a file to edit</p>
                  </div>
                )}
              </div>
              
              {/* Preview/Chat */}
              <div className="w-1/2 h-full overflow-hidden">
                {sessionState.previewMode === 'wordpress' ? (
                  <AgentPreview
                    files={sessionState.files}
                    activeFile={sessionState.activeFile}
                  />
                ) : (
                  <AgentChat
                    sessionState={sessionState}
                    onSendMessage={onSendMessage}
                    onRegenerateMessage={onRegenerateMessage}
                  />
                )}
              </div>
            </div>
          </div>
        );
        
      case PanelLayout.Editor:
        return (
          <div className="flex h-full">
            {/* File Explorer */}
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
                  <p>Select a file to edit</p>
                </div>
              )}
            </div>
          </div>
        );
        
      case PanelLayout.Preview:
        return (
          <div className="flex h-full">
            {/* File Explorer */}
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
            
            {/* Preview (Full Width) */}
            <div className="flex-1 h-full overflow-hidden">
              <AgentPreview
                files={sessionState.files}
                activeFile={sessionState.activeFile}
              />
            </div>
          </div>
        );
        
      case PanelLayout.Chat:
        return (
          <div className="h-full">
            {/* Chat (Full Width) */}
            <AgentChat
              sessionState={sessionState}
              onSendMessage={onSendMessage}
              onRegenerateMessage={onRegenerateMessage}
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`h-full overflow-hidden ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {renderPanels()}
    </div>
  );
};

export default AgentPanel; 