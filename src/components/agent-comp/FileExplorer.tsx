"use client";
import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { FiFolder, FiFile, FiFolderPlus, FiFilePlus, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { CodeFile } from '@/lib/services/agentService';

interface FileExplorerProps {
  onFileSelect: (file: CodeFile) => void;
  files?: CodeFile[];
  onFileCreate?: (path: string, name: string, isFolder: boolean) => void;
  onFileDelete?: (fileId: string) => void;
  selectedFileId?: string;
}

// Sample project structure for demo
const DEMO_FILES = {
  'src': {
    type: 'folder',
    children: {
      'components': {
        type: 'folder',
        children: {
          'Button.jsx': {
            type: 'file',
            content: `import React from 'react';

export const Button = ({ children, onClick, variant = 'primary' }) => {
  return (
    <button 
      className={\`btn btn-\${variant}\`} 
      onClick={onClick}
    >
      {children}
    </button>
  );
};`,
            language: 'jsx'
          },
          'Card.jsx': {
            type: 'file',
            content: `import React from 'react';

export const Card = ({ title, children }) => {
  return (
    <div className="card">
      {title && <div className="card-header">{title}</div>}
      <div className="card-body">{children}</div>
    </div>
  );
};`,
            language: 'jsx'
          }
        }
      },
      'pages': {
        type: 'folder',
        children: {
          'index.jsx': {
            type: 'file',
            content: `import React from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export default function HomePage() {
  return (
    <div className="container">
      <h1>Welcome to My App</h1>
      <Card title="Getting Started">
        <p>This is a sample React application.</p>
        <Button onClick={() => alert('Hello!')}>
          Click Me
        </Button>
      </Card>
    </div>
  );
}`,
            language: 'jsx'
          }
        }
      },
      'styles': {
        type: 'folder',
        children: {
          'global.css': {
            type: 'file',
            content: `body {
  font-family: 'Arial', sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.btn-primary {
  background-color: #0070f3;
  color: white;
}

.card {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  padding: 16px;
  background-color: #f0f0f0;
  font-weight: bold;
  border-bottom: 1px solid #e0e0e0;
}

.card-body {
  padding: 16px;
}`,
            language: 'css'
          }
        }
      }
    }
  },
  'public': {
    type: 'folder',
    children: {
      'index.html': {
        type: 'file',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My React App</title>
</head>
<body>
  <div id="root"></div>
  <script src="../src/index.js"></script>
</body>
</html>`,
        language: 'html'
      }
    }
  },
  'package.json': {
    type: 'file',
    content: `{
  "name": "my-react-app",
  "version": "1.0.0",
  "description": "A sample React application",
  "main": "index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  }
}`,
    language: 'json'
  },
  'README.md': {
    type: 'file',
    content: `# My React App

This is a sample React application for demonstration purposes.

## Getting Started

1. Clone this repository
2. Run \`npm install\`
3. Run \`npm start\`

## Features

- Component-based architecture
- CSS styling
- Interactive UI elements`,
    language: 'markdown'
  }
};

const FileExplorer: React.FC<FileExplorerProps> = ({ onFileSelect }) => {
  const { theme } = useTheme();
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'src': true,
    'src/components': true
  });
  
  // Toggle folder expansion
  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };
  
  // Render file or folder
  const renderItem = (name: string, item: any, path: string = '') => {
    const fullPath = path ? `${path}/${name}` : name;
    
    if (item.type === 'folder') {
      const isExpanded = expandedFolders[fullPath];
      
      return (
        <div key={fullPath}>
          <div 
            className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded ${
              isExpanded ? 'text-blue-600 dark:text-blue-400 font-medium' : ''
            }`}
            onClick={() => toggleFolder(fullPath)}
          >
            {isExpanded ? <FiChevronDown className="mr-1" /> : <FiChevronRight className="mr-1" />}
            <FiFolder className={`mr-2 ${isExpanded ? 'text-blue-500' : 'text-yellow-500'}`} />
            <span>{name}</span>
          </div>
          
          {isExpanded && (
            <div className="pl-4 border-l border-gray-200 dark:border-gray-700 ml-2">
              {Object.entries(item.children).map(([childName, childItem]) => 
                renderItem(childName, childItem, fullPath)
              )}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div 
          key={fullPath}
          className="flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          onClick={() => onFileSelect({
            id: `demo-${fullPath}`,
            name,
            path: fullPath,
            content: item.content,
            language: item.language,
            lastModified: new Date()
          })}
        >
          <FiFile className="mr-2 text-gray-500" />
          <span>{name}</span>
        </div>
      );
    }
  };
  
  return (
    <div className={`h-full overflow-y-auto p-2 ${
      theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'
    }`}>
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-medium">Project Files</h3>
        <div className="flex gap-2">
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <FiFilePlus className="text-blue-500" />
          </button>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <FiFolderPlus className="text-yellow-500" />
          </button>
        </div>
      </div>
      
      <div className="space-y-1">
        {Object.entries(DEMO_FILES).map(([name, item]) => 
          renderItem(name, item)
        )}
      </div>
    </div>
  );
};

export default FileExplorer; 