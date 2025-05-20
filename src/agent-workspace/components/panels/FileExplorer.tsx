"use client";

import React, { useState, useEffect } from 'react';
import { FileNode } from '../../types';
import { FiFolder, FiFile, FiFolderPlus, FiFilePlus, FiChevronDown, FiChevronRight, FiTrash2, FiLoader, FiCheck } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeProvider';

interface FileExplorerProps {
  files: Record<string, FileNode>;
  selectedFileId?: string;
  onFileSelect: (file: FileNode) => void;
  onFilesChange?: (files: Record<string, FileNode>) => void;
  processingFilePath?: string | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFileId,
  onFileSelect,
  onFilesChange,
  processingFilePath = null
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
  });

  // Toggle folder expand/collapse
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Create new file or folder
  const handleCreate = (path: string, isFolder: boolean) => {
    const name = prompt(`Enter new ${isFolder ? 'folder' : 'file'} name:`);
    if (!name || name.trim() === '') return;

    // Create new files object with the new file/folder
    const newFiles = { ...files };
    
    // Navigate to the target folder
    const pathParts = path.split('/');
    let current = newFiles;
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (!current[part]) return; // Path doesn't exist
      
      if (i === pathParts.length - 1) {
        // We've reached the target folder
        if (current[part].type !== 'folder') return; // Not a folder
        
        if (!current[part].children) {
          current[part].children = {};
        }
        
        // Determine file extension and language
        let language = 'text';
        if (!isFolder) {
          const ext = name.split('.').pop()?.toLowerCase();
          if (ext === 'php') language = 'php';
          else if (ext === 'js') language = 'javascript';
          else if (ext === 'css') language = 'css';
          else if (ext === 'html') language = 'html';
        }
        
        // Add the new item
        current[part].children![name] = isFolder
          ? { type: 'folder', children: {} }
          : { 
              type: 'file', 
              content: isFolder ? undefined : '',
              language
            };
        
        // Auto-expand the folder
        if (isFolder) {
          setExpandedFolders(prev => ({
            ...prev,
            [`${path}/${name}`]: true
          }));
        }
        
        // Notify parent component
        if (onFilesChange) {
          onFilesChange(newFiles);
        }
        
        break;
      }
      
      current = current[part].children || {};
    }
  };

  // Delete file or folder
  const handleDelete = (path: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    // Create new files object without the deleted file/folder
    const newFiles = { ...files };
    
    // Navigate to the parent folder
    const pathParts = path.split('/');
    let current = newFiles;
    let parentPath = '';
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      
      // Build parent path for logging
      parentPath = parentPath ? `${parentPath}/${part}` : part;
      
      if (!current[part]) {
        console.error(`Path doesn't exist: ${parentPath}`);
        return; // Path doesn't exist
      }
      
      if (current[part].type !== 'folder') {
        console.error(`${parentPath} is not a folder`);
        return; // Not a folder
      }
      
      // Move to the next level in the file tree
      if (!current[part].children) {
        console.error(`${parentPath} has no children`);
        return; // No children
      }
      
      current = current[part].children!;
    }
    
    // Delete the item
    const itemName = pathParts[pathParts.length - 1];
    if (current[itemName]) {
      delete current[itemName];
      
      // Notify parent component
      if (onFilesChange) {
        console.log(`Deleted ${path}`);
        onFilesChange(newFiles);
      }
    } else {
      console.error(`Item not found: ${path}`);
    }
  };

  // Convert file to AgentFile
  const fileNodeToAgentFile = (name: string, node: FileNode, path: string): FileNode & { id: string, name: string, path: string, lastModified: Date } => {
    const fullPath = path ? `${path}/${name}` : name;
    return {
      id: `file-${fullPath}`,
      name,
      path: fullPath,
      content: node.content || '',
      language: node.language || 'text',
      lastModified: new Date(),
      type: node.type,
      children: node.children
    };
  };

  // Check if a file is currently being processed
  const isFileProcessing = (path: string): boolean => {
    if (!processingFilePath) return false;
    
    // Either exact match or being processed is a parent path
    return processingFilePath === path || processingFilePath.startsWith(`${path}/`);
  };

  // Auto-expand folders when files are added or updated
  useEffect(() => {
    // Check if we have files to process
    if (Object.keys(files).length > 0) {
      // Track new files and paths that need to be expanded
      const pathsToExpand: Record<string, boolean> = {};
      
      // Function to recursively check for recently added or modified files
      const findRecentFiles = (
        currentFiles: Record<string, FileNode>,
        currentPath = ''
      ) => {
        Object.entries(currentFiles).forEach(([name, node]) => {
          const fullPath = currentPath ? `${currentPath}/${name}` : name;
          
          // Auto-expand if this file is being processed
          if (isFileProcessing(fullPath)) {
            // Get all parent paths and mark them for expansion
            const pathParts = fullPath.split('/');
            let pathSoFar = '';
            
            for (let i = 0; i < pathParts.length - 1; i++) {
              pathSoFar = pathSoFar ? `${pathSoFar}/${pathParts[i]}` : pathParts[i];
              pathsToExpand[pathSoFar] = true;
            }
          }
          
          // If it's a folder, recursively process its children
          if (node.type === 'folder' && node.children) {
            findRecentFiles(node.children, fullPath);
          }
        });
      };
      
      // Process the files
      findRecentFiles(files);
      
      // Expand the identified paths
      if (Object.keys(pathsToExpand).length > 0) {
        setExpandedFolders(prev => ({
          ...prev,
          ...pathsToExpand
        }));
        
        console.log('Auto-expanded folders for processing files:', Object.keys(pathsToExpand));
      }
    }
  }, [files, processingFilePath, isFileProcessing]);

  // Listen for file updates from other components
  useEffect(() => {
    const handleFilesUpdated = (event: CustomEvent) => {
      const { workspaceId, filesCount } = event.detail;
      
      console.log(`FileExplorer: Detected ${filesCount} files updated`);
      
      // Update parent component
      if (onFilesChange) {
        // Attempt to load files from localStorage
        try {
          const key = `workspace_files_${workspaceId}`;
          const stored = localStorage.getItem(key);
          if (stored) {
            const updatedFiles = JSON.parse(stored);
            onFilesChange(updatedFiles);
          }
        } catch (error) {
          console.error('Error loading updated files:', error);
        }
      }
    };

    // New handler for PROJECT_STRUCTURE events from AI responses
    const handleProjectStructure = (event: CustomEvent) => {
      if (!event.detail || !event.detail.structure) return;
      
      const structure = event.detail.structure;
      console.log('Received project structure:', structure);
      
      // Build file structure from the project structure data
      if (onFilesChange) {
        try {
          // Create a new files object based on existing files
          const newFiles = { ...files };
          
          // Parse the structure into a hierarchical format
          const parsedStructure = parseProjectStructure(structure);
          
          // Merge with existing files
          const mergedFiles = { ...newFiles, ...parsedStructure };
          
          // Update files
          onFilesChange(mergedFiles);
          
          // Auto-expand root folders
          const rootFolders = Object.keys(parsedStructure);
          const newExpandedFolders = { ...expandedFolders };
          rootFolders.forEach(folder => {
            newExpandedFolders[folder] = true;
          });
          setExpandedFolders(newExpandedFolders);
          
          console.log('Created file structure from project structure:', parsedStructure);
        } catch (error) {
          console.error('Error processing project structure:', error);
        }
      }
    };
    
    // Function to parse project structure into file nodes
    const parseProjectStructure = (structure: string): Record<string, FileNode> => {
      const result: Record<string, FileNode> = {};
      
      // Split by lines and parse
      const lines = structure.split('\n').filter(line => line.trim());
      
      // Track the current path and hierarchy
      const pathStack: { path: string; node: Record<string, FileNode> }[] = [{ path: '', node: result }];
      
      lines.forEach(line => {
        // Skip empty lines and PROJECT_STRUCTURE tags
        if (!line.trim() || line.includes('<PROJECT_STRUCTURE>') || line.includes('</PROJECT_STRUCTURE>')) {
          return;
        }
        
        // Clean the line and determine depth
        const trimmedLine = line.trim();
        const indent = line.search(/\S|$/);
        const depth = Math.floor(indent / 2);
        
        // Pop stack until we're at the right depth
        while (pathStack.length > depth + 1) {
          pathStack.pop();
        }
        
        // Get the parent node
        const parent = pathStack[pathStack.length - 1];
        
        // Parse the line to get the name and type
        let name = trimmedLine;
        let isDir = false;
        
        // Handle different formats that might appear in the structure
        if (name.includes('📂')) {
          name = name.replace('📂', '').trim();
          isDir = true;
        } else if (name.includes('📄')) {
          name = name.replace('📄', '').trim();
          isDir = false;
        } else if (name.endsWith('/')) {
          name = name.slice(0, -1);
          isDir = true;
        } else if (name.match(/^[├└]─\s/)) {
          name = name.replace(/^[├└]─\s/, '');
          isDir = name.endsWith('/');
          if (isDir) name = name.slice(0, -1);
        }
        
        // Create the node
        if (isDir) {
          parent.node[name] = {
            type: 'folder',
            children: {}
          };
          
          // Add to stack for children
          pathStack.push({
            path: parent.path ? `${parent.path}/${name}` : name,
            node: parent.node[name].children as Record<string, FileNode>
          });
        } else {
          // Detect file language based on extension
          const ext = name.split('.').pop()?.toLowerCase();
          let language = 'text';
          
          if (ext === 'php') language = 'php';
          else if (ext === 'js') language = 'javascript';
          else if (ext === 'css') language = 'css';
          else if (ext === 'html') language = 'html';
          
          parent.node[name] = {
            type: 'file',
            content: '',
            language
          };
        }
      });
      
      return result;
    };

    // Add event listeners
    window.addEventListener('workspace_files_updated', handleFilesUpdated as EventListener);
    window.addEventListener('project_structure_received', handleProjectStructure as EventListener);
    
    // Clean up
    return () => {
      window.removeEventListener('workspace_files_updated', handleFilesUpdated as EventListener);
      window.removeEventListener('project_structure_received', handleProjectStructure as EventListener);
    };
  }, [files, onFilesChange, expandedFolders]);

  // Count total files and folders
  const countFilesAndFolders = (fileObj: Record<string, FileNode>): { files: number, folders: number } => {
    let files = 0;
    let folders = 0;
    
    const countRecursive = (obj: Record<string, FileNode>) => {
      Object.values(obj).forEach(node => {
        if (node.type === 'folder') {
          folders++;
          if (node.children) {
            countRecursive(node.children);
          }
        } else {
          files++;
        }
      });
    };
    
    countRecursive(fileObj);
    return { files, folders };
  };

  // Sort files by type to keep a consistent order
  const sortFilesByType = (files: Record<string, FileNode>): [string, FileNode][] => {
    return Object.entries(files)
      .sort((a, b) => {
        // Folders first, then files
        const isAFolder = a[1].type === 'folder';
        const isBFolder = b[1].type === 'folder';
        
        // If both are the same type, sort alphabetically
        if (isAFolder === isBFolder) {
          return a[0].localeCompare(b[0]);
        }
        
        // Otherwise, folders first
        return isAFolder ? -1 : 1;
      });
  };

  // Render file or folder item
  const renderItem = (name: string, node: FileNode, path = '', level = 0) => {
    const fullPath = path ? `${path}/${name}` : name;
    const isExpanded = expandedFolders[fullPath];
    const isProcessing = isFileProcessing(fullPath);
    
    if (node.type === 'folder') {
      // Auto-expand folders containing processing files
      if (isProcessing && !isExpanded) {
        setExpandedFolders(prev => ({
          ...prev,
          [fullPath]: true
        }));
      }
      
      return (
        <div key={fullPath} className="select-none">
          <div 
            className={`flex items-center py-1 px-2 hover:bg-opacity-20 ${
              isProcessing 
                ? isDark ? 'bg-blue-900/30' : 'bg-blue-50'
                : ''
            } ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } rounded cursor-pointer group`}
            onClick={() => toggleFolder(fullPath)}
          >
            {/* Folder structure indicator */}
            <span className="mr-1 text-gray-500">
              {isExpanded 
                ? (isDark ? '╭─' : '┌─') 
                : level === 0 
                  ? (isDark ? '├─' : '├─') 
                  : (isDark ? '├─' : '├─')}
            </span>
            
            {/* Folder icon */}
            <FiFolder className="mr-2 text-green-500 flex-shrink-0" />
            
            {/* Folder name */}
            <span className="flex-1 truncate text-sm font-medium">{name}</span>
            
            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex items-center mr-2 animate-pulse">
                <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex items-center opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreate(fullPath, true);
                }}
                className={`p-1 rounded hover:bg-opacity-20 ${
                  isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                }`}
                title="New folder"
              >
                <FiFolderPlus className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreate(fullPath, false);
                }}
                className={`p-1 rounded hover:bg-opacity-20 ${
                  isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                }`}
                title="New file"
              >
                <FiFilePlus className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              </button>
              
              {/* Delete folder button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(fullPath, name);
                }}
                className="p-1 rounded hover:bg-opacity-20 hover:bg-red-900/40"
                title="Delete folder"
              >
                <FiTrash2 className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-500 hover:text-red-500'}`} />
              </button>
            </div>
          </div>
          
          {/* Subfolder content with better tree structure */}
          {isExpanded && node.children && (
            <div className="ml-4">
              {sortFilesByType(node.children)
                .filter(([childName]) => childName !== "<PROJECT_STRUCTURE>" && childName !== "PROJECT_STRUCTURE")
                .map(([childName, childNode], index, array) => {
                  const isLast = index === array.length - 1;
                  return (
                    <div key={`${fullPath}/${childName}`} className="relative">
                      {!isLast && (
                        <div 
                          className={`absolute left-0 top-0 h-full border-l ${
                            isDark ? 'border-gray-700' : 'border-gray-600'
                          }`} 
                          style={{ left: '7px' }}
                        ></div>
                      )}
                      {renderItem(childName, childNode, fullPath, level + 1)}
                    </div>
                  );
                })
              }
            </div>
          )}
        </div>
      );
    } else {
      // File item
      const isSelected = selectedFileId === `file-${fullPath}`;
      const isProcessing = isFileProcessing(fullPath);
      
      // Get file extension for icon color
      const fileExt = name.split('.').pop()?.toLowerCase() || '';
      const fileIconColor = 
        fileExt === 'php' ? 'text-purple-400' : 
        fileExt === 'js' ? 'text-yellow-400' : 
        fileExt === 'css' ? 'text-pink-400' : 
        fileExt === 'html' ? 'text-orange-400' : 
        fileExt === 'json' ? 'text-green-400' : 
        isDark ? 'text-gray-400' : 'text-gray-500';
      
      // Get emoji based on file extension
      const fileEmoji = 
        fileExt === 'php' ? '🐘 ' : 
        fileExt === 'js' ? '⚡ ' : 
        fileExt === 'css' ? '🎨 ' : 
        fileExt === 'html' ? '🌐 ' : 
        fileExt === 'json' ? '📋 ' : 
        '📄 ';
      
      // Generate the appropriate tree connection symbol based on level and position
      const treeSymbol = level === 0 
        ? (isDark ? '├─' : '├─') 
        : isSelected 
          ? (isDark ? '├─' : '├─')
          : (isDark ? '├─' : '├─');
      
      // File presentation styled like in the user examples
      return (
        <div className="file-presentation z-10">
          <div className={`px-2 ${
            isDark ? 'text-gray-400' : 'text-green-600'
          }`}>
            <div className="text-xs">
              {isDark ? '┌─' : '┌─'} File: {fullPath}
            </div>
          </div>
          
          <div 
            key={fullPath}
            className={`flex items-center py-1 px-2 text-sm hover:bg-opacity-20 ${
              isSelected 
                ? isDark ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-700'
                : isProcessing
                  ? isDark ? 'bg-emerald-900/30 text-emerald-200' : 'bg-emerald-50 text-emerald-700'
                  : ''
            } ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } rounded cursor-pointer group z-10`}
            onClick={() => onFileSelect(fileNodeToAgentFile(name, node, path))}
          >
            {/* File structure with tree symbol */}
            <span className="mr-1 text-gray-500">
              {treeSymbol}
            </span>
            
            {/* File name with emoji and clearer formatting */}
            <span className={`flex-1 truncate ${fileIconColor}`}>
              {fileEmoji}{name}
            </span>
            
            {/* Processing indicator */}
            {isProcessing && (
              <div className="flex items-center mr-2">
                {/* Show check mark instead of spinner */}
                <FiCheck className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
              </div>
            )}
            
            {/* Delete file button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(fullPath, name);
              }}
              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-opacity-20 hover:bg-red-900/40"
              title="Delete file"
            >
              <FiTrash2 className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400 hover:text-red-500' : 'text-gray-500 hover:text-red-500'}`} />
            </button>
          </div>
          
          <div className={`px-2 ${
            isDark ? 'text-gray-400' : 'text-green-600'
          }`}>
            <div className="text-xs">
              {isDark ? '└─' : '└─'} Available in File Explorer
            </div>
          </div>
        </div>
      );
    }
  };

  // The isDark variable should be computed when component renders, not inside JSX
  const containerBgClass = isDark ? 'bg-gray-900 text-gray-200' : 'bg-black text-green-400';
  const headerBgClass = isDark ? 'bg-gray-800' : 'bg-gray-900';
  
  return (
    <div className={`jsx-3993940779 h-full p-2 font-mono overflow-auto ${containerBgClass}`}>
      <div className={`jsx-3993940779 flex items-center justify-between mb-2 px-2 py-1.5 rounded ${headerBgClass}`}>
        <div className="jsx-3993940779 flex items-center">
          <FiFolder className="mr-2 text-green-500 flex-shrink-0" />
          <h3 className="jsx-3993940779 font-medium text-sm">
            {/* Change title based on content */}
            {Object.keys(files).length > 0 && Object.keys(files).some(key => key.includes('wordpress') || key.includes('contact-form')) 
              ? 'WordPress Files' 
              : 'Project Files'}
          </h3>
          
          {/* File count */}
          {Object.keys(files).length > 0 && (
            <span className={`jsx-3993940779 ml-2 text-xs px-1.5 py-0.5 rounded-full ${
              isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-800 text-green-300'
            }`}>
              {countFilesAndFolders(files).folders} folders, {countFilesAndFolders(files).files} files
            </span>
          )}
        </div>
        
        {/* Processing status indicator in header if any file is being processed */}
        {processingFilePath && (
          <div className="jsx-3993940779 flex items-center text-xs text-emerald-500">
            <div className="jsx-3993940779 flex items-center bg-emerald-100 dark:bg-emerald-900/30 p-1 rounded-full mr-1">
              <FiCheck className="w-3 h-3" />
            </div>
            <span className="jsx-3993940779 truncate max-w-[150px]">
              {processingFilePath.split('/').pop() || processingFilePath} available
            </span>
          </div>
        )}
      </div>
      
      <div className="jsx-3993940779 space-y-0.5 overflow-auto file-explorer-scrollbar" style={{ maxHeight: 'calc(100% - 42px)' }}>
        {Object.keys(files).length > 0 && (
          <div className="jsx-3993940779 px-1 py-0.5 border-b border-gray-700 mb-1">
            <span className="jsx-3993940779 text-xs opacity-70">
              {isDark ? '╭─' : '┌─'} File Tree
            </span>
          </div>
        )}
        
        <div className="jsx-3993940779 progress-container">
          {sortFilesByType(files)
            // Filter out any unwanted "<PROJECT_STRUCTURE>" folders
            .filter(([name]) => name !== "<PROJECT_STRUCTURE>" && name !== "PROJECT_STRUCTURE")
            .map(([name, node], index, array) => (
              <div key={name} className="jsx-3993940779 relative">
                {index < array.length - 1 && (
                  <div 
                    className="jsx-3993940779 absolute left-4 top-8 bottom-0 w-0.5 progress-line"
                    style={{ backgroundColor: isDark ? 'rgba(75, 85, 99, 0.7)' : 'rgba(20, 83, 45, 0.5)' }}
                  ></div>
                )}
                {renderItem(name, node, '', 0)}
              </div>
            ))
          }
        </div>
        
        {Object.keys(files).length > 0 && (
          <div className="jsx-3993940779 px-1 py-0.5 mt-1">
            <span className="jsx-3993940779 text-xs opacity-70">
              {isDark ? '╰─' : '└─'} End of File Tree
            </span>
          </div>
        )}
        
        {Object.keys(files).length === 0 && (
          <div className="jsx-3993940779 flex flex-col items-center justify-center py-8 px-4 text-center text-sm" style={{ color: isDark ? 'rgba(156, 163, 175, 1)' : 'rgba(34, 197, 94, 0.7)' }}>
            <FiFolder className="w-10 h-10 mb-2 opacity-30" />
            <p className="jsx-3993940779">No files yet</p>
            <p className="jsx-3993940779 text-xs mt-1">Files will appear here when created</p>
          </div>
        )}
      </div>
      
      {/* Terminal-style cursor blink effect */}
      <style jsx global>{`
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .file-explorer-cursor::after {
          content: '';
          width: 6px;
          height: 14px;
          background: ${isDark ? '#6ee7b7' : '#4ade80'};
          display: inline-block;
          animation: cursor-blink 1.2s infinite;
          margin-left: 4px;
          vertical-align: middle;
        }

        .file-explorer-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        .file-explorer-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .file-explorer-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,128,0,0.3)'};
          border-radius: 4px;
        }
        
        .file-explorer-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,128,0,0.5)'};
        }

        /* File presentation container animation */
        @keyframes file-appear {
          from { opacity: 0.7; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .file-presentation {
          position: relative;
          animation: file-appear 0.3s ease-out;
          margin-bottom: 0.5rem;
        }

        .progress-line {
          z-index: 0;
        }
        
        /* Enhanced tree line styling */
        .tree-line-vertical {
          position: absolute;
          left: 7px;
          top: 12px;
          bottom: 0;
          width: 1px;
          background-color: ${isDark ? 'rgba(75, 85, 99, 0.7)' : 'rgba(20, 83, 45, 0.5)'};
          z-index: 0;
        }
        
        .tree-line-horizontal {
          position: absolute;
          left: 8px;
          top: 12px;
          width: 8px;
          height: 1px;
          background-color: ${isDark ? 'rgba(75, 85, 99, 0.7)' : 'rgba(20, 83, 45, 0.5)'};
          z-index: 0;
        }
        
        /* Enhanced folder tree styling for terminal look */
        .folder-tree-container {
          position: relative;
        }
        
        .folder-tree-connection {
          position: absolute;
          left: 7px;
          width: 0.5px;
          background-color: ${isDark ? 'rgba(75, 85, 99, 0.7)' : 'rgba(20, 83, 45, 0.5)'};
          z-index: 0;
        }
        
        /* Improved file styling */
        .file-item {
          display: flex;
          align-items: center;
          padding: 2px 0;
        }
        
        .file-tree-connector {
          color: ${isDark ? 'rgba(107, 114, 128, 0.8)' : 'rgba(20, 83, 45, 0.6)'};
          font-family: monospace;
        }

        /* File icon colors based on extension */
        .php-file { color: #a78bfa; }
        .js-file { color: #fbbf24; }
        .css-file { color: #ec4899; }
        .html-file { color: #f97316; }
        .json-file { color: #34d399; }
      `}</style>
    </div>
  );
};

export default FileExplorer; 