import React from 'react';

interface ConnectionStatusProps {
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  error?: string;
  isDark: boolean;
  onReconnect: () => Promise<boolean>;
  processingTime?: number;
  onResetProcessing: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionStatus,
  error,
  isDark,
  onReconnect,
  processingTime,
  onResetProcessing
}) => {
  // Only show the disconnected/error message if there's an issue
  if (connectionStatus !== 'error' && connectionStatus !== 'disconnected' && !processingTime) {
    return null;
  }

  // Show connection error message
  if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
    return (
      <div className={`px-4 py-2 text-center text-sm  ${
        isDark ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800'
      }`}>
        <span className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {error && error.includes('Backend configuration error') ? 
            'Backend server configuration issue. Please check server logs.' :
            'Connection to agent server lost.'
          } 
          <button 
            onClick={onReconnect}
            className={`underline font-medium ${
              isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'
            }`}
          >
            Try reconnecting
          </button>
        </span>
      </div>
    );
  }

  // Show stuck processing warning if processing for more than 60 seconds
  if (processingTime && processingTime > 60000) {
    return (
      <div className={`px-4 py-2 text-center text-sm ${
        isDark ? 'bg-yellow-800 text-white' : 'bg-yellow-100 text-yellow-800'
      }`}>
        <span className="flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Processing for {Math.round(processingTime / 1000)} seconds
          <button 
            onClick={onResetProcessing}
            className={`ml-2 px-2 py-0.5 text-xs rounded ${
              isDark ? 'bg-yellow-700 text-white hover:bg-yellow-600' : 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
            }`}
          >
            Reset
          </button>
        </span>
      </div>
    );
  }

  return null;
};

export default ConnectionStatus; 