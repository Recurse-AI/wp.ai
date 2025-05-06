import { FC, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ProjectFiles from './ProjectFiles';
import { useAgentState } from '../../hooks/useAgentState';
import { useAgentAPI } from '../../hooks/useAgentAPI';
import { 
  extractFilesFromMessage, 
  saveFilesToLocalStorage, 
  loadFilesFromLocalStorage,
  processAttachedFolders
} from '../../utils/fileUtils';

interface FileNode {
  id?: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileNode[];
}

// Interface for files from API/AgentPreview
interface ApiFileStructure {
  [key: string]: {
    type: 'file' | 'folder';
    content?: string;
    children?: {
      [key: string]: any;
    };
  };
}

// Debug function to log file structure
const logFileStructure = (files: FileNode[], prefix = '') => {
  console.log('--- DEBUG: File Structure ---');
  const printStructure = (nodes: FileNode[], indent = '') => {
    nodes.forEach(node => {
      console.log(`${indent}${node.type === 'directory' ? '📁' : '📄'} ${node.path}`);
      if (node.type === 'directory' && node.children && node.children.length > 0) {
        printStructure(node.children, indent + '  ');
      }
    });
  };
  printStructure(files);
  console.log('---------------------------');
};

const WordPressWorkspace: FC = () => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  
  // Use the hooks with proper imported names
  const { sessionState, selectFile } = useAgentState();
  
  // Rename these local functions to avoid conflicts
  const getAgentState = () => {
    return {
      isConnected: true,
      messages: [] as any[]
    };
  };
  
  const getAgentAPI = () => {
    return {
      executeCommand: async () => {}
    };
  };
  
  // Use the renamed local functions 
  const { isConnected, messages } = getAgentState();

  useEffect(() => {
    // Extract files from messages
    if (messages && messages.length > 0) {
      console.log('Processing messages for file extraction:', messages.length);
      const extractedFiles = extractFilesFromMessages(messages);
      console.log('Extracted files count:', extractedFiles.length);
      
      if (extractedFiles.length > 0) {
        const organizedFiles = organizeFiles(extractedFiles);
        console.log('Organized files count:', organizedFiles.length);
        logFileStructure(organizedFiles);
        setFiles(organizedFiles);
      }
    }
  }, [messages]);

  // Check if window/global API contains files to use
  useEffect(() => {
    try {
      // Check if we can access window.currentApiFiles (assuming it might be set by another component)
      // @ts-ignore - TS will complain about accessing window.currentApiFiles
      const apiFiles = window.currentApiFiles;
      if (apiFiles) {
        console.log('Found API files in window object:', apiFiles);
        const convertedFiles = convertApiFilesToFileNodes(apiFiles);
        if (convertedFiles.length > 0) {
          const organizedFiles = organizeFiles(convertedFiles);
          console.log('Setting files from API data:', organizedFiles.length);
          setFiles(organizedFiles);
        }
      }
    } catch (error) {
      console.error('Error accessing API files:', error);
    }
  }, []);

  // Convert API file structure to our FileNode format
  const convertApiFilesToFileNodes = (apiFiles: ApiFileStructure): FileNode[] => {
    console.log('Converting API files to FileNode format:', apiFiles);
    const result: FileNode[] = [];
    
    const processObject = (obj: any, parentPath = ''): FileNode[] => {
      const nodes: FileNode[] = [];
      
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          const path = parentPath ? `${parentPath}/${key}` : key;
          // Type cast to ensure we can access properties safely
          const fileObj = value as { type: string; content?: string; children?: any };
          const isDirectory = fileObj.type === 'folder';
          
          console.log(`Processing ${isDirectory ? 'directory' : 'file'}: ${path}`);
          
          const node: FileNode = {
            name: key,
            path,
            type: isDirectory ? 'directory' : 'file',
            content: isDirectory ? undefined : (fileObj.content || '// No content')
          };
          
          if (isDirectory && fileObj.children) {
            // Process children recursively
            const childNodes = processObject(fileObj.children, path);
            if (childNodes.length > 0) {
              node.children = childNodes;
            }
          }
          
          nodes.push(node);
        }
      }
      
      return nodes;
    };
    
    return processObject(apiFiles);
  };

  // Check for JSON structure in message content
  const extractJSONFileStructure = (content: string): FileNode[] => {
    console.log('Checking for JSON file structure...');
    // Try to find JSON structure - look for patterns like {" or {"simple- which likely start a JSON object
    const jsonMatch = content.match(/\{\s*"[^"]+"\s*:\s*\{[\s\S]*?\}\s*\}/g);
    
    if (jsonMatch) {
      console.log('Found potential JSON structure');
      try {
        // Try parsing the matched JSON
        const parsedStructure = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed JSON structure:', parsedStructure);
        
        // Convert the JSON structure to our FileNode format
        return convertApiFilesToFileNodes(parsedStructure);
      } catch (e) {
        console.error('Error parsing JSON structure:', e);
      }
    }
    
    return [];
  };

  // Extract files from agent messages
  const extractFilesFromMessages = (messages: any[]): FileNode[] => {
    let extractedFiles: FileNode[] = [];
    
    messages.forEach(message => {
      if (message.role === 'assistant' && message.content) {
        console.log('Processing message content, length:', message.content.length);
        
        // First try to extract JSON structure if present
        const jsonFiles = extractJSONFileStructure(message.content);
        if (jsonFiles.length > 0) {
          console.log('Found JSON file structure, adding', jsonFiles.length, 'files');
          extractedFiles = [...extractedFiles, ...jsonFiles];
          return; // Skip further processing if we found a JSON structure
        }
        
        // Check for a plugin structure section
        const pluginStructureMatch = message.content.match(/Plugin Structure\s*\n([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
        
        if (pluginStructureMatch) {
          console.log('Found plugin structure section');
          const structureLines = pluginStructureMatch[1].trim().split('\n');
          console.log('Structure lines:', structureLines.length);
          
          // Find the root folder name from the structure
          let rootFolder = '';
          
          // First line typically contains the root folder name
          if (structureLines.length > 0) {
            // Extract root folder from the first line (might end with /)
            const firstLine = structureLines[0].trim();
            if (firstLine.endsWith('/')) {
              rootFolder = firstLine.slice(0, -1);
            } else {
              const parts = firstLine.split('/');
              if (parts.length > 0) {
                rootFolder = parts[0].trim();
              }
            }
            console.log('Detected root folder:', rootFolder);
          }
          
          // If no root folder found, don't create any structure
          if (!rootFolder) {
            console.log('No root folder found, skipping structure extraction');
          } else {
            // Create root directory
            if (!extractedFiles.find(file => file.path === rootFolder && file.type === 'directory')) {
              extractedFiles.push({
                name: rootFolder,
                path: rootFolder,
                type: 'directory'
              });
              console.log('Created root directory:', rootFolder);
            }
            
            // Process each line in the structure
            for (let i = 0; i < structureLines.length; i++) {
              const line = structureLines[i];
              
              // Clean the line of tree characters
              const cleanLine = line.replace(/[│├└─\s]/g, '').trim();
              if (!cleanLine || cleanLine === rootFolder + '/') continue;
              
              // Check if this is a file or directory
              const isDirectory = cleanLine.endsWith('/');
              
              // Normalize path to ensure consistent formatting
              let path = cleanLine;
              if (isDirectory) {
                path = cleanLine.slice(0, -1); // Remove trailing slash
              }
              
              // Make sure path is relative to root folder
              if (!path.startsWith(rootFolder)) {
                if (path.startsWith('/')) {
                  path = rootFolder + path;
                } else {
                  path = rootFolder + '/' + path;
                }
              }
              
              // Get name from path
              const pathParts = path.split('/').filter(Boolean);
              const name = pathParts[pathParts.length - 1];
              
              // Skip if already exists
              if (extractedFiles.find(file => file.path === path)) {
                continue;
              }
              
              // Create parent directories if needed
              if (pathParts.length > 1) {
                let parentPath = pathParts[0];
                
                for (let j = 1; j < pathParts.length - 1; j++) {
                  const parentName = pathParts[j];
                  parentPath += '/' + parentName;
                  
                  // Create parent directory if it doesn't exist
                  if (!extractedFiles.find(file => file.path === parentPath && file.type === 'directory')) {
                    extractedFiles.push({
                      name: parentName,
                      path: parentPath,
                      type: 'directory'
                    });
                    console.log('Created parent directory:', parentPath);
                  }
                }
              }
              
              // Add the file or directory
              extractedFiles.push({
                name: name,
                path: path,
                type: isDirectory ? 'directory' : 'file',
                content: isDirectory ? undefined : ''
              });
              console.log(`Added ${isDirectory ? 'directory' : 'file'}:`, path);
            }
          }
        }
        
        // Extract file contents from code blocks with headings
        
        // Pattern for code blocks with headings like "Main Plugin File (filename.php)"
        const fileHeadingPattern = /\b((?:Main Plugin File|Form Handler Class|Email Sender Class|Admin Settings Class|Contact Form Template|Frontend JavaScript|CSS Styles|[A-Za-z\s-]+)\s*\(([^)]+)\))\s*\n```([a-z]*)\s*([\s\S]*?)```/g;
        let fileHeadingMatch;
        
        while ((fileHeadingMatch = fileHeadingPattern.exec(message.content)) !== null) {
          const heading = fileHeadingMatch[1];
          const fileName = fileHeadingMatch[2].trim();
          const language = fileHeadingMatch[3];
          const content = fileHeadingMatch[4].trim();
          console.log('Found file heading match:', heading, fileName);
          
          // Find the root folder from existing dirs
          const rootFolder = extractedFiles.find(file => 
            file.type === 'directory' && !file.path.includes('/')
          )?.path || '';
          
          // If no root folder, skip this file
          if (!rootFolder) {
            console.log('No root folder found for file, skipping:', fileName);
            continue;
          }
          
          // Determine full path
          let fullPath = fileName;
          if (!fileName.includes('/')) {
            fullPath = rootFolder + '/' + fileName;
          } else if (!fileName.startsWith(rootFolder)) {
            fullPath = rootFolder + '/' + fileName;
          }
          console.log('Full file path:', fullPath);
          
          // Create parent directories if needed
          const fileParts = fullPath.split('/');
          if (fileParts.length > 1) {
            let parentPath = fileParts[0];
            
            // Ensure the root directory exists
            if (!extractedFiles.find(file => file.path === parentPath && file.type === 'directory')) {
              extractedFiles.push({
                name: parentPath,
                path: parentPath,
                type: 'directory'
              });
              console.log('Created root directory for file:', parentPath);
            }
            
            // Create other parent directories
            for (let i = 1; i < fileParts.length - 1; i++) {
              const parentName = fileParts[i];
              parentPath += '/' + parentName;
              
              // Check if parent directory already exists
              if (!extractedFiles.find(file => file.path === parentPath && file.type === 'directory')) {
                extractedFiles.push({
                  name: parentName,
                  path: parentPath,
                  type: 'directory'
                });
                console.log('Created parent directory for file:', parentPath);
              }
            }
          }
          
          // Add or update file
          const existingFileIndex = extractedFiles.findIndex(file => 
            file.type === 'file' && file.path === fullPath
          );
          
          if (existingFileIndex !== -1) {
            extractedFiles[existingFileIndex].content = content;
            console.log('Updated existing file content:', fullPath);
          } else {
            const name = fileParts[fileParts.length - 1] || fileName;
            extractedFiles.push({
              id: uuidv4(),
              name,
              path: fullPath,
              type: 'file',
              content
            });
            console.log('Added new file with content:', fullPath);
          }
        }
        
        // Pattern for direct filename followed by code blocks
        const fileNamePattern = /\n([a-zA-Z0-9_\-./]+\.(php|js|css|txt|pot|html))\s*\n```([a-z]*)\s*([\s\S]*?)```/g;
        let fileNameMatch;
        
        while ((fileNameMatch = fileNamePattern.exec(message.content)) !== null) {
          const fileName = fileNameMatch[1].trim();
          const extension = fileNameMatch[2];
          const language = fileNameMatch[3];
          const content = fileNameMatch[4].trim();
          
          if (!fileName || !content) continue;
          
          // Find the root folder from existing dirs
          const rootFolder = extractedFiles.find(file => 
            file.type === 'directory' && !file.path.includes('/')
          )?.path || '';
          
          // If no root folder found, skip this file
          if (!rootFolder) {
            console.log('No root folder found for file, skipping:', fileName);
            continue;
          }
          
          // Process the file with the found root folder
          addFileToStructure(extractedFiles, fileName, content, rootFolder);
        }
        
        // Process code blocks with filename comments
        const codeBlockRegex = /```(\w+)?\s*([^`]+)```/g;
        let match;
        
        while ((match = codeBlockRegex.exec(message.content)) !== null) {
          const language = match[1] || 'text';
          const content = match[2].trim();
          
          // Extract filename from comments
          const filenameRegex = /(?:\/\/|#|\/\*)\s*filename:\s*([^\s\n]+)/i;
          const filenameMatch = content.match(filenameRegex);
          
          if (filenameMatch && filenameMatch[1]) {
            const fileName = filenameMatch[1];
            
            // Find the root folder from existing dirs
            const rootFolder = extractedFiles.find(file => 
              file.type === 'directory' && !file.path.includes('/')
            )?.path || '';
            
            // If no root folder found, skip this file
            if (!rootFolder) continue;
            
            // Process the file with the found root folder
            addFileToStructure(extractedFiles, fileName, content, rootFolder);
          }
        }
        
        // Process file artifacts in special format
        const fileArtifactRegex = /<(?:file|FILE)\s+path="([^"]+)">\s*([\s\S]+?)\s*<\/(?:file|FILE)>/g;
        while ((match = fileArtifactRegex.exec(message.content)) !== null) {
          const fileName = match[1];
          const content = match[2].trim();
          
          // Find the root folder from existing dirs
          const rootFolder = extractedFiles.find(file => 
            file.type === 'directory' && !file.path.includes('/')
          )?.path || '';
          
          // If no root folder found, skip this file
          if (!rootFolder) continue;
          
          // Process the file with the found root folder
          addFileToStructure(extractedFiles, fileName, content, rootFolder);
        }
        
        // Add UUID to each file node when extracting
        extractedFiles = extractedFiles.map(file => ({
          ...file,
          id: file.id || uuidv4()
        }));
      }
    });
    
    return extractedFiles;
  };
  
  // Helper function to add a file to the structure
  const addFileToStructure = (
    extractedFiles: FileNode[], 
    fileName: string, 
    content: string, 
    rootFolder: string
  ): void => {
    // Determine full path
    let fullPath = fileName;
    if (!fileName.includes('/')) {
      fullPath = rootFolder + '/' + fileName;
    } else if (!fileName.startsWith(rootFolder)) {
      fullPath = rootFolder + '/' + fileName;
    }
    
    // Create parent directories if needed
    const fileParts = fullPath.split('/');
    if (fileParts.length > 1) {
      let parentPath = fileParts[0];
      
      // Ensure the root directory exists
      if (!extractedFiles.find(file => file.path === parentPath && file.type === 'directory')) {
        extractedFiles.push({
          name: parentPath,
          path: parentPath,
          type: 'directory'
        });
      }
      
      // Create other parent directories
      for (let i = 1; i < fileParts.length - 1; i++) {
        const parentName = fileParts[i];
        parentPath += '/' + parentName;
        
        // Check if parent directory already exists
        if (!extractedFiles.find(file => file.path === parentPath && file.type === 'directory')) {
          extractedFiles.push({
            name: parentName,
            path: parentPath,
            type: 'directory'
          });
        }
      }
    }
    
    // Add or update file
    const existingFileIndex = extractedFiles.findIndex(file => 
      file.type === 'file' && file.path === fullPath
    );
    
    if (existingFileIndex !== -1) {
      extractedFiles[existingFileIndex].content = content;
    } else {
      const name = fileParts[fileParts.length - 1] || fileName;
      extractedFiles.push({
        id: uuidv4(),
        name,
        path: fullPath,
        type: 'file',
        content
      });
    }
  };

  // Organize files into a tree structure
  const organizeFiles = (files: FileNode[]): FileNode[] => {
    console.log('Organizing files into tree structure...');
    // First, sort the files to ensure directories come before files
    // This helps with the tree organization
    const sortedFiles = [...files].sort((a, b) => {
      // Directories come first
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      
      // Then sort by path depth (shorter paths first)
      const aDepth = a.path.split('/').length;
      const bDepth = b.path.split('/').length;
      if (aDepth !== bDepth) return aDepth - bDepth;
      
      // Finally sort alphabetically
      return a.path.localeCompare(b.path);
    });
    
    // Create a map of path to node for faster lookup
    const nodeMap: Record<string, FileNode> = {};
    
    // Initialize with root directories
    const rootNodes: FileNode[] = [];
    
    sortedFiles.forEach(file => {
      // Initialize children array if it's a directory
      if (file.type === 'directory' && !file.children) {
        file.children = [];
      }
      
      // Add to nodeMap for lookup
      nodeMap[file.path] = file;
      
      // If it's a root-level node, add to rootNodes
      if (!file.path.includes('/') || file.path.split('/').length === 1) {
        rootNodes.push(file);
      } else {
        // Find parent directory
        const pathParts = file.path.split('/');
        const parentPath = pathParts.slice(0, -1).join('/');
        
        // Get parent from nodeMap
        const parent = nodeMap[parentPath];
        
        // Add to parent's children if parent exists
        if (parent && parent.type === 'directory') {
          if (!parent.children) {
            parent.children = [];
          }
          
          // Only add if not already in children
          if (!parent.children.find(child => child.path === file.path)) {
            parent.children.push(file);
          }
        } else {
          // If parent doesn't exist, add to root
          rootNodes.push(file);
        }
      }
    });
    
    // Sort children of each directory
    const sortChildren = (node: FileNode) => {
      if (node.type === 'directory' && node.children && node.children.length > 0) {
        // Sort children: directories first, then alphabetically
        node.children.sort((a, b) => {
          if (a.type === 'directory' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        });
        
        // Recursively sort children's children
        node.children.forEach(sortChildren);
      }
    };
    
    // Sort root nodes and their children
    rootNodes.sort((a, b) => {
      if (a.type === 'directory' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
    
    rootNodes.forEach(sortChildren);
    
    return rootNodes;
  };

  const handleFileSelect = (file: FileNode) => {
    setSelectedFile(file);
    setFileContent(file.content || '');
    
    // Only attempt to call selectFile if we have a valid file id (UUID)
    if (file.id && !file.id.includes('/') && sessionState?.id) {
      selectFile(file.id).catch((err: Error) => {
        console.error('Error selecting file:', err);
      });
    } else {
      console.warn('File has no valid ID or it contains path separators:', file.path);
    }
  };

  const handleFileEdit = async (file: FileNode) => {
    // Implement file editing logic
    console.log('Edit file:', file);
  };

  const handleFileDelete = async (file: FileNode) => {
    // Implement file deletion logic
    console.log('Delete file:', file);
  };

  // Expose file structure to window for debugging
  useEffect(() => {
    try {
      // @ts-ignore
      window.wpWorkspaceFiles = files;
      console.log('Exposed file structure to window.wpWorkspaceFiles for debugging');
    } catch (e) {
      console.error('Failed to expose files to window:', e);
    }
  }, [files]);

  return (
    <div className="wordpress-workspace flex flex-col h-full">
      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/4 border-r overflow-y-auto">
          <ProjectFiles
            files={files}
            onFileSelect={handleFileSelect}
            onFileEdit={handleFileEdit}
            onFileDelete={handleFileDelete}
          />
        </div>
        <div className="w-3/4 overflow-auto p-4">
          {selectedFile ? (
            <div>
              <div className="mb-2 font-medium text-lg">{selectedFile.name}</div>
              <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded border overflow-x-auto">
                <code>{fileContent}</code>
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a file to view its content
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordPressWorkspace; 