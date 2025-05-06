import { FileNode } from '../types';

/**
 * Extract files from the message content based on WordPress system prompt format
 */
export const extractFilesFromMessage = (
  content: string,
  existingFiles?: Record<string, FileNode>
): Record<string, FileNode> => {
  const result: Record<string, FileNode> = existingFiles ? { ...existingFiles } : {};
  const rootFolders: string[] = [];
  
  // Extract project structure first
  const projectStructureRegex = /<PROJECT_STRUCTURE>([\s\S]*?)<\/PROJECT_STRUCTURE>/g;
  const structureMatches = [...content.matchAll(projectStructureRegex)];
  
  if (structureMatches.length > 0) {
    for (const match of structureMatches) {
      const structureContent = match[1].trim();
      
      // Skip if the structure content contains the tag itself (prevents recursive tag processing)
      if (structureContent.includes('<PROJECT_STRUCTURE>') || 
          structureContent === 'PROJECT_STRUCTURE' || 
          structureContent.includes('created<PROJECT_STRUCTURE>')) {
        continue;
      }
      
      const structureLines = structureContent.split('\n');
      
      // First line typically contains the root folder name
      if (structureLines.length > 0) {
        const firstLine = structureLines[0].trim();
        let rootFolder = '';
        
        if (firstLine.endsWith('/')) {
          rootFolder = firstLine.slice(0, -1);
        } else {
          const parts = firstLine.split('/');
          if (parts.length > 0) {
            rootFolder = parts[0].trim();
          }
        }
        
        // Skip invalid root folder names or <PROJECT_STRUCTURE> folders
        if (!rootFolder || 
            rootFolder.includes('<') || 
            rootFolder.includes('>') || 
            rootFolder === 'PROJECT_STRUCTURE' || 
            rootFolder === '<PROJECT_STRUCTURE>') {
          continue;
        }
        
        if (rootFolder && !rootFolders.includes(rootFolder)) {
          rootFolders.push(rootFolder);
          
          // Create root directory
          if (!result[rootFolder]) {
            result[rootFolder] = {
              type: "folder",
              children: {}
            };
          }
        }
        
        // Process each line in the structure (skip the first line as we already processed it)
        for (let i = 1; i < structureLines.length; i++) {
          const line = structureLines[i].trim();
          if (!line) continue;
          
          // Clean the line of tree characters
          const cleanLine = line.replace(/[│├└─\s]/g, '').trim();
          if (!cleanLine || cleanLine === `${rootFolder}/`) continue;
          
          // Skip invalid path names
          if (cleanLine.includes('<') || cleanLine.includes('>')) {
            continue;
          }
          
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
          
          // Add the file or directory to the structure
          addPathToStructure(
            result, 
            path, 
            isDirectory ? "folder" : "file", 
            isDirectory ? undefined : ''
          );
        }
      }
    }
  }
  
  // Extract file contents using the <FILE> tags format - modified to be case-insensitive
  const fileRegex = /<(?:FILE|file)\s+path="([^"]+)">\s*```(\w+)?\s*([\s\S]*?)```\s*<\/(?:FILE|file)>/g;
  const fileMatches = [...content.matchAll(fileRegex)];
  
  if (fileMatches.length > 0) {
    for (const match of fileMatches) {
      const filePath = match[1].trim();
      const language = match[2] || '';
      const fileContent = match[3].trim();
      
      // If no root folder has been created yet, create one from the file path
      if (rootFolders.length === 0) {
        const firstSlash = filePath.indexOf('/');
        if (firstSlash > 0) {
          const rootFolder = filePath.substring(0, firstSlash);
          rootFolders.push(rootFolder);
          
          // Create root directory
          if (!result[rootFolder]) {
            result[rootFolder] = {
              type: "folder",
              children: {}
            };
          }
        }
      }
      
      // Add file to structure
      addFileToStructure(result, filePath, fileContent, language);
    }
  }
  
  return result;
};

/**
 * Add a path (file or folder) to the file structure
 */
export const addPathToStructure = (
  files: Record<string, FileNode>,
  path: string,
  type: "file" | "folder",
  content?: string,
  language?: string
): void => {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return;
  
  // Handle root level
  if (parts.length === 1) {
    const name = parts[0];
    if (!files[name]) {
      files[name] = {
        type,
        content,
        language,
        children: type === "folder" ? {} : undefined
      };
    }
    return;
  }
  
  // Handle nested paths
  let current = files;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    
    // Create parent folder if it doesn't exist
    if (!current[part]) {
      current[part] = {
        type: "folder",
        children: {}
      };
    } else if (current[part].type !== "folder") {
      // Convert to folder if it was a file (shouldn't happen in normal cases)
      current[part] = {
        type: "folder",
        children: {}
      };
    }
    
    // Move to the next level
    if (!current[part].children) {
      current[part].children = {};
    }
    current = current[part].children!;
  }
  
  // Add the final file or folder
  const fileName = parts[parts.length - 1];
  current[fileName] = {
    type,
    content,
    language,
    children: type === "folder" ? {} : undefined
  };
};

