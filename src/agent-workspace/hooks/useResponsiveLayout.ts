import { useState, useEffect, useCallback } from 'react';
import { PanelLayout } from '../types';
import { useScreenSize, MOBILE_BREAKPOINT, TABLET_BREAKPOINT, DESKTOP_BREAKPOINT } from './useScreenSize';
import { usePanelState } from './usePanelState';

interface ResponsiveLayoutHook {
  // Panel states from usePanelState
  chatSize: number;
  explorerSize: number;
  editorSize: number;
  terminalSize: number;
  showExplorer: boolean;
  showPreview: boolean;
  showTerminal: boolean;
  layout: PanelLayout;
  
  // Screen states from useScreenSize
  screenMode: 'mobile' | 'tablet' | 'desktop' | 'large_desktop';
  windowWidth: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  
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
  
  // Utility values
  desktopBreakpoint: number;
  tabletBreakpoint: number;
  mobileBreakpoint: number;
}

/**
 * Custom hook that combines screen size detection and panel state management
 * with responsive layout adjustments
 */
export function useResponsiveLayout(): ResponsiveLayoutHook {
  const screenSize = useScreenSize();
  const panelState = usePanelState();
  
  // Effect for adapting layout to screen changes
  useEffect(() => {
    const { windowWidth, screenMode } = screenSize;
    const { 
      layout, 
      showExplorer, 
      showPreview, 
      showTerminal, 
      chatSize,
      explorerSize,
      editorSize,
      terminalSize,
      applyLayoutChange,
      setShowExplorer,
      setShowPreview,
      setShowTerminal,
      setChatSize,
      setExplorerSize,
      setEditorSize,
      setTerminalSize
    } = panelState;
    
    // Auto-adjust layout for different screen sizes
    if (windowWidth < MOBILE_BREAKPOINT) {
      // Mobile optimizations
      if (!showExplorer && !showPreview) {
        setShowPreview(true);
      }
      
      if (showTerminal && terminalSize > 40) {
        // Terminal shouldn't take up too much space on mobile
        setTerminalSize(35);
      }
      
      // Optimize layout for mobile - prefer simpler layouts
      if (layout === PanelLayout.Split) {
        // Split view on mobile uses stacked arrangement (handled in WorkspaceLayout)
        // But we may want to switch to Editor for very small screens
        if (windowWidth < MOBILE_BREAKPOINT * 0.8) {
          applyLayoutChange(PanelLayout.Editor);
        }
      }
      
      // Make chat panel take appropriate space on mobile - but not 100%
      if (Math.abs(chatSize - 50) > 15) { // Only adjust if significantly different
        const storedMobileHeight = localStorage.getItem('wp-agent-chat-height-mobile');
        if (storedMobileHeight) {
          setChatSize(parseFloat(storedMobileHeight));
        } else {
          setChatSize(50); // Default for mobile
        }
      }
    } else if (windowWidth < TABLET_BREAKPOINT) {
      // Tablet optimizations
      if (!showExplorer && !showPreview) {
        setShowPreview(true);
      }
      
      if (showExplorer && showPreview && explorerSize > 25) {
        // Reduce explorer size on tablet when all panels are showing
        setExplorerSize(25);
      }
      
      // Adjust chat panel size for tablet - but preserve manual settings
      if (Math.abs(chatSize - 40) > 20) { // Only adjust if significantly different
        setChatSize(40);
      }
      
      // Make sure terminal doesn't take too much space
      if (showTerminal && terminalSize > 40) {
        setTerminalSize(35);
      }
    } else if (windowWidth < DESKTOP_BREAKPOINT) {
      // Small desktop optimizations
      // Only adjust if very different from reasonable range
      if (chatSize > 60) {
        setChatSize(35);
      }
      
      if (explorerSize > 30) {
        setExplorerSize(25);
      }
      
      // Enable split view for better use of horizontal space
      if (layout === PanelLayout.Editor && showPreview) {
        applyLayoutChange(PanelLayout.Split);
      }
      
      // Make sure at least one panel is visible
      if (!showExplorer && !showPreview) {
        setShowPreview(true);
      }
    } else {
      // Large desktop - enable split view if in editor mode
      if (layout === PanelLayout.Editor && showPreview) {
        applyLayoutChange(PanelLayout.Split);
      }
      
      if (!showExplorer && !showPreview) {
        // Show at least one panel on large screens
        setShowPreview(true);
      }
    }
  }, [screenSize.windowWidth, screenSize.screenMode]);
  
  // Add a resize event listener for handling orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      // Give the browser time to update dimensions
      setTimeout(() => {
        // Force a re-render by updating state, if needed
        const { applyLayoutChange, layout } = panelState;
        applyLayoutChange(layout); // Re-apply the same layout to trigger adjustments
      }, 100);
    };
    
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [panelState]);
  
  // Return combined hook values
  return {
    ...screenSize,
    ...panelState,
    desktopBreakpoint: DESKTOP_BREAKPOINT,
    tabletBreakpoint: TABLET_BREAKPOINT,
    mobileBreakpoint: MOBILE_BREAKPOINT
  };
} 