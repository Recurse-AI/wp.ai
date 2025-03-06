"use client";
import React, { useState, useEffect } from 'react';
import { 
  FiFolder, 
  FiFolderPlus, 
  FiFile, 
  FiFilePlus, 
  FiTrash, 
  FiChevronRight, 
  FiChevronDown 
} from 'react-icons/fi';
import { useTheme } from '@/context/ThemeProvider';
import { CodeFile } from '@/lib/services/agentService';
import toast from 'react-hot-toast';

interface FileNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  children?: FileNode[];
  content?: string;
  language?: string;
}

interface FileExplorerProps {
  files: CodeFile[];
  onFileSelect: (file: CodeFile) => void;
  onFileCreate?: (path: string, name: string, isFolder: boolean) => void;
  onFileDelete?: (id: string) => void;
  selectedFileId?: string;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  selectedFileId
}) => {
  const { theme } = useTheme();
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileIsFolder, setNewFileIsFolder] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  // Convert flat list of files to a tree structure
  useEffect(() => {
    const buildFileTree = (fileList: CodeFile[]) => {
      const tree: FileNode[] = [];
      const map: Record<string, FileNode> = {};
      
      // First, create a map of all folders
      fileList.forEach(file => {
        const pathParts = file.path.split('/').filter(p => p);
        let currentPath = '';
        
        // Create folders for each path segment
        pathParts.forEach(part => {
          const parentPath = currentPath;
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          
          if (!map[currentPath]) {
            const folderNode: FileNode = {
              id: `folder-${currentPath}`,
              name: part,
              path: currentPath,
              isFolder: true,
              children: []
            };
            
            map[currentPath] = folderNode;
            
            if (parentPath) {
              // Add to parent folder
              if (map[parentPath]) {
                map[parentPath].children = map[parentPath].children || [];
                map[parentPath].children?.push(folderNode);
              }
            } else {
              // Add to root
              tree.push(folderNode);
            }
          }
        });
      });
      
      // Then add files to their appropriate folders
      fileList.forEach(file => {
        const { id, name, path, content, language } = file;
        const parentPath = path.split('/').slice(0, -1).join('/');
        
        const fileNode: FileNode = {
          id,
          name,
          path,
          isFolder: false,
          content,
          language
        };
        
        if (parentPath && map[parentPath]) {
          map[parentPath].children = map[parentPath].children || [];
          map[parentPath].children?.push(fileNode);
        } else {
          // Add to root if no parent folder
          tree.push(fileNode);
        }
      });
      
      return tree;
    };
    
    setFileTree(buildFileTree(files));
  }, [files]);
  
  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const newState = new Set(prev);
      if (newState.has(path)) {
        newState.delete(path);
      } else {
        newState.add(path);
      }
      return newState;
    });
  };
  
  // Handle file selection
  const handleFileSelect = (file: FileNode) => {
    if (!file.isFolder) {
      const selectedFile = files.find(f => f.id === file.id);
      if (selectedFile) {
        onFileSelect(selectedFile);
      }
    } else {
      toggleFolder(file.path);
    }
  };
  
  // Handle new file/folder creation UI
  const handleCreateNew = (path: string, isFolder: boolean) => {
    setIsCreatingFile(true);
    setNewFileIsFolder(isFolder);
    setCurrentPath(path);
    setNewFileName('');
  };
  
  // Handle file/folder creation submission
  const handleCreateSubmit = () => {
    if (newFileName.trim() === '') {
      toast.error('Please enter a name');
      return;
    }
    
    if (onFileCreate) {
      onFileCreate(currentPath, newFileName, newFileIsFolder);
    }
    
    setIsCreatingFile(false);
    setNewFileName('');
  };
  
  // Render file/folder tree recursively
  const renderFileTree = (nodes: FileNode[] = [], depth = 0) => {
    return nodes.sort((a, b) => {
      // Sort folders first, then files
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    }).map(node => {
      const isExpanded = expandedFolders.has(node.path);
      const isSelected = !node.isFolder && node.id === selectedFileId;
      
      return (
        <div key={node.id} style={{ marginLeft: `${depth * 12}px` }}>
          <div 
            className={`flex items-center p-1.5 rounded-md cursor-pointer ${
              isSelected 
                ? theme === 'dark' ? 'bg-blue-600' : 'bg-blue-100' 
                : theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            onClick={() => handleFileSelect(node)}
          >
            {node.isFolder ? (
              <>
                <span className="mr-1.5">
                  {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                </span>
                <FiFolder className={`mr-1.5 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-500'}`} />
              </>
            ) : (
              <FiFile className="ml-3.5 mr-1.5 text-gray-400" />
            )}
            <span className="truncate">{node.name}</span>
          </div>
          
          {node.isFolder && isExpanded && (
            <div className="mt-1">
              {renderFileTree(node.children, depth + 1)}
              
              <div 
                className={`flex items-center p-1 ml-6 rounded-md text-xs cursor-pointer ${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                }`}
                onClick={() => handleCreateNew(node.path, false)}
              >
                <FiFilePlus className="mr-1.5" />
                <span>New File</span>
              </div>
              
              <div 
                className={`flex items-center p-1 ml-6 rounded-md text-xs cursor-pointer ${
                  theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                }`}
                onClick={() => handleCreateNew(node.path, true)}
              >
                <FiFolderPlus className="mr-1.5" />
                <span>New Folder</span>
              </div>
            </div>
          )}
        </div>
      );
    });
  };
  
  return (
    <div className={`h-full overflow-auto p-2 ${
      theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800'
    }`}>
      {/* Header with New File/Folder buttons */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">Files</h3>
        <div className="flex space-x-1">
          <button 
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            onClick={() => handleCreateNew('', false)} 
            title="New File"
          >
            <FiFilePlus />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
            onClick={() => handleCreateNew('', true)}
            title="New Folder"
          >
            <FiFolderPlus />
          </button>
        </div>
      </div>
      
      {/* File Tree */}
      <div className="mt-2">
        {renderFileTree(fileTree)}
      </div>
      
      {/* New File/Folder Input Dialog */}
      {isCreatingFile && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50`}>
          <div className={`p-6 rounded-lg shadow-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } w-96`}>
            <h3 className="text-lg font-medium mb-4">
              {newFileIsFolder ? 'Create New Folder' : 'Create New File'}
            </h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder={newFileIsFolder ? 'Folder name' : 'File name'}
              className={`w-full p-2 mb-4 rounded border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-800'
              }`}
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsCreatingFile(false)}
                className={`px-4 py-2 rounded ${
                  theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSubmit}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileExplorer; 