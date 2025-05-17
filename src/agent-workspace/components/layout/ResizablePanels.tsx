import React from 'react';
import { Resizable } from "re-resizable";
import { ScreenMode } from '../../hooks/useScreenSize';

interface ResizablePanelProps {
  size: { width: string | number; height: string | number };
  minWidth?: string | number;
  maxWidth?: string | number;
  minHeight?: string | number;
  maxHeight?: string | number;
  enable: {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
    topRight?: boolean;
    bottomRight?: boolean;
    bottomLeft?: boolean;
    topLeft?: boolean;
  };
  children: React.ReactNode;
  className?: string;
  onResizeStop: (e: MouseEvent | TouchEvent, direction: string, ref: HTMLElement, d: { width: number; height: number }) => void;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  size,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  enable,
  children,
  className = '',
  onResizeStop,
}) => {
  return (
    <Resizable
      size={size}
      minWidth={minWidth}
      maxWidth={maxWidth}
      minHeight={minHeight}
      maxHeight={maxHeight}
      enable={enable}
      onResizeStop={onResizeStop}
      className={className}
    >
      {children}
    </Resizable>
  );
};

interface ChatPanelProps {
  screenMode: ScreenMode;
  windowWidth: number;
  desktopBreakpoint: number;
  chatSize: number;
  onChatResize: (direction: string, d: { width: number; height: number }, ref: HTMLElement) => void;
  isDark: boolean;
  children: React.ReactNode;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  screenMode,
  windowWidth,
  desktopBreakpoint,
  chatSize,
  onChatResize,
  isDark,
  children
}) => {
  // Set default values that work for both SSR and client
  const isDesktop = windowWidth >= desktopBreakpoint;
  
  return (
    <ResizablePanel
      size={{ 
        width: isDesktop ? `${chatSize}%` : '100%', 
        height: isDesktop ? "100%" : '45%'
      }}
      minWidth={isDesktop ? "20%" : '100%'}
      maxWidth={isDesktop ? "50%" : '100%'}
      minHeight={isDesktop ? "100%" : '30%'}
      maxHeight={isDesktop ? "100%" : '60%'}
      enable={{ 
        right: isDesktop, 
        bottom: !isDesktop,
        left: false
      }}
      onResizeStop={(e, direction, ref, d) => onChatResize(direction, d, ref)}
      className={`chat-panel ${isDesktop ? 'border-r' : ''} ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      } transition-all duration-200 overflow-hidden ${
        !isDesktop ? 'hidden lg:block' : ''
      }`}
    >
      <div className="h-full overflow-hidden flex flex-col">
        {children}
      </div>
    </ResizablePanel>
  );
};

interface ExplorerPanelProps {
  screenMode: ScreenMode;
  windowWidth: number;
  tabletBreakpoint: number;
  explorerSize: number;
  setExplorerSize: (size: number) => void;
  isDark: boolean;
  children: React.ReactNode;
}

export const ExplorerPanel: React.FC<ExplorerPanelProps> = ({
  screenMode,
  windowWidth,
  tabletBreakpoint,
  explorerSize,
  setExplorerSize,
  isDark,
  children
}) => {
  // Set default values that work for both SSR and client
  const isTablet = windowWidth >= tabletBreakpoint;
  
  return (
    <ResizablePanel
      size={{ 
        width: isTablet ? `${explorerSize}%` : '100%', 
        height: isTablet ? "100%" : '40%'
      }}
      minWidth={isTablet ? "15%" : '100%'}
      maxWidth={isTablet ? "35%" : '100%'}
      minHeight={isTablet ? "100%" : '25%'}
      maxHeight={isTablet ? "100%" : '60%'}
      enable={{ 
        right: isTablet,
        bottom: !isTablet
      }}
      onResizeStop={(e, direction, ref, d) => {
        if (!isTablet) {
          // Handle height resize on small screens
          const containerHeight = ref.parentElement?.clientHeight || 0;
          if (containerHeight > 0) {
            const newHeight = 40 + (d.height / containerHeight * 100);
            const clampedHeight = Math.max(25, Math.min(60, newHeight));
            // Store in localStorage for persistence
            localStorage.setItem('wp-agent-explorer-height-mobile', clampedHeight.toString());
          }
        } else {
          // Calculate new size as percentage of parent container
          const parentWidth = ref.parentElement?.clientWidth || 0;
          if (parentWidth > 0) {
            const resizeExplorerSize = explorerSize + (d.width / parentWidth * 100);
            const clampedSize = Math.max(15, Math.min(35, resizeExplorerSize));
            setExplorerSize(clampedSize);
            // Ensure the new size is saved to localStorage immediately
            localStorage.setItem('wp-agent-explorer-size', clampedSize.toString());
          }
        }
      }}
      className="explorer-panel"
    >
      <div className="h-full overflow-auto">
        {children}
      </div>
    </ResizablePanel>
  );
};