/**
 * Add a file to the structure with proper parent directories
 */
export const addFileToStructure = (
  files: Record<string, FileNode>,
  filePath: string,
  content: string,
  language?: string
): void => {
  // Check if this is a root-level file
  const isRootFile = !filePath.includes('/');
  const fileName = filePath.split('/').pop() || filePath;
  
  // If this is a root file, check if it already exists in any subfolder
  if (isRootFile) {
    let fileExistsInSubfolder = false;
    
    // Check all root folders for this file
    for (const [folderName, folder] of Object.entries(files)) {
      if (folder.type === 'folder' && folder.children) {
        // Check if this folder has a file with the same name
        if (folder.children[fileName]) {
          fileExistsInSubfolder = true;
          break;
        }
        
        // Check nested folders recursively
        const checkNestedFolders = (children: Record<string, FileNode>) => {
          for (const [childName, child] of Object.entries(children)) {
            if (child.type === 'folder' && child.children) {
              if (child.children[fileName]) {
                fileExistsInSubfolder = true;
                return;
              }
              checkNestedFolders(child.children);
            }
          }
        };
        
        checkNestedFolders(folder.children);
      }
    }
    
    // Skip adding this file if it already exists in a subfolder
    if (fileExistsInSubfolder) {
      console.log(`Skipping duplicate root file: ${fileName} (already exists in a subfolder)`);
      return;
    }
  }
  
  // Add the file normally
  addPathToStructure(files, filePath, "file", content, language);
};

/**
 * Convert flat structure to TreeView compatible format
 */
export const flattenFileStructure = (
  files: Record<string, FileNode>,
  parentPath: string = ''
): Array<{name: string, path: string, type: string, children?: any}> => {
  const result: Array<{name: string, path: string, type: string, children?: any}> = [];
  
  Object.entries(files).forEach(([name, node]) => {
    const path = parentPath ? `${parentPath}/${name}` : name;
    const item = {
      name,
      path,
      type: node.type === "folder" ? "directory" : "file",
      content: node.content,
      children: node.children && Object.keys(node.children).length > 0
        ? flattenFileStructure(node.children, path)
        : undefined
    };
    
    result.push(item);
  });
  
  // Sort: directories first, then alphabetically
  result.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
  
  return result;
};

/**
 * Extract file paths from a project structure string
 */
export const extractPathsFromStructure = (structure: string): string[] => {
  const paths: string[] = [];
  const lines = structure.split('\n');
  let rootFolder = '';
  
  // Find root folder from first line
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.endsWith('/')) {
      rootFolder = firstLine.slice(0, -1);
    } else {
      const parts = firstLine.split('/');
      if (parts.length > 0) {
        rootFolder = parts[0].trim();
      }
    }
    
    // Add root folder as a path
    if (rootFolder) {
      paths.push(rootFolder);
    }
  }
  
  // Process each line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Clean the line
    const cleanLine = line.replace(/[│├└─\s]/g, '').trim();
    if (!cleanLine || cleanLine === `${rootFolder}/`) continue;
    
    // Normalize path
    let path = cleanLine;
    if (path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    // Make sure path is properly prefixed
    if (!path.startsWith(rootFolder)) {
      if (path.startsWith('/')) {
        path = rootFolder + path;
      } else {
        path = rootFolder + '/' + path;
      }
    }
    
    paths.push(path);
  }
  
  return paths;
};

/**
 * Convert flat file paths to a nested structure
 */
export const pathsToFileStructure = (paths: string[]): Record<string, FileNode> => {
  const result: Record<string, FileNode> = {};
  
  paths.forEach(path => {
    const isDirectory = path.endsWith('/');
    const normalizedPath = isDirectory ? path.slice(0, -1) : path;
    
    addPathToStructure(
      result,
      normalizedPath,
      isDirectory ? "folder" : "file",
      isDirectory ? undefined : ''
    );
  });
  
  return result;
};

/**
 * Generate a file tree string representation
 */
