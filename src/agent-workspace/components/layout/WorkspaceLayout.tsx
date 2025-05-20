import React, { useCallback } from 'react';
import { PanelLayout, FileNode } from '../../types';
import { ChatPanel, EditorPanel, ExplorerPanel, TerminalPanel, ResizablePanelsCSS } from './ResizablePanels';
import AgentEditor from '../panels/AgentEditor';
import AgentPreview from '../panels/AgentPreview';
import FileExplorer from '../panels/FileExplorer';
import AgentTerminal from '../panels/AgentTerminal';
import { ScreenMode } from '../../hooks/useScreenSize';

interface WorkspaceLayoutProps {
  screenMode: ScreenMode;
  windowWidth: number;
  layout: PanelLayout;
  showExplorer: boolean;
  showPreview: boolean;
  showTerminal: boolean;
  isDark: boolean;
  
  // Panel sizes
  chatSize: number;
  explorerSize: number;
  editorSize: number;
  terminalSize: number;
  
  // Setters
  setChatSize: (size: number) => void;
  setExplorerSize: (size: number) => void;
  setEditorSize: (size: number) => void;
  setTerminalSize: (size: number) => void;
  
  // Handlers
  onFileSelect: (file: FileNode) => void;
  onFileContentChange: (content: string) => void;
  onFilesChange: (files: Record<string, FileNode>) => void;
  onRunCommand: (command: string) => Promise<string>;
  onToggleTerminal: () => void;
  
  // Data
  activeFile?: FileNode;
  files: Record<string, FileNode>;
  currentService?: any;
  processingFilePath?: string;
  
  // Breakpoints
  desktopBreakpoint: number;
  tabletBreakpoint: number;
  mobileBreakpoint: number;
}

