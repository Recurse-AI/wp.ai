"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AgentPreviewProps } from '../../types';
import { useTheme } from '@/context/ThemeProvider';
import { Loader2, RefreshCw } from 'lucide-react';
import WordPressPlayground from './WordPressPlayground';

const AgentPreview: React.FC<AgentPreviewProps> = ({
  files,
  activeFile,
  currentService
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewReady, setPreviewReady] = useState(false);
  
  // Auto-detect WordPress content in addition to checking service ID
  const isWordPressContent = React.useMemo(() => {
    // Check for WordPress plugin structure
    const hasWordPressFiles = Object.entries(files).some(([key, value]) => {
      if (typeof value === 'object' && value.type === 'folder') {
        // Look for PHP files with WordPress plugin header
        const hasPluginFile = Object.entries(value.children || {}).some(([childKey, childValue]) => {
          if (childKey.endsWith('.php') && 
              typeof childValue === 'object' && 
              childValue.type === 'file' && 
              typeof childValue.content === 'string') {
            return childValue.content.includes('Plugin Name:') || 
                   childValue.content.includes('Theme Name:');
          }
          return false;
        });
        return hasPluginFile;
      }
      return false;
    });
    
    return hasWordPressFiles;
  }, [files]);
  
  const isWordPressPlayground = currentService?.id === 'wp-playground' || isWordPressContent;

  // Initialize preview when component mounts
  useEffect(() => {
    let mounted = true;
    let timeout: NodeJS.Timeout;

    const initializePreview = async () => {
      if (!mounted) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // For non-WordPress playground services, simulate loading
        if (!isWordPressPlayground) {
          timeout = setTimeout(() => {
            if (mounted) {
              setLoading(false);
              setPreviewReady(true);
            }
          }, 1000);
        } else {
          // For WordPress playground, the loading state is managed by the component
          setPreviewReady(true);
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error initializing preview:', error);
          setError('Failed to initialize preview');
          setLoading(false);
        }
      }
    };
    
    initializePreview();
    
    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [isWordPressPlayground]);

  // Update preview when files change
  useEffect(() => {
    if (!previewReady || !files) return;
    
    const updateFiles = async () => {
      if (!isWordPressPlayground) {
        console.log('Updating preview with files:', files);
      }
      // WordPress Playground component handles its own file updates
    };
    
    updateFiles();
  }, [files, previewReady, isWordPressPlayground]);

  // Handle refresh preview
  const handleRefresh = () => {
    setLoading(true);
    
    // For non-WordPress playground services
    if (!isWordPressPlayground) {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } else {
      // For WordPress playground, we force a re-render by toggling the key
      setPreviewReady(false);
      setTimeout(() => {
        setPreviewReady(true);
        setLoading(false);
      }, 100);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Preview header */}
      <div className={`flex items-center justify-between px-4 py-2 ${
        isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-100 text-gray-800 border-gray-200'
      } border-b`}>
        <div className="text-sm font-medium">
          {isWordPressPlayground ? 'WordPress Preview' : 'Preview'}
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`p-1 rounded ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Refresh preview"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {/* Preview content */}
      <div className="flex-1 overflow-hidden relative">
        {/* Loading state for non-WordPress services */}
        {loading && !isWordPressPlayground && (
          <div className={`absolute inset-0 flex items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="text-center">
              <Loader2 className={`w-8 h-8 mx-auto animate-spin ${
                isDark ? 'text-blue-400' : 'text-blue-500'
              }`} />
              <p className="mt-2 text-sm text-gray-500">
                Loading preview...
              </p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-50 p-4">
            <div className="max-w-md text-center">
              <p className="text-red-500 font-medium">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-4 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {/* WordPress Playground */}
        {isWordPressPlayground && previewReady && (
          <WordPressPlayground 
            files={files || {}} 
            className="w-full h-full"
          />
        )}
        
        {/* Default iframe for other services */}
        {!isWordPressPlayground && (
          <iframe
            ref={iframeRef}
            className={`w-full h-full border-0 ${(loading || error) ? 'opacity-0' : 'opacity-100'}`}
            title="Preview"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            src="about:blank"
          />
        )}
      </div>
      
      {/* Preview placeholder for non-WordPress services */}
      {(!loading && !error && !isWordPressPlayground) && (
        <div className="absolute inset-0 flex items-center justify-center bg-white p-8">
          <div className="max-w-md text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Preview</h3>
            <p className="text-gray-500 text-sm mb-4">
              This is a placeholder for the preview.
              The actual implementation would render a live preview of your code.
            </p>
            <div className="border border-gray-200 rounded-md p-3 bg-gray-50 text-left text-xs text-gray-700 font-mono overflow-auto max-h-60 custom-scrollbar">
              <pre>{JSON.stringify(files, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPreview; 