import React from 'react';
import { MOBILE_BREAKPOINT, TABLET_BREAKPOINT, DESKTOP_BREAKPOINT } from '../../hooks/useScreenSize';

const WorkspaceStyles: React.FC = () => {
  return (
    <style jsx global>{`
      /* Global reset for full height */
      html, body, body > div, body > div > div {
        height: 100%;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
      }

      #__next {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
        flex: 1;
      }
      
      /* Apply proper height constraints to the main app container */
      main {
        display: flex;
        flex-direction: column;
        flex: 1;
        height: calc(100vh - 4rem);
        overflow: hidden;
      }
      
      /* Ensure the agent workspace takes full available height */
      .agent-workspace {
        display: flex;
        flex-direction: column;
        flex: 1;
        overflow-y: auto;
        height: 100%;
        width: 100%;
        position: relative;
      }
      
      /* Dark mode fixes */
      html.dark {
        color-scheme: dark;
      }
      
      /* Proper Tailwind classes for dark mode */
      .dark {
        --tw-bg-opacity: 1;
        background-color: rgba(17, 24, 39, var(--tw-bg-opacity)) !important;
        --tw-text-opacity: 1;
        color: rgba(229, 231, 235, var(--tw-text-opacity)) !important;
      }
      
      /* Fix for dark mode text in components */
      .dark .text-black {
        --tw-text-opacity: 1;
        color: rgba(229, 231, 235, var(--tw-text-opacity)) !important;
      }
      
      /* Make sure all panel backgrounds follow the theme */
      .dark .bg-white {
        --tw-bg-opacity: 1;
        background-color: rgba(31, 41, 55, var(--tw-bg-opacity)) !important;
      }
      
      /* Fix for inputs in dark mode */
      .dark input, .dark textarea, .dark select {
        background-color: rgba(31, 41, 55, var(--tw-bg-opacity)) !important;
        color: rgba(229, 231, 235, var(--tw-text-opacity)) !important;
        border-color: rgba(75, 85, 99, var(--tw-border-opacity)) !important;
      }
      
      /* Panels inside the workspace should expand properly */
      .agent-workspace > div.flex-1 {
        flex: 1;
        min-height: 0;
        display: flex;
      }
      
      /* Smooth transitions for responsive layout changes */
      .agent-workspace * {
        transition: padding 0.2s, margin 0.2s, width 0.2s, height 0.2s;
      }

      /* Remove scrollbars completely while keeping functionality */
      * {
        scrollbar-width: none; /* Firefox */
        -ms-overflow-style: none; /* Internet Explorer and Edge */
      }

      /* Webkit browsers like Chrome/Safari */
      *::-webkit-scrollbar {
        width: 0;
        height: 0;
        display: none;
      }

      /* Header animation and transitions */
      .header-container {
        transition: transform 0.3s ease-in-out;
        position: relative;
        z-index: 10;
      }

      .header-visible {
        transform: translateY(0);
      }

      .header-hidden {
        transform: translateY(-100%);
      }

      /* Show toggle button when header is hidden */
      .header-hidden button[title="Show header"] {
        position: fixed;
        top: 5px;
        right: 5px;
        z-index: 20;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        opacity: 0.8;
      }

      .header-hidden button[title="Show header"]:hover {
        opacity: 1;
      }

      /* Enhanced Mobile Responsiveness */
      @media (max-width: ${MOBILE_BREAKPOINT}px) {
        .flex-col-mobile {
          display: flex !important;
          flex-direction: column !important;
        }
        
        .lg\\:flex-row {
          flex-direction: column !important;
        }
        
        /* Ensure panels take appropriate space */
        .react-resizable {
          width: 100% !important;
        }
        
        /* Make resizable handles easier to grab on mobile */
        .react-resizable-handle {
          width: 100% !important;
          height: 10px !important;
        }
        
        .react-resizable-handle-e,
        .react-resizable-handle-w {
          display: none !important;
        }
        
        /* Fix chat panel on mobile */
        .chat-panel {
          height: auto !important;
          min-height: 300px !important;
          max-height: 45% !important;
        }
        
        /* Ensure workspace components are visible */
        .agent-workspace > div.flex-1 > div.flex {
          flex: 1 1 auto !important;
          min-height: 55% !important;
        }
        
        /* Make sure file explorer has proper height */
        .explorer-panel {
          min-height: 200px !important;
          max-height: 40% !important;
          height: auto !important;
        }
        
        /* Ensure editor has proper height */
        .editor-panel, .editor-content {
          min-height: 250px !important;
        }

        /* Ensure parent containers expand properly */
        .agent-workspace > div.flex-1 {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
        }
      }

      /* Tablet Responsiveness */
      @media (min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT}px) {
        .lg\\:flex-row {
          flex-direction: column !important;
        }
        
        /* Ensure panels have minimum sizes */
        .explorer-panel {
          min-height: 250px !important;
          max-height: 40% !important;
        }
        
        .terminal-panel {
          min-height: 200px !important;
        }
        
        /* Ensure workspace components are visible */
        .agent-workspace > div.flex-1 > div.flex {
          flex: 1 1 auto !important;
          min-height: 60% !important;
        }
        
        /* Fix chat panel on tablet */
        .chat-panel {
          height: auto !important;
          min-height: 250px !important;
          max-height: 40% !important;
        }

        /* Ensure parent containers expand properly */
        .agent-workspace > div.flex-1 {
          display: flex !important;
          flex-direction: column !important;
          height: 100% !important;
        }
      }

      /* Desktop Responsiveness */
      @media (min-width: ${DESKTOP_BREAKPOINT}px) {
        .lg\\:flex-row {
          flex-direction: row !important;
        }
        
        /* Enhance proper sizing of panels */
        .explorer-panel {
          min-width: 200px !important;
          height: 100% !important;
        }
        
        .chat-panel {
          min-width: 300px !important;
          border-right: 1px solid var(--border-color) !important;
          height: 100% !important;
        }

        /* Set border colors based on theme */
        .dark .chat-panel {
          --border-color: rgba(75, 85, 99, var(--tw-border-opacity, 1)) !important;
        }
        
        .light .chat-panel {
          --border-color: rgba(229, 231, 235, var(--tw-border-opacity, 1)) !important;
        }

        /* Ensure workspace expands properly */
        .agent-workspace > div.flex-1 > div.flex {
          height: 100% !important;
        }
      }

      /* Ensure proper sizing for workspace area */
      .workspace-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
      }
      
      /* Fix for black space at bottom and theme consistency */
      body {
        overflow: hidden;
      }
      
      /* Better touch handling for mobile */
      @media (hover: none) and (pointer: coarse) {
        .react-resizable-handle {
          background-color: rgba(59, 130, 246, 0.3) !important;
        }
        
        .react-resizable-handle:active {
          background-color: rgba(59, 130, 246, 0.5) !important;
        }
        
        /* Increase touch targets */
        button, 
        .clickable {
          min-height: 44px;
          min-width: 44px;
        }
      }
      
      /* Better mobile portrait mode handling */
      @media (max-width: ${MOBILE_BREAKPOINT}px) and (orientation: portrait) {
        .editor-content {
          min-height: 250px !important;
        }
      }
      
      /* Better mobile landscape mode handling */
      @media (max-width: ${TABLET_BREAKPOINT}px) and (orientation: landscape) {
        .split-view-mobile {
          flex-direction: row !important;
        }
        
        /* Adjust heights for landscape */
        .agent-workspace > div.flex-1 > div.flex {
          height: 60% !important;
        }
        
        .chat-panel {
          height: 40% !important;
        }
      }
      
      /* Fix for mobile devices to ensure explorer and editor are both visible */
      @media (max-width: ${MOBILE_BREAKPOINT}px) {
        .explorer-panel + div.flex-1 {
          min-height: 200px !important;
        }
      }
    `}</style>
  );
};

export default WorkspaceStyles; 