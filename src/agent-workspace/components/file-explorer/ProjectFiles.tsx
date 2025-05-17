import { FC, useState, useEffect } from 'react';
import { FiFolder, FiFile, FiChevronDown, FiChevronRight, FiEdit, FiTrash2 } from 'react-icons/fi';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  children?: FileNode[];
}

interface ProjectFilesProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileEdit?: (file: FileNode) => void;
  onFileDelete?: (file: FileNode) => void;
}

const FileTreeNode: FC<{
  node: FileNode;
  level: number;
  onFileSelect: (file: FileNode) => void;
  onFileEdit?: (file: FileNode) => void;
  onFileDelete?: (file: FileNode) => void;
}> = ({ node, level, onFileSelect, onFileEdit, onFileDelete }) => {
  const [expanded, setExpanded] = useState(level < 1);
  const isDirectory = node.type === 'directory';
  
  const toggleExpand = () => {
    if (isDirectory) {
      setExpanded(!expanded);
    }
  };

  const handleFileSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDirectory) {
      onFileSelect(node);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFileEdit) {
      onFileEdit(node);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onFileDelete) {
      onFileDelete(node);
    }
  };

  return (
    <div className="file-tree-node">
      <div
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
          !isDirectory ? 'hover:text-blue-500' : ''
        }`}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
        onClick={isDirectory ? toggleExpand : handleFileSelect}
      >
        <div className="mr-1">
          {isDirectory ? (
            expanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />
          ) : null}
        </div>
        <div className="mr-2">
          {isDirectory ? <FiFolder className="text-yellow-500" /> : <FiFile className="text-gray-500" />}
        </div>
        <div className="flex-grow truncate">{node.name}</div>
        {!isDirectory && (
          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
            {onFileEdit && (
              <button
                className="p-1 text-gray-500 hover:text-blue-500"
                onClick={handleEdit}
                title="Edit file"
              >
                <FiEdit size={14} />
              </button>
            )}
            {onFileDelete && (
              <button
                className="p-1 text-gray-500 hover:text-red-500"
                onClick={handleDelete}
                title="Delete file"
              >
                <FiTrash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      {isDirectory && expanded && node.children && (
        <div className="file-tree-children">
          {node.children.map((child, index) => (
            <FileTreeNode
              key={child.path || `${child.name}-${index}`}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              onFileEdit={onFileEdit}
              onFileDelete={onFileDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ProjectFiles: FC<ProjectFilesProps> = ({ files, onFileSelect, onFileEdit, onFileDelete }) => {
  return (
    <div className="project-files border rounded-md overflow-hidden bg-white dark:bg-gray-900 shadow-sm">
      <div className="px-4 py-3 font-medium border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        Project Files
      </div>
      <div className="p-1">
        {files.length > 0 ? (
          files.map((node, index) => (
            <FileTreeNode
              key={node.path || `${node.name}-${index}`}
              node={node}
              level={0}
              onFileSelect={onFileSelect}
              onFileEdit={onFileEdit}
              onFileDelete={onFileDelete}
            />
          ))
        ) : (
          <div className="py-6 text-center text-gray-500 dark:text-gray-400">
            No project files available yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectFiles; 