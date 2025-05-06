import { useState, useEffect } from 'react';
import { PanelLayout } from '../types';

// Local storage keys for panel sizes
const CHAT_SIZE_KEY = 'wp-agent-chat-size';
const EXPLORER_SIZE_KEY = 'wp-agent-explorer-size';
const EDITOR_SIZE_KEY = 'wp-agent-editor-size';
const PREVIEW_SIZE_KEY = 'wp-agent-preview-size';
const TERMINAL_SIZE_KEY = 'wp-agent-terminal-size';
const EXPLORER_VISIBLE_KEY = 'wp-agent-explorer-visible';
const PREVIEW_VISIBLE_KEY = 'wp-agent-preview-visible';
const TERMINAL_VISIBLE_KEY = 'wp-agent-terminal-visible';
const LAYOUT_KEY = 'wp-agent-layout';

interface PanelStateHook {
  // Panel sizes as percentages
  chatSize: number;
  explorerSize: number;
  editorSize: number;
  terminalSize: number;
  
  // Panel visibility
  showExplorer: boolean;
  showPreview: boolean;
  showTerminal: boolean;
  
  // Layout
  layout: PanelLayout;
  
  // Setters
  setChatSize: (size: number) => void;
  setExplorerSize: (size: number) => void;
  setEditorSize: (size: number) => void;
  setTerminalSize: (size: number) => void;
  setShowExplorer: (show: boolean) => void;
  setShowPreview: (show: boolean) => void;
  setShowTerminal: (show: boolean) => void;
  applyLayoutChange: (newLayout: PanelLayout) => void;
  
  // Toggle functions
  toggleExplorer: () => void;
  togglePreview: () => void;
  toggleTerminal: () => void;
}

/**
 * Custom hook for managing panel states in the Agent Workspace
 */
export function usePanelState(): PanelStateHook {
  // Load from localStorage on first render
  const [chatSize, setChatSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSize = localStorage.getItem(CHAT_SIZE_KEY);
      return savedSize ? parseInt(savedSize, 10) : 30;
    }
    return 30; // Default 30% width
  });

  const [explorerSize, setExplorerSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSize = localStorage.getItem(EXPLORER_SIZE_KEY);
      return savedSize ? parseInt(savedSize, 10) : 20;
    }
    return 20; // Default 20% width
  });
  
  const [editorSize, setEditorSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSize = localStorage.getItem(EDITOR_SIZE_KEY);
      return savedSize ? parseInt(savedSize, 10) : 50;
    }
    return 50; // Default 50% width for workspace area minus explorer
  });
  
  const [terminalSize, setTerminalSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedSize = localStorage.getItem(TERMINAL_SIZE_KEY);
      return savedSize ? parseInt(savedSize, 10) : 30;
    }
    return 30; // Default 30% height
  });
  
  // Panel visibility state
  const [showExplorer, setShowExplorer] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedVisible = localStorage.getItem(EXPLORER_VISIBLE_KEY);
      return savedVisible ? savedVisible === 'true' : false;
    }
    return false;
  });
  
  const [showPreview, setShowPreview] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedVisible = localStorage.getItem(PREVIEW_VISIBLE_KEY);
      return savedVisible ? savedVisible === 'true' : true;
    }
    return true;
  });
  
  const [showTerminal, setShowTerminal] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedVisible = localStorage.getItem(TERMINAL_VISIBLE_KEY);
      return savedVisible ? savedVisible === 'true' : false;
    }
    return false;
  });

  // Layout state
  const [layout, setLayout] = useState<PanelLayout>(() => {
    if (typeof window !== 'undefined') {
      const savedLayout = localStorage.getItem(LAYOUT_KEY);
      return savedLayout ? (savedLayout as PanelLayout) : PanelLayout.Split;
    }
    return PanelLayout.Split;
  });

  // Save panel sizes to localStorage when they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHAT_SIZE_KEY, chatSize.toString());
    }
  }, [chatSize]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXPLORER_SIZE_KEY, explorerSize.toString());
    }
  }, [explorerSize]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(EDITOR_SIZE_KEY, editorSize.toString());
    }
  }, [editorSize]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TERMINAL_SIZE_KEY, terminalSize.toString());
    }
  }, [terminalSize]);
  
  // Save panel visibility states
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXPLORER_VISIBLE_KEY, showExplorer.toString());
    }
  }, [showExplorer]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(PREVIEW_VISIBLE_KEY, showPreview.toString());
    }
  }, [showPreview]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TERMINAL_VISIBLE_KEY, showTerminal.toString());
    }
  }, [showTerminal]);

  // Save layout state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAYOUT_KEY, layout);
    }
  }, [layout]);

  // Apply layout changes
  const applyLayoutChange = (newLayout: PanelLayout) => {
    setLayout(newLayout);
    
    // If we're switching to editor mode, ensure preview is hidden
    if (newLayout === PanelLayout.Editor) {
      setShowPreview(false);
    }
    
    // If we're switching to preview mode, ensure preview is shown
    if (newLayout === PanelLayout.Preview || newLayout === PanelLayout.Split) {
      setShowPreview(true);
    }
    
    // Store the layout preference in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAYOUT_KEY, newLayout);
    }
  };

  // Toggle panel visibility
  const toggleExplorer = () => {
    const newValue = !showExplorer;
    setShowExplorer(newValue);
    localStorage.setItem(EXPLORER_VISIBLE_KEY, newValue.toString());
  };

  const togglePreview = () => {
    const newValue = !showPreview;
    setShowPreview(newValue);
    localStorage.setItem(PREVIEW_VISIBLE_KEY, newValue.toString());
  };

  const toggleTerminal = () => {
    const newValue = !showTerminal;
    setShowTerminal(newValue);
    localStorage.setItem(TERMINAL_VISIBLE_KEY, newValue.toString());
  };

  return {
    chatSize,
    explorerSize,
    editorSize,
    terminalSize,
    showExplorer,
    showPreview,
    showTerminal,
    layout,
    setChatSize,
    setExplorerSize,
    setEditorSize,
    setTerminalSize,
    setShowExplorer,
    setShowPreview,
    setShowTerminal,
    applyLayoutChange,
    toggleExplorer,
    togglePreview,
    toggleTerminal
  };
} 