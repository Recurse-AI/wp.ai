import AgentWorkspace from './components/AgentWorkspace';
import AgentLanding from './components/landing/AgentLanding';
import { WordPressWorkspace } from './components/file-explorer';
import WorkspaceStateProvider, { useWorkspaceState } from './context/WorkspaceStateManager';
import StreamingResponse from './components/StreamingResponse';

// Add custom scrollbar styles
if (typeof document !== 'undefined') {
  const styles = `
    /* Basic scroll behavior */
    html, body {
      height: 100%;
      overflow-y: auto;
      overscroll-behavior-y: none;
    }
    
    /* Ensure all elements can be scrolled if they overflow */
    .agent-workspace, 
    .agent-workspace > div {
      overscroll-behavior: contain;
      height: calc(100vh - 4rem);
      max-height: calc(100vh - 4rem);
    }
    
    /* Custom scrollbar styling */
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

    /* Apply to all scrollable elements in the workspace */
    .agent-workspace *::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    .agent-workspace *::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }
    
    .agent-workspace *::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.15);
      border-radius: 4px;
    }
    
    .agent-workspace *::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.25);
    }
    
    .dark .agent-workspace *::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .dark .agent-workspace *::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
    }
    
    .dark .agent-workspace *::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.25);
    }
    
    /* Modern CSS scrollbar styling */
    .agent-workspace * {
      scrollbar-width: thin;
      scrollbar-color: rgba(0, 0, 0, 0.2) rgba(0, 0, 0, 0.05);
    }
    
    .dark .agent-workspace * {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.2) rgba(255, 255, 255, 0.05);
    }
    
    /* Fix for textarea inputs to ensure they're visible */
    textarea, input {
      -webkit-appearance: none;
      appearance: none;
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

// Export components
export { AgentWorkspace, AgentLanding, WordPressWorkspace, StreamingResponse };
// Export WordPress components
export * from './components/file-explorer';

// Export hooks
export { default as useFileExtractor } from './hooks/useFileExtractor';
export { default as useStreamingResponse } from './hooks/useStreamingResponse';

// Export services
export { agentAPI } from './utils/apiService';
export { websocketService, WebSocketEventType } from './utils/websocketService';

// Export types
export * from './types';

// Export constants
export * from './constants';

// Export WordPress components
export * from './components/file-explorer';

// Export file utils
export * from './utils/fileUtils'; 

// Export state management
export { WorkspaceStateProvider, useWorkspaceState }; 