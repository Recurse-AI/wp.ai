import React from 'react';
import { useTheme } from '@/context/ThemeProvider';

interface ProcessingStatusIndicatorProps {
  processingFilePath: string | null;
}

const ProcessingStatusIndicator: React.FC<ProcessingStatusIndicatorProps> = ({ processingFilePath }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  if (!processingFilePath) return null;
  
  // Extract the filename from path
  const filename = processingFilePath.split('/').pop() || processingFilePath;
  
  return (
    <div className={`flex items-center px-3 py-2 text-xs rounded-md mb-2 ${
      isDark ? 'bg-blue-900/20 text-blue-200' : 'bg-blue-50 text-blue-700'
    }`}>
      <div className="w-3 h-3 mr-2 rounded-full border-t-2 border-r-2 border-blue-500 animate-spin"></div>
      <span>Creating file: <code className="font-mono">{filename}</code></span>
    </div>
  );
};

export default ProcessingStatusIndicator; 