export const generateFileTree = (
  files: Record<string, FileNode>, 
  level = 0,
  prefix = ''
): string => {
  let result = '';
  
  const entries = Object.entries(files);
  entries.sort((a, b) => {
    // Sort directories first
    if (a[1].type !== b[1].type) {
      return a[1].type === "folder" ? -1 : 1;
    }
    // Then alphabetically
    return a[0].localeCompare(b[0]);
  });
  
  entries.forEach(([name, node], index) => {
    const isLast = index === entries.length - 1;
    const linePrefix = level === 0 ? '' : prefix + (isLast ? '└─ ' : '├─ ');
    const childPrefix = prefix + (isLast ? '   ' : '│  ');
    
    result += `${linePrefix}${name}${node.type === "folder" ? '/' : ''}\n`;
    
    if (node.type === "folder" && node.children) {
      result += generateFileTree(node.children, level + 1, childPrefix);
    }
  });
  
  return result;
};

/**
 * Convert a message content to a file structure based on WordPress agent prompt format
 */
export const messageToFileStructure = (content: string): Record<string, FileNode> => {
  return extractFilesFromMessage(content);
};

/**
 * Save files to localStorage for a given workspace ID
 */
export const saveFilesToLocalStorage = (
  workspaceId: string, 
  files: Record<string, FileNode>
): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const key = `workspace-code`;
    localStorage.setItem(key, JSON.stringify(files));
    console.log(`Saved files to localStorage with key: ${key}`);
  } catch (error) {
    console.error('Error saving files to localStorage:', error);
  }
};

/**
 * Load files from localStorage for a given workspace ID
 */
export const loadFilesFromLocalStorage = (
  workspaceId: string
): Record<string, FileNode> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const key = `workspace-code`;
    const storedFiles = localStorage.getItem(key);
    
    if (storedFiles) {
      console.log(`Loaded files from localStorage with key: ${key}`);
      return JSON.parse(storedFiles);
    }
  } catch (error) {
    console.error('Error loading files from localStorage:', error);
  }
  
  return {};
};

/**
 * Extract a JSON structure from content string
 */
