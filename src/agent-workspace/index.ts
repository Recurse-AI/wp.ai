import AgentWorkspace from './components/AgentWorkspace';

// Add custom scrollbar styles
if (typeof document !== 'undefined') {
  const styles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
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
      width: 6px;
      height: 6px;
    }
    
    .agent-workspace *::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
    }
    
    .agent-workspace *::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }
    
    .agent-workspace *::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }
    
    .dark .agent-workspace *::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
    }
    
    .dark .agent-workspace *::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
    }
    
    .dark .agent-workspace *::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

// Export components
export { AgentWorkspace };

// Export hooks
export { useAgentState } from './hooks/useAgentState';
export { useAgentAPI } from './hooks/useAgentAPI';

// Export types
export * from './types';

// Export constants
export * from './constants'; 