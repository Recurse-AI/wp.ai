import React, { useEffect, useState } from 'react';
import { useFileOperations } from '../../context/FileOperationsContext';
import { FileNode } from '../../types';

interface FileOperationsTrackerProps {
  files: Record<string, FileNode>;
}

const FileOperationsTracker: React.FC<FileOperationsTrackerProps> = ({ files }) => {
  const { addOperation } = useFileOperations();
  const [lastProcessedFiles, setLastProcessedFiles] = useState<Record<string, FileNode>>({});
  
  // Track file operations when files change
  useEffect(() => {
    if (!files || Object.keys(files).length === 0) return;
    
    // Check if there are new or updated files we need to track
    if (lastProcessedFiles && Object.keys(lastProcessedFiles).length > 0) {
      // Compare with last processed files to find new ones
      const newFiles = findNewFiles(files, lastProcessedFiles);
      const updatedFiles = findUpdatedFiles(files, lastProcessedFiles);
      const deletedFiles = findDeletedFiles(files, lastProcessedFiles);
      
      // Add operations for new files
      newFiles.forEach(file => {
        addOperation({
          path: file.path,
          type: file.fileType === 'folder' ? 'folder' : 'file',
          status: 'created'
        });
      });
      
      // Add operations for updated files
      updatedFiles.forEach(file => {
        addOperation({
          path: file.path,
          type: file.fileType === 'folder' ? 'folder' : 'file',
          status: 'updated'
        });
      });
      
      // Add operations for deleted files
      deletedFiles.forEach(file => {
        addOperation({
          path: file.path,
          type: file.fileType === 'folder' ? 'folder' : 'file',
          status: 'deleted'
        });
      });
    }
    
    // Update last processed files
    setLastProcessedFiles(files);
  }, [files, addOperation, lastProcessedFiles]);
  
  // Function to find new files
  const findNewFiles = (currentFiles: Record<string, FileNode>, previousFiles: Record<string, FileNode>) => {
    const newFiles: { path: string; fileType: string }[] = [];
    
    // Check for new files at the root level
    Object.entries(currentFiles).forEach(([path, node]) => {
      if (!previousFiles[path]) {
        newFiles.push({
          path,
          fileType: node.type
        });
      }
    });
    
    return newFiles;
  };
  
  // Function to find updated files (content changed)
  const findUpdatedFiles = (currentFiles: Record<string, FileNode>, previousFiles: Record<string, FileNode>) => {
    const updatedFiles: { path: string; fileType: string }[] = [];
    
    // Check for updated files
    Object.entries(currentFiles).forEach(([path, node]) => {
      const prevNode = previousFiles[path];
      
      if (prevNode && 
          node.type === 'file' && 
          prevNode.type === 'file' && 
          node.content !== prevNode.content) {
        updatedFiles.push({
          path,
          fileType: 'file'
        });
      }
    });
    
    return updatedFiles;
  };
  
  // Function to find deleted files
  const findDeletedFiles = (currentFiles: Record<string, FileNode>, previousFiles: Record<string, FileNode>) => {
    const deletedFiles: { path: string; fileType: string }[] = [];
    
    // Check for deleted files
    Object.entries(previousFiles).forEach(([path, node]) => {
      if (!currentFiles[path]) {
        deletedFiles.push({
          path,
          fileType: node.type
        });
      }
    });
    
    return deletedFiles;
  };
  
  // This component doesn't render anything, it just tracks file operations
  return null;
};

export default FileOperationsTracker; 