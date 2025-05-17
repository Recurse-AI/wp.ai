import { useState, useEffect, useCallback } from 'react';
import { 
  extractProjectFilesFromResponse,
  addFileToStructure 
} from '../utils/fileUtils';

// Define the FileNode interface locally to match the one used in fileUtils
interface FileNode {
  type: "file" | "folder";
  content?: string;
  language?: string;
  children?: Record<string, FileNode>;
}

/**
 * Custom hook for extracting and managing project files from AI responses
 * @param initialFiles Optional initial file structure
 * @returns File extraction utilities and state
 */
export const useFileExtractor = (initialFiles?: Record<string, FileNode>) => {
  const [files, setFiles] = useState<Record<string, FileNode>>(initialFiles || {});
  const [lastProcessedResponse, setLastProcessedResponse] = useState<string>('');

  /**
   * Process a new response and extract files
   * @param response The AI response text to process
   * @param replaceExisting Whether to replace existing files or merge with them
   * @returns The updated file structure
   */
  const processResponse = useCallback((response: string, replaceExisting = false) => {
    // Skip if this exact response was already processed
    if (response === lastProcessedResponse) {
      return files;
    }
    
    setLastProcessedResponse(response);
    
    // Extract files from the response
    const extractedFiles = extractProjectFilesFromResponse(
      response, 
      replaceExisting ? undefined : files
    );
    
    setFiles(extractedFiles);
    return extractedFiles;
  }, [files, lastProcessedResponse]);

  /**
   * Process multiple responses in sequence
   * @param responses Array of response texts to process
   * @param replaceExisting Whether to replace existing files or merge with them
   * @returns The updated file structure
   */
  const processMultipleResponses = useCallback((
    responses: string[],
    replaceExisting = false
  ) => {
    // Start with either existing files or empty object
    let currentFiles = replaceExisting ? {} : { ...files };
    
    // Process each response in sequence
    responses.forEach(response => {
      if (response && response !== lastProcessedResponse) {
        currentFiles = extractProjectFilesFromResponse(response, currentFiles);
      }
    });
    
    // Only update state if we actually processed something
    if (responses.length > 0) {
      setLastProcessedResponse(responses[responses.length - 1]);
      setFiles(currentFiles);
    }
    
    return currentFiles;
  }, [files, lastProcessedResponse]);

  /**
   * Add or update a specific file
   * @param filePath Path of the file to add/update
   * @param content Content of the file
   * @param language Optional language of the file
   * @returns The updated file structure
   */
  const updateFile = useCallback((
    filePath: string,
    content: string,
    language?: string
  ) => {
    const updatedFiles = { ...files };
    
    // Add or update the file
    addFileToStructure(updatedFiles, filePath, content, language);
    
    setFiles(updatedFiles);
    return updatedFiles;
  }, [files]);

  /**
   * Delete a file or directory
   * @param filePath Path of the file/directory to delete
   * @returns The updated file structure
   */
  const deleteFile = useCallback((filePath: string) => {
    const updatedFiles = { ...files };
    
    // Split the path into parts
    const pathParts = filePath.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      return files;
    }
    
    // If it's a root-level item, delete directly
    if (pathParts.length === 1) {
      const [rootName] = pathParts;
      if (updatedFiles[rootName]) {
        delete updatedFiles[rootName];
        setFiles(updatedFiles);
      }
      return updatedFiles;
    }
    
    // For nested paths, navigate to the parent
    let current = updatedFiles;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part] || !current[part].children) {
        // Path doesn't exist or isn't a directory
        return files;
      }
      current = current[part].children!;
    }
    
    // Delete the item from its parent
    const itemName = pathParts[pathParts.length - 1];
    if (current[itemName]) {
      delete current[itemName];
      setFiles(updatedFiles);
    }
    
    return updatedFiles;
  }, [files]);

  /**
   * Clear all files
   */
  const clearFiles = useCallback(() => {
    setFiles({});
    setLastProcessedResponse('');
  }, []);

  return {
    files,
    processResponse,
    processMultipleResponses,
    updateFile,
    deleteFile,
    clearFiles
  };
};

export default useFileExtractor; 