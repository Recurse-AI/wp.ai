"use client";

import React, { useState } from 'react';
import { AgentFile, FileNode } from '../../types';
import { FiFolder, FiFile, FiFolderPlus, FiFilePlus, FiChevronDown, FiChevronRight, FiMoreVertical } from 'react-icons/fi';
import { useTheme } from '@/context/ThemeProvider';

interface FileExplorerProps {
  files: Record<string, FileNode>;
  selectedFileId?: string;
  onFileSelect: (file: AgentFile) => void;
  onFilesChange?: (files: Record<string, FileNode>) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFileId,
  onFileSelect,
  onFilesChange
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'my-plugin': true // Default expanded root folder
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
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!current[part]) return; // Path doesn't exist
      current = current[part].children || {};
    }
    
    // Delete the item
    const itemName = pathParts[pathParts.length - 1];
    if (current[itemName]) {
      delete current[itemName];
      
      // Notify parent component
      if (onFilesChange) {
        onFilesChange(newFiles);
      }
    }
  };

  // Convert file to AgentFile
  const fileNodeToAgentFile = (name: string, node: FileNode, path: string): AgentFile => {
    const fullPath = path ? `${path}/${name}` : name;
    return {
      id: `file-${fullPath}`,
      name,
      path: fullPath,
      content: node.content || '',
      language: node.language || 'text',
      lastModified: new Date()
    };
  };

  // Render file or folder item
  const renderItem = (name: string, node: FileNode, path = '') => {
    const fullPath = path ? `${path}/${name}` : name;
    const isExpanded = expandedFolders[fullPath];
    
    if (node.type === 'folder') {
      return (
        <div key={fullPath} className="select-none">
          <div 
            className={`flex items-center py-1 px-2 hover:bg-opacity-10 ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } rounded cursor-pointer group`}
            onClick={() => toggleFolder(fullPath)}
          >
            {/* Expand/collapse icon */}
            {isExpanded 
              ? <FiChevronDown className="mr-1 text-gray-500 flex-shrink-0" />
              : <FiChevronRight className="mr-1 text-gray-500 flex-shrink-0" />
            }
            
            {/* Folder icon */}
            <FiFolder className={`mr-2 ${isDark ? 'text-blue-400' : 'text-blue-500'} flex-shrink-0`} />
            
            {/* Folder name */}
            <span className="flex-1 truncate text-sm">{name}</span>
            
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
            </div>
          </div>
          
          {/* Subfolder content */}
          {isExpanded && node.children && (
            <div className={`pl-4 border-l ml-2 ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              {Object.entries(node.children).map(([childName, childNode]) => 
                renderItem(childName, childNode, fullPath)
              )}
            </div>
          )}
        </div>
      );
    } else {
      // File item
      const isSelected = selectedFileId === `file-${fullPath}`;
      
      return (
        <div 
          key={fullPath}
          className={`flex items-center py-1 px-2 text-sm hover:bg-opacity-10 ${
            isSelected 
              ? isDark ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-700'
              : ''
          } ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          } rounded cursor-pointer group`}
          onClick={() => onFileSelect(fileNodeToAgentFile(name, node, path))}
        >
          {/* File icon */}
          <FiFile className={`mr-3 ml-5 ${
            isSelected 
              ? isDark ? 'text-blue-400' : 'text-blue-500'
              : isDark ? 'text-gray-400' : 'text-gray-500'
          } flex-shrink-0`} />
          
          {/* File name */}
          <span className="flex-1 truncate">{name}</span>
          
          {/* Actions */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(fullPath, name);
            }}
            className={`p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-opacity-20 ${
              isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
            title="Delete file"
          >
            <FiMoreVertical className={`w-3.5 h-3.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>
        </div>
      );
    }
  };

  return (
    <div className={`h-full p-2 overflow-auto ${
      isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-700'
    }`}>
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="font-medium text-sm">Project Files</h3>
      </div>
      
      <div className="space-y-0.5">
        {Object.entries(files).map(([name, node]) => 
          renderItem(name, node)
        )}
      </div>
    </div>
  );
};

export default FileExplorer; 