export const extractJSONStructureFromContent = (content: string): Record<string, FileNode> | null => {
  // Try to find JSON structure - look for patterns like {" or {"simple- which likely start a JSON object
  const jsonMatch = content.match(/\{\s*"[^"]+"\s*:\s*\{[\s\S]*?\}\s*\}/g);
  
  if (jsonMatch) {
    try {
      // Try parsing the matched JSON
      const parsedStructure = JSON.parse(jsonMatch[0]);
      
      // Validate structure as a FileNode structure
      for (const [key, value] of Object.entries(parsedStructure)) {
        const node = value as any;
        if (!node.type || (node.type !== 'file' && node.type !== 'folder')) {
          return null;
        }
      }
      
      return parsedStructure as Record<string, FileNode>;
    } catch (e) {
      console.error('Error parsing JSON structure:', e);
    }
  }
  
  return null;
};

/**
 * Extract text-based tree format from content
 */
export const extractTextTreeFormat = (content: string): Record<string, FileNode> | null => {
  const treeMatch = content.match(/```(?:tree|plaintext)?\s*([\s\S]*?)```/g);
  
  if (treeMatch) {
    try {
      const treeContent = treeMatch[0].replace(/```(?:tree|plaintext)?\s*|\s*```$/g, '');
      const lines = treeContent.split('\n').filter(line => line.trim());
      
      // Check if this is likely a file tree structure
      if (lines.length > 1 && (lines[0].includes('/') || /[├└]/.test(treeContent))) {
        const paths = extractPathsFromStructure(treeContent);
        return pathsToFileStructure(paths);
      }
    } catch (e) {
      console.error('Error parsing tree format:', e);
    }
  }
  
  return null;
};

/**
 * Extract formatted structure from chat content
 */
export const extractFormattedStructureFromChat = (content: string): Record<string, FileNode> => {
  // Try JSON structure first
  const jsonStructure = extractJSONStructureFromContent(content);
  if (jsonStructure) return jsonStructure;
  
  // Try project structure tags
  const tagStructure = extractFilesFromMessage(content);
  if (Object.keys(tagStructure).length > 0) return tagStructure;
  
  // Try text tree format
  const treeStructure = extractTextTreeFormat(content);
  if (treeStructure) return treeStructure;
  
  // Return empty structure if nothing found
  return {};
};

/**
 * Update a specific file in the file structure
 */
export const updateFileInStructure = (
  files: Record<string, FileNode>,
  filePath: string,
  content: string
): Record<string, FileNode> => {
  const updatedFiles = { ...files };
  addFileToStructure(updatedFiles, filePath, content);
  return updatedFiles;
};

/**
 * Process attached folders from a message into a file structure
 */
export const processAttachedFolders = (
  existingFiles: Record<string, FileNode>,
  folderPaths?: string[],
  folderContents?: Record<string, string[]>
): Record<string, FileNode> => {
  if (!folderPaths || !folderContents) {
    return existingFiles;
  }
  
  const result: Record<string, FileNode> = { ...existingFiles };
  
  folderPaths.forEach(folderPath => {
    const contents = folderContents[folderPath];
    if (!contents) return;
    
    // Extract the folder name from the path
    const pathParts = folderPath.split('/').filter(Boolean);
    if (pathParts.length === 0) return;
    
    const folderName = pathParts[pathParts.length - 1];
    
    // Create the folder
    if (!result[folderName]) {
      result[folderName] = {
        type: "folder",
        children: {}
      };
    }
    
    // Add all contents
    contents.forEach(item => {
      // Simple path cleaning
      const itemPath = item.replace(/^\.\//, '').replace(/^\//, '');
      
      // Skip if empty
      if (!itemPath) return;
      
      // Determine if it's a file or folder
      const isDirectory = itemPath.endsWith('/');
      const normalizedPath = isDirectory 
        ? itemPath.slice(0, -1) 
        : itemPath;
      
      // Add to structure
      addPathToStructure(
        result,
        `${folderName}/${normalizedPath}`,
        isDirectory ? "folder" : "file",
        isDirectory ? undefined : ''
      );
    });
  });
  
  return result;
};

/**
 * Extract WordPress plugin information from message content
 */
export const extractWordPressPlugin = (
  content: string,
  existingFiles?: Record<string, FileNode>
): Record<string, FileNode> => {
  // Default result structure
  const result: Record<string, FileNode> = existingFiles || {};
  
  try {
    // First try standard extraction methods
    const structureContent = extractFormattedStructureFromChat(content);
    
    // If we found structure, keep it
    if (Object.keys(structureContent).length > 0) {
      Object.assign(result, structureContent);
    }
    
    // Also look specifically for WordPress plugin file patterns
    const pluginStructureMatch = content.match(/Plugin Structure\s*\n([\s\S]*?)(?=\n\n|\n[A-Z]|$)/i);
    if (pluginStructureMatch) {
      const structureLines = pluginStructureMatch[1].trim().split('\n');
      let rootFolder = '';
      
      // First line typically contains the root folder name
      if (structureLines.length > 0) {
        const firstLine = structureLines[0].trim();
        if (firstLine.endsWith('/')) {
          rootFolder = firstLine.slice(0, -1);
        } else {
          const parts = firstLine.split('/');
          if (parts.length > 0) {
            rootFolder = parts[0].trim();
          }
        }
        
        // Create root directory if not exists
        if (rootFolder && !result[rootFolder]) {
          result[rootFolder] = {
            type: "folder",
            children: {}
          };
        }
        
        // Process structure lines to create folders and files
        for (let i = 1; i < structureLines.length; i++) {
          const line = structureLines[i].trim();
          if (!line) continue;
          
          const cleanLine = line.replace(/[│├└─\s]/g, '').trim();
          if (!cleanLine || cleanLine === `${rootFolder}/`) continue;
          
          const isDirectory = cleanLine.endsWith('/');
          let path = cleanLine;
          
          if (isDirectory) {
            path = cleanLine.slice(0, -1);
          }
          
          if (!path.startsWith(rootFolder)) {
            if (path.startsWith('/')) {
              path = rootFolder + path;
            } else {
              path = rootFolder + '/' + path;
            }
          }
          
          addPathToStructure(
            result,
            path,
            isDirectory ? "folder" : "file",
            isDirectory ? undefined : ''
          );
        }
      }
    }
    
    // Extract file content using both uppercase and lowercase file tags
    const fileRegex = /<(?:FILE|file)\s+path="([^"]+)">\s*```(\w+)?\s*([\s\S]*?)```\s*<\/(?:FILE|file)>/g;
    let fileMatch;
    
    while ((fileMatch = fileRegex.exec(content)) !== null) {
      const filePath = fileMatch[1].trim();
      const language = fileMatch[2] || '';
      const fileContent = fileMatch[3].trim();
      
      addFileToStructure(result, filePath, fileContent, language);
    }
  } catch (error) {
    console.error('Error extracting WordPress plugin:', error);
  }
  
  return result;
};