const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  screenMode,
  windowWidth,
  layout,
  showExplorer,
  showPreview,
  showTerminal,
  isDark,
  chatSize,
  explorerSize,
  editorSize,
  terminalSize,
  setChatSize,
  setExplorerSize,
  setEditorSize,
  setTerminalSize,
  onFileSelect,
  onFileContentChange,
  onFilesChange,
  onRunCommand,
  onToggleTerminal,
  activeFile,
  files,
  currentService,
  processingFilePath,
  desktopBreakpoint,
  tabletBreakpoint,
  mobileBreakpoint
}) => {
  // Handle chat resize 
  const handleChatResize = useCallback((direction: string, delta: { width: number; height: number }, elementRef: HTMLElement) => {
    if (windowWidth < desktopBreakpoint) {
      // Handle vertical resize on mobile/tablet
      const containerHeight = elementRef.parentElement?.clientHeight || 0;
      if (containerHeight > 0) {
        const newHeight = 50 + (delta.height / containerHeight * 100);
        const clampedHeight = Math.max(30, Math.min(70, newHeight));
        // Save mobile height
        localStorage.setItem('wp-agent-chat-height-mobile', clampedHeight.toString());
      }
    } else {
      // Handle horizontal resize on desktop
      const parentWidth = elementRef.parentElement?.clientWidth || windowWidth;
      if (parentWidth > 0) {
        const newWidth = chatSize + (delta.width / parentWidth * 100);
        const clampedWidth = Math.max(20, Math.min(50, newWidth));
        setChatSize(clampedWidth);
        // Save immediately
        localStorage.setItem('wp-agent-chat-size', clampedWidth.toString());
      }
    }
  }, [chatSize, windowWidth, desktopBreakpoint, setChatSize]);
  
  // Render the empty editor message when no file is selected
  const renderEmptyEditor = () => (
    <div className={`flex items-center justify-center h-full ${
      isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-500'
    }`}>
      <p className="text-center p-4">Select a file to edit or use the chat to create files</p>
    </div>
  );
  
  // Render the editor panel based on current layout
  const renderEditorContent = () => {
    // Basic editor panel for editor mode or when preview is off
    if (layout === PanelLayout.Editor || !showPreview) {
      return activeFile ? (
        <AgentEditor
          file={activeFile}
          onChange={onFileContentChange}
        />
      ) : renderEmptyEditor();
    } 
    
    // Pure preview mode
    else if (layout === PanelLayout.Preview) {
      return (
        <div className="h-full bg-card flex flex-col">
          <div className="flex-grow overflow-auto">
            <AgentPreview 
              files={files} 
              activeFile={activeFile}
              currentService={currentService}
            />
          </div>
        </div>
      );
    } 
    
    // Split mode on desktop
    else if (layout === PanelLayout.Split && windowWidth >= tabletBreakpoint) {
      return (
        <div className="flex h-full">
          <EditorPanel
            editorSize={editorSize}
            setEditorSize={setEditorSize}
            isDark={isDark}
          >
            {activeFile ? (
              <AgentEditor
                file={activeFile}
                onChange={onFileContentChange}
              />
            ) : renderEmptyEditor()}
          </EditorPanel>
          <div className="flex-1 overflow-auto">
            <AgentPreview 
              files={files}
              activeFile={activeFile}
              currentService={currentService}
            />
          </div>
        </div>
      );
    } 
    
    // Split mode on mobile/tablet
    else if (layout === PanelLayout.Split && windowWidth < tabletBreakpoint) {
      // On small screens, stack editor and preview instead of side by side
      const isLandscape = typeof window !== 'undefined' && window.matchMedia && 
                         window.matchMedia('(orientation: landscape)').matches;
      
      // For landscape mode on mobile, use side-by-side view
      const flexDirection = isLandscape ? 'split-view-mobile' : 'flex-col';
                         
      return (
        <div className={`flex ${flexDirection} h-full`}>
          <div className={`${isLandscape ? 'h-full' : 'h-1/2 min-h-[200px]'} border-b transition-all duration-200 ${isDark ? 'border-gray-700' : 'border-gray-200'} editor-content`}>
            {activeFile ? (
              <AgentEditor
                file={activeFile}
                onChange={onFileContentChange}
              />
            ) : renderEmptyEditor()}
          </div>
          <div className={`${isLandscape ? 'h-full' : 'h-1/2 min-h-[200px]'} overflow-auto`}>
            <AgentPreview 
              files={files}
              activeFile={activeFile}
              currentService={currentService}
            />
          </div>
        </div>
      );
    } 
    
    // Fallback to editor only
    else {
      return activeFile ? (
        <AgentEditor
          file={activeFile}
          onChange={onFileContentChange}
        />
      ) : renderEmptyEditor();
    }
  };
  
  return (
    <>
      <div className="flex flex-1 flex-col lg:flex-row h-full w-full max-h-full overflow-hidden">
        {/* Explorer Panel - Conditionally rendered */}
        {showExplorer && (
          <ExplorerPanel
            screenMode={screenMode}
            windowWidth={windowWidth}
            tabletBreakpoint={tabletBreakpoint}
            explorerSize={explorerSize}
            setExplorerSize={setExplorerSize}
            isDark={isDark}
          >
            <FileExplorer
              files={files}
              selectedFileId={activeFile ? (activeFile as any).id : undefined}
              onFileSelect={onFileSelect}
              onFilesChange={onFilesChange}
              processingFilePath={processingFilePath}
            />
          </ExplorerPanel>
        )}

        {/* Editor/Preview Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 overflow-hidden">
            {renderEditorContent()}
          </div>

          {/* Terminal - Conditional */}
          {showTerminal && (
            <TerminalPanel
              terminalSize={terminalSize}
              setTerminalSize={setTerminalSize}
              isDark={isDark}
              windowWidth={windowWidth}
              tabletBreakpoint={tabletBreakpoint}
            >
              <div className="h-full overflow-auto">
                <AgentTerminal 
                  onRunCommand={onRunCommand} 
                  onToggleTerminal={onToggleTerminal}
                  showTerminal={showTerminal}
                />
              </div>
            </TerminalPanel>
          )}
        </div>
      </div>
      
      <ResizablePanelsCSS />
    </>
  );
};

export default WorkspaceLayout; 