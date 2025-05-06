import React, { useEffect, useState } from 'react';
import { useFileOperations } from '../../context/FileOperationsContext';

interface FileOperationsTrackerProps {
  files: Record<string, any>;
}

const FileOperationsTracker: React.FC<FileOperationsTrackerProps> = ({ files }) => {
  const { addOperation } = useFileOperations();
  const [lastProcessedFiles, setLastProcessedFiles] = useState<Record<string, any>>({});
  
  // Track file operations when files change
  useEffect(() => {
    if (!files || Object.keys(files).length === 0) return;
    
    // Check if there are new or updated files we need to track
    if (lastProcessedFiles && Object.keys(lastProcessedFiles).length > 0) {
      // Compare with last processed files to find new ones
      const newFiles = findNewFiles(files, lastProcessedFiles);
      
      // Add operations for new files
      newFiles.forEach(file => {
        addOperation({
          path: file.path,
          type: file.type === 'folder' ? 'folder' : 'file',
          status: 'created'
        });
      });
    }
    
    // Update last processed files
    setLastProcessedFiles(files);
  }, [files, addOperation]);
  
  // Function to find new files
  const findNewFiles = (currentFiles: Record<string, any>, previousFiles: Record<string, any>) => {
    const newFiles: { path: string; type: string }[] = [];
    
    // Helper function to recursively search for new files
    const searchNewFiles = (current: Record<string, any>, previous: Record<string, any>, basePath = '') => {
      Object.entries(current).forEach(([name, node]) => {
        const path = basePath ? `${basePath}/${name}` : name;
        
        // Check if this file/folder didn't exist before
        if (!previous[name]) {
          newFiles.push({
            path,
            type: node.type || (node.children ? 'folder' : 'file')
          });
        }
        
        // Recursively check children
        if (node.children && previous[name]?.children) {
          searchNewFiles(
            node.children, 
            previous[name].children, 
            path
          );
        }
      });
    };
    
    searchNewFiles(currentFiles, previousFiles);
    return newFiles;
  };
  
  // This component doesn't render anything, it just tracks file operations
  return null;
};

export default FileOperationsTracker; 