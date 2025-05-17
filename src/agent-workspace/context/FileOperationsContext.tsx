"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FileOperation } from '../components/notifications/FileOperationNotification';
import { websocketService, WebSocketEventType } from '../utils/websocketService';

interface FileOperationsContextProps {
  operations: FileOperation[];
  addOperation: (operation: Omit<FileOperation, 'timestamp'>) => void;
  updateOperation: (path: string, status: FileOperation['status']) => void;
  clearOperations: () => void;
}

const FileOperationsContext = createContext<FileOperationsContextProps>({
  operations: [],
  addOperation: () => {},
  updateOperation: () => {},
  clearOperations: () => {},
});

export const useFileOperations = () => useContext(FileOperationsContext);

interface FileOperationsProviderProps {
  children: React.ReactNode;
}

export const FileOperationsProvider: React.FC<FileOperationsProviderProps> = ({ children }) => {
  const [operations, setOperations] = useState<FileOperation[]>([]);

  // Auto-clear completed operations after 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOperations(prev => 
        prev.filter(op => {
          // Keep if operation is in progress or less than 10 seconds old
          const isInProgress = ['creating', 'updating', 'deleting'].includes(op.status);
          const isRecent = now - op.timestamp < 10000; // 10 seconds
          return isInProgress || isRecent;
        })
      );
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Listen for WebSocket file-related events
  useEffect(() => {
    const handleFileUpdate = (data: { file: { path: string } }) => {
      if (data.file && data.file.path) {
        const pathParts = data.file.path.split('/');
        const fileName = pathParts[pathParts.length - 1];
        
        // Check if this is a new file or an update to an existing file
        const existingOpIndex = operations.findIndex(op => 
          op.path === data.file.path && ['creating', 'updating'].includes(op.status)
        );
        
        if (existingOpIndex >= 0) {
          // Update existing operation
          const status = operations[existingOpIndex].status === 'creating' ? 'created' : 'updated';
          updateOperation(data.file.path, status);
        } else {
          // Add as a new operation
          addOperation({
            path: data.file.path,
            type: 'file',
            status: 'created'
          });
        }
      }
    };

    // Subscribe to WebSocket events
    websocketService.on(WebSocketEventType.FILE_UPDATE, handleFileUpdate);
    
    return () => {
      // Cleanup event listeners
      websocketService.off(WebSocketEventType.FILE_UPDATE, handleFileUpdate);
    };
  }, [operations]);

  const addOperation = (operation: Omit<FileOperation, 'timestamp'>) => {
    setOperations(prev => [
      ...prev,
      {
        ...operation,
        timestamp: Date.now()
      }
    ]);
  };

  const updateOperation = (path: string, status: FileOperation['status']) => {
    setOperations(prev => 
      prev.map(op => 
        op.path === path ? { ...op, status, timestamp: Date.now() } : op
      )
    );
  };

  const clearOperations = () => {
    setOperations([]);
  };

  return (
    <FileOperationsContext.Provider value={{ operations, addOperation, updateOperation, clearOperations }}>
      {children}
    </FileOperationsContext.Provider>
  );
};

export default FileOperationsProvider; 