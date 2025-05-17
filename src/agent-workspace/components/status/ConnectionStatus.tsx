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
  // Always show status in the header (even when connected)
  // Common styles for status messages - positioned inline in header
  const statusClassName = "inline-flex items-center ml-2 py-1 px-2 text-xs rounded-md";

  // Show connecting status
  if (connectionStatus === 'connecting') {
    return (
      <div className={`${statusClassName} ${
        isDark ? 'bg-yellow-900 text-white' : 'bg-yellow-100 text-yellow-800'
      }`}>
        <span className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M16 12a4 4 0 1 1-8 0"></path>
          </svg>
          <span className="truncate">Connecting...</span>
        </span>
      </div>
    );
  }

  // Show connection error message
  if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
    return (
      <div className={`${statusClassName} ${
        isDark ? 'bg-red-900 text-white' : 'bg-red-100 text-red-800'
      }`}>
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span className="truncate">
            {error && error.includes('Backend configuration error') ? 
              'Server error' :
              'Connection lost'
            }
          </span>
          <button 
            onClick={onReconnect}
            className={`underline text-xs ml-1 ${
              isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-800'
            }`}
          >
            Reconnect
          </button>
        </span>
      </div>
    );
  }

  // Show stuck processing warning if processing for more than 60 seconds
  if (processingTime && processingTime > 60000) {
    return (
      <div className={`${statusClassName} ${
        isDark ? 'bg-yellow-800 text-white' : 'bg-yellow-100 text-yellow-800'
      }`}>
        <span className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{Math.round(processingTime / 1000)}s</span>
          <button 
            onClick={onResetProcessing}
            className={`ml-1 text-xs ${
              isDark ? 'text-yellow-300 hover:text-yellow-200' : 'text-yellow-800 hover:underline'
            }`}
          >
            Reset
          </button>
        </span>
      </div>
    );
  }

  // Return connected state instead of null
  return (
    <div className={`${statusClassName} ${
      isDark ? 'bg-green-900 text-white' : 'bg-green-100 text-green-800'
    }`}>
      <span className="flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span className="truncate">Connected</span>
      </span>
    </div>
  );
};

export default ConnectionStatus; 