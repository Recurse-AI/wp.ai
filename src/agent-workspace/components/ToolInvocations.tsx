import React, { useState, useEffect } from 'react';
import { ToolInvocation } from '../types';
import { FiChevronDown, FiChevronRight, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { agentAPI } from '../utils/apiService';
import { CodeBlock } from './CodeBlock';

interface ToolInvocationsProps {
  messageId: string;
  toolInvocations: ToolInvocation[];
}

export const ToolInvocations: React.FC<ToolInvocationsProps> = ({ 
  messageId, 
  toolInvocations 
}) => {
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [toolStatuses, setToolStatuses] = useState<Record<string, ToolInvocation>>({});
  
  // Function to toggle expansion state of a tool
  const toggleExpand = (toolId: string) => {
    setExpandedTools(prev => ({
      ...prev,
      [toolId]: !prev[toolId]
    }));
  };
  
  // Poll for tool status updates
  useEffect(() => {
    if (!toolInvocations?.length) return;
    
    // Find tools that are pending or running
    const pendingTools = toolInvocations.filter(tool => 
      tool.status === 'pending' || tool.status === 'running'
    );
    
    if (pendingTools.length === 0) return;
    
    // Initialize expanded state for all tools
    const initialExpandedState: Record<string, boolean> = {};
    toolInvocations.forEach(tool => {
      initialExpandedState[tool.id] = false;
    });
    setExpandedTools(initialExpandedState);
    
    // Poll for updates
    const interval = setInterval(async () => {
      let stillPending = false;
      
      // Check status of each pending tool
      for (const tool of pendingTools) {
        try {
          const result = await agentAPI.getToolStatus(messageId, tool.id);
          
          if (result.success && result.data) {
            setToolStatuses(prev => {
              // Make sure the result.data is defined before setting it
              return {
                ...prev,
                [tool.id]: result.data!
              };
            });
            
            // If still pending or running, mark for continued polling
            if (result.data.status === 'pending' || result.data.status === 'running') {
              stillPending = true;
            }
          }
        } catch (error) {
          console.error(`Error polling tool status for ${tool.id}:`, error);
        }
      }
      
      // If no tools are still pending, stop polling
      if (!stillPending) {
        clearInterval(interval);
      }
    }, 2000);
    
    return () => clearInterval(interval);
  }, [messageId, toolInvocations]);
  
  // Format parameters for display
  const formatParameters = (params: Record<string, any>) => {
    return JSON.stringify(params, null, 2);
  };
  
  // Get tool status and result
  const getToolData = (tool: ToolInvocation) => {
    // Check if we have a cached status update
    if (toolStatuses[tool.id]) {
      return toolStatuses[tool.id];
    }
    return tool;
  };
  
  // Render tool status icon
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="text-green-500" />;
      case 'failed':
        return <FiAlertCircle className="text-red-500" />;
      case 'pending':
      case 'running':
      default:
        return <FiClock className="text-blue-500 animate-pulse" />;
    }
  };
  
  if (!toolInvocations || toolInvocations.length === 0) {
    return null;
  }
  
  return (
    <div className="tools-invocation mt-3 space-y-2">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Tool Invocations:
      </div>
      
      {toolInvocations.map(tool => {
        const toolData = getToolData(tool);
        const isExpanded = expandedTools[tool.id] || false;
        
        return (
          <div 
            key={tool.id} 
            className="tool-item border rounded-md overflow-hidden dark:border-gray-700"
          >
            <div 
              className="tool-header flex items-center justify-between p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => toggleExpand(tool.id)}
            >
              <div className="flex items-center space-x-2">
                {renderStatusIcon(toolData.status)}
                <span className="font-medium">{tool.tool_name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {new Date(toolData.started_at).toLocaleTimeString()}
                </span>
                {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
              </div>
            </div>
            
            {isExpanded && (
              <div className="tool-details p-3 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
                <div className="text-sm mb-2">
                  <div className="font-medium">Parameters:</div>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto">
                    {formatParameters(tool.parameters)}
                  </pre>
                </div>
                
                {toolData.status === 'completed' && toolData.result && (
                  <div className="text-sm mb-2">
                    <div className="font-medium">Result:</div>
                    {typeof toolData.result === 'string' ? (
                      <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto">
                        {toolData.result}
                      </pre>
                    ) : (
                      <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto">
                        {JSON.stringify(toolData.result, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
                
                {toolData.status === 'failed' && toolData.error && (
                  <div className="text-sm">
                    <div className="font-medium text-red-500">Error:</div>
                    <pre className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-2 rounded text-xs overflow-auto">
                      {toolData.error}
                    </pre>
                  </div>
                )}
                
                {toolData.completed_at && (
                  <div className="text-xs text-gray-500 mt-2">
                    Completed: {new Date(toolData.completed_at).toLocaleString()}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}; 