interface EditorPanelProps {
  editorSize: number;
  setEditorSize: (size: number) => void;
  isDark: boolean;
  children: React.ReactNode;
}

export const EditorPanel: React.FC<EditorPanelProps> = ({
  editorSize,
  setEditorSize,
  isDark,
  children
}) => {
  return (
    <ResizablePanel
      size={{ width: `${editorSize}%`, height: "100%" }}
      minWidth="30%"
      maxWidth="70%"
      enable={{ right: true }}
      onResizeStop={(e, direction, ref, d) => {
        const parentWidth = ref.parentElement?.clientWidth || 0;
        if (parentWidth > 0) {
          const resizeEditorSize = editorSize + (d.width / parentWidth * 100);
          const clampedSize = Math.max(30, Math.min(70, resizeEditorSize));
          setEditorSize(clampedSize);
          // Ensure the new size is saved to localStorage immediately
          localStorage.setItem('wp-agent-editor-size', clampedSize.toString());
        }
      }}
      className={`editor-panel border-r ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-all duration-200 overflow-hidden`}
    >
      <div className="h-full overflow-auto">
        {children}
      </div>
    </ResizablePanel>
  );
};

interface TerminalPanelProps {
  terminalSize: number;
  setTerminalSize: (size: number) => void;
  isDark: boolean;
  children: React.ReactNode;
  windowWidth: number;
  tabletBreakpoint: number;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  terminalSize,
  setTerminalSize,
  isDark,
  children,
  windowWidth,
  tabletBreakpoint
}) => {
  return (
    <ResizablePanel
      size={{ 
        width: "100%", 
        height: `${terminalSize}%` 
      }}
      minHeight="15%"
      maxHeight={windowWidth < tabletBreakpoint ? "70%" : "50%"}
      enable={{ top: true }}
      onResizeStop={(e, direction, ref, d) => {
        const containerHeight = ref.parentElement?.clientHeight || 0;
        if (containerHeight > 0) {
          const resizeTerminalSize = terminalSize - (d.height / containerHeight * 100);
          const clampedSize = Math.max(15, Math.min(windowWidth < tabletBreakpoint ? 70 : 50, resizeTerminalSize));
          setTerminalSize(clampedSize);
          // Ensure the new size is saved to localStorage immediately
          localStorage.setItem('wp-agent-terminal-size', clampedSize.toString());
        }
      }}
      className={`terminal-panel border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} transition-all duration-200 overflow-hidden`}
    >
      <div className="h-full overflow-auto">
        {children}
      </div>
    </ResizablePanel>
  );
};

// Global ResizablePanels CSS
export const ResizablePanelsCSS = () => (
  <style jsx global>{`
    .react-resizable-handle {
      position: absolute;
      width: 5px;
      height: 100%;
      background-clip: padding-box;
      border-right: 1px solid transparent;
      cursor: col-resize;
      z-index: 10;
      transition: background-color 0.2s;
    }
    
    .react-resizable-handle-e {
      right: 0;
      top: 0;
    }
    
    .react-resizable-handle-s {
      bottom: 0;
      left: 0;
      width: 100%;
      height: 5px;
      cursor: row-resize;
    }
    
    .react-resizable-handle:hover {
      background-color: #3b82f6;
    }
    
    /* Additional responsive styles */
    @media (max-width: 768px) {
      .react-resizable-handle {
        width: 100%;
        height: 5px;
      }
      
      .react-resizable-handle-e,
      .react-resizable-handle-w {
        display: none;
      }
    }
    
    /* Make handles more visible on touch devices */
    @media (hover: none) and (pointer: coarse) {
      .react-resizable-handle {
        width: 10px;
        height: 10px;
        background-color: rgba(59, 130, 246, 0.5);
      }
      
      .react-resizable-handle-s {
        height: 10px;
      }
    }
  `}</style>
); 