import { FileNode } from '../types';

/**
 * Function to recursively prepare files for JSZip
 * @param files Record of file nodes
 * @param currentPath Current path in the file tree
 * @returns Record of file paths and contents
 */
export const prepareFilesForZip = (files: Record<string, FileNode>, currentPath = '') => {
  const result: Record<string, string> = {};
  
  Object.entries(files).forEach(([name, node]) => {
    const filePath = currentPath ? `${currentPath}/${name}` : name;
    
    if (node.type === 'file') {
      result[filePath] = node.content || '';
    } else if (node.type === 'folder' && node.children) {
      // Recursively process nested files
      const childResults = prepareFilesForZip(node.children, filePath);
      Object.assign(result, childResults);
    }
  });
  
  return result;
};

/**
 * Creates and downloads a zip file from the workspace files
 * @param files The files to include in the zip
 * @param workspaceName Name to use for the zip file
 */
export const downloadSourceCode = async (
  files: Record<string, FileNode>,
  workspaceName: string
): Promise<boolean> => {
  try {
    // Dynamically import JSZip to avoid increasing the initial bundle size
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    
    // Get all files recursively
    const flattenedFiles = prepareFilesForZip(files);
    
    // Add files to zip
    Object.entries(flattenedFiles).forEach(([path, content]) => {
      zip.file(path, content);
    });
    
    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Create a download link
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(zipBlob);
    downloadLink.download = `${workspaceName.replace(/\s+/g, '-').toLowerCase()}.zip`;
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    return true;
  } catch (error) {
    console.error('Error downloading source code:', error);
    return false;
  }
}; 