/**
 * Extract file tree from the content
 */
export const extractFileTreeFromContent = (
  content: string,
  existingFiles?: Record<string, FileNode>
): Record<string, FileNode> => {
  // Start with existing files if provided
  const result: Record<string, FileNode> = existingFiles || {};
  
  try {
    // Look for file tree blocks in Markdown code blocks
    const treeBlockPattern = /```(?:tree|plaintext|bash)?\s*([\s\S]*?)```/g;
    const matches = [...content.matchAll(treeBlockPattern)];
    
    if (matches.length > 0) {
      for (const match of matches) {
        const treeContent = match[1].trim();
        if (!treeContent) continue;
        
        // Check if this looks like a tree structure
        if (treeContent.includes('/') || /[├└─│]/.test(treeContent)) {
          const structure = parseDirectoryTree(treeContent);
          Object.assign(result, structure);
        }
      }
    }
  } catch (error) {
    console.error('Error extracting file tree from content:', error);
  }
  
  return result;
};

/**
 * Parse directory tree from a string representation
 */
export const parseDirectoryTree = (
  treeContent: string
): Record<string, FileNode> => {
  const result: Record<string, FileNode> = {};
  const lines = treeContent.split('\n').filter(line => line.trim());
  
  // Detect tree style (Unix-style with symbols or plain indentation)
  const isUnixStyle = /[├└─│]/.test(treeContent);
  
  let rootFolderName = '';
  let currentIndentLevel = 0;
  let lastPath: string[] = [];
  
  // Extract paths from the tree structure
  const paths: string[] = [];
  
  // Process first line (root folder)
  if (lines.length > 0) {
    const rootLine = lines[0].trim();
    
    // Remove any tree symbols and clean
    const cleanedRootLine = rootLine.replace(/[├└─│]/g, '').trim();
    
    // Extract root folder name
    rootFolderName = cleanedRootLine.endsWith('/')
      ? cleanedRootLine.slice(0, -1)
      : cleanedRootLine;
    
    if (rootFolderName) {
      paths.push(rootFolderName);
      lastPath = [rootFolderName];
    }
  }
  
  // Process remaining lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Determine the indent level and item name
    let indentLevel = 0;
    let itemName = line.trim();
    
    if (isUnixStyle) {
      // Unix-style tree with symbols
      const symbols = line.match(/[│├└─]/g);
      indentLevel = symbols ? symbols.length : 0;
      
      // Clean the line to get just the item name
      itemName = line.replace(/[│├└─\s]/g, '').trim();
    } else {
      // Space-based indentation
      const leadingSpaces = line.match(/^\s*/);
      indentLevel = leadingSpaces ? Math.floor(leadingSpaces[0].length / 2) : 0;
      itemName = line.trim();
    }
    
    // If we have a valid name and root folder
    if (itemName && rootFolderName) {
      // Update the path based on indent level
      if (indentLevel <= lastPath.length) {
        // Remove levels that are deeper than our current level
        lastPath = lastPath.slice(0, indentLevel);
      }
      
      // Add this item to the path
      lastPath.push(itemName);
      
      // Construct full path and add to paths list
      const isDirectory = itemName.endsWith('/');
      const normalizedName = isDirectory ? itemName.slice(0, -1) : itemName;
      
      // Update lastPath with the normalized name (without trailing slash)
      lastPath[lastPath.length - 1] = normalizedName;
      
      const fullPath = lastPath.join('/');
      paths.push(isDirectory ? `${fullPath}/` : fullPath);
      
      // If not a directory, we need to pop this item for the next iteration
      if (!isDirectory) {
        lastPath.pop();
      }
    }
  }
  
  // Convert paths to file structure
  paths.forEach(path => {
    const isDirectory = path.endsWith('/');
    const normalizedPath = isDirectory ? path.slice(0, -1) : path;
    
    addPathToStructure(
      result,
      normalizedPath,
      isDirectory ? "folder" : "file",
      undefined
    );
  });
  
  return result;
};

export default {
  extractFilesFromMessage,
  addFileToStructure,
  addPathToStructure,
  flattenFileStructure,
  extractPathsFromStructure,
  pathsToFileStructure,
  generateFileTree,
  messageToFileStructure,
  saveFilesToLocalStorage,
  loadFilesFromLocalStorage,
  extractJSONStructureFromContent,
  extractTextTreeFormat,
  extractFormattedStructureFromChat,
  processAttachedFolders,
  extractWordPressPlugin,
  extractFileTreeFromContent,
  parseDirectoryTree,
  updateFileInStructure
};
