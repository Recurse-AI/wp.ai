import React from 'react';
import { FiFolder, FiFile, FiCheck, FiLoader } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeProvider';

export type FileOperation = {
  path: string;
  type: 'file' | 'folder';
  status: 'creating' | 'created' | 'updating' | 'updated' | 'deleting' | 'deleted' | 'error';
  timestamp: number;
  error?: string;
};

interface FileOperationNotificationProps {
  operations: FileOperation[];
}

const FileOperationNotification: React.FC<FileOperationNotificationProps> = ({ operations }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (operations.length === 0) return null;

  // Get the last 5 operations, sorted by timestamp (newest first)
  const recentOperations = [...operations]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <div className={`mt-2 rounded-md overflow-hidden border ${
      isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className={`px-3 py-2 text-sm font-medium ${
        isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'
      }`}>
        File Operations
      </div>
      <div className="p-2 space-y-1.5">
        {recentOperations.map((op, index) => {
          // Extract filename from path
          const filename = op.path.split('/').pop() || op.path;
          
          // Determine status color and icon
          let statusColor = '';
          let StatusIcon = FiLoader;
          
          if (op.status === 'creating' || op.status === 'updating' || op.status === 'deleting') {
            statusColor = isDark ? 'text-blue-400' : 'text-blue-500';
            StatusIcon = FiLoader;
          } else if (op.status === 'created' || op.status === 'updated' || op.status === 'deleted') {
            statusColor = isDark ? 'text-green-400' : 'text-green-500';
            StatusIcon = FiCheck;
          } else if (op.status === 'error') {
            statusColor = isDark ? 'text-red-400' : 'text-red-500';
          }
          
          return (
            <div 
              key={`${op.path}-${op.status}-${index}`}
              className={`flex items-center py-1.5 px-2 text-sm rounded ${
                isDark ? 'bg-gray-750' : 'bg-gray-50'
              }`}
            >
              {/* File/Folder Icon */}
              {op.type === 'folder' ? (
                <FiFolder className={`mr-2 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
              ) : (
                <FiFile className={`mr-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              )}
              
              {/* File/Folder Name */}
              <span className="flex-1 truncate">
                {filename}
              </span>
              
              {/* Status */}
              <div className={`flex items-center ${statusColor}`}>
                <span className="text-xs mr-1.5">
                  {op.status.charAt(0).toUpperCase() + op.status.slice(1)}
                </span>
                
                {op.status === 'creating' || op.status === 'updating' || op.status === 'deleting' ? (
                  <StatusIcon className="w-3.5 h-3.5 animate-spin" />
                ) : op.status === 'created' || op.status === 'updated' || op.status === 'deleted' ? (
                  <div className="flex items-center bg-green-100 dark:bg-green-900/30 p-0.5 rounded-full">
                    <FiCheck className="w-4 h-4" />
                  </div>
                ) : (
                  <StatusIcon className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileOperationNotification; 