"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, Download, Copy, Search, RefreshCw, MessageSquare, Bot, Clock, History, Trash2, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/context/ThemeProvider';
import { useWorkspaceHistory, Message, Workspace, WorkspaceHistory } from '@/agent-workspace/hooks/useWorkspaceHistory';

interface AgentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWorkspaceId?: string;
}

const AgentHistoryModal: React.FC<AgentHistoryModalProps> = ({
  isOpen,
  onClose,
  activeWorkspaceId
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const {
    workspaces,
    history,
    loading,
    error,
    fetchUserWorkspaces,
    fetchWorkspaceHistory,
    deleteWorkspace
  } = useWorkspaceHistory(activeWorkspaceId);

  // Custom scrollbar styles
  const scrollbarStyles = {
    // Base scrollbar container style
    container: `overflow-y-auto ${
      isDark 
        ? 'scrollbar-custom-dark' 
        : 'scrollbar-custom-light'
    }`,
    // Right panel specific with more spacing
    rightPanel: `overflow-y-auto ${
      isDark 
        ? 'scrollbar-custom-dark pr-1' 
        : 'scrollbar-custom-light pr-1'
    }`,
    // For code blocks with horizontal scrolling
    codeBlock: `overflow-x-auto ${
      isDark 
        ? 'scrollbar-custom-dark scrollbar-custom-x-dark' 
        : 'scrollbar-custom-light scrollbar-custom-x-light'
    }`
  };

  // Fetch workspaces when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserWorkspaces();
    }
  }, [isOpen, fetchUserWorkspaces]);

  // Load workspace messages when a workspace is selected
  useEffect(() => {
    if (selectedWorkspace?.id) {
      fetchWorkspaceHistory(selectedWorkspace.id);
    }
  }, [selectedWorkspace, fetchWorkspaceHistory]);

  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // When history data changes, select the first message by default
  useEffect(() => {
    if (history?.messages && history.messages.length > 0 && !selectedMessage) {
      setSelectedMessage(history.messages[0]);
    }
  }, [history, selectedMessage]);

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setSelectedMessage(null);
  };

  const handleMessageSelect = (message: Message) => {
    setSelectedMessage(message);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Handler for delete workspace button click
  const handleDeleteClick = (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation(); // Prevent workspace selection when clicking delete
    
    // Check if this is the active workspace
    if (workspaceId === activeWorkspaceId) {
      setDeleteError('Cannot delete the currently active workspace');
      return;
    }
    
    setWorkspaceToDelete(workspaceId);
    setShowDeleteConfirm(true);
    setDeleteError(null);
  };

  // Handler for confirming workspace deletion
  const handleConfirmDelete = async () => {
    if (!workspaceToDelete) return;
    
    const success = await deleteWorkspace(workspaceToDelete);
    
    if (success) {
      // If the deleted workspace was selected, clear the selection
      if (selectedWorkspace?.id === workspaceToDelete) {
        setSelectedWorkspace(null);
        setSelectedMessage(null);
      }
      
      // Close the confirmation dialog
      setShowDeleteConfirm(false);
      setWorkspaceToDelete(null);
    } else {
      setDeleteError('Failed to delete workspace');
    }
  };

  // Handler for canceling deletion
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setWorkspaceToDelete(null);
    setDeleteError(null);
  };

  // Filter workspaces that match the search term
  const filteredWorkspaces = workspaces.filter(workspace => 
    workspace.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50 flex items-center justify-center">
      <div 
        ref={modalRef}
        style={{ width: '1000px', height: '600px' }}
        className={`rounded-lg shadow-xl flex flex-col ${
          isDark ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
        }`}
      >
        {/* Inject custom scrollbar styles */}
        <style jsx global>{`
          .scrollbar-custom-dark::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .scrollbar-custom-dark::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-custom-dark::-webkit-scrollbar-thumb {
            background-color: #4b5563;
            border-radius: 20px;
          }
          .scrollbar-custom-dark::-webkit-scrollbar-thumb:hover {
            background-color: #6b7280;
          }
          .scrollbar-custom-light::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .scrollbar-custom-light::-webkit-scrollbar-track {
            background: transparent;
          }
          .scrollbar-custom-light::-webkit-scrollbar-thumb {
            background-color: #d1d5db;
            border-radius: 20px;
          }
          .scrollbar-custom-light::-webkit-scrollbar-thumb:hover {
            background-color: #9ca3af;
          }
          
          /* Custom styles for horizontal scrollbars */
          .scrollbar-custom-x-dark::-webkit-scrollbar {
            height: 6px;
          }
          .scrollbar-custom-x-light::-webkit-scrollbar {
            height: 6px;
          }
        `}</style>

        {/* Modal Header */}
        <div className={`flex justify-between items-center p-3 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className="text-lg font-semibold flex items-center">
            <History className="w-4 h-4 mr-2" />
            Agent History
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchUserWorkspaces}
              className={`p-1 rounded ${
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
              title="Refresh history"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className={`p-1 rounded ${
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content - Split into three sections */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel - Workspaces List */}
          <div style={{ width: '250px' }} className={`border-r ${scrollbarStyles.container} ${
            isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            {/* Search Bar */}
            <div className={`p-2 border-b ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <div className={`flex items-center px-2 py-1 rounded-md ${
                isDark ? 'bg-gray-700' : 'bg-white border border-gray-300'
              }`}>
                <Search className="w-3 h-3 mr-1 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search workspaces..."
                  className={`w-full bg-transparent outline-none text-sm ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}
                />
              </div>
            </div>

            {/* Delete Error Notification */}
            {deleteError && (
              <div className={`m-2 p-2 text-xs rounded flex items-center ${
                isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
              }`}>
                <AlertTriangle className="w-3 h-3 mr-1 flex-shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Workspaces List */}
            <div className="overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center h-24">
                  <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
                </div>
              ) : filteredWorkspaces.length > 0 ? (
                filteredWorkspaces.map((workspace) => (
                  <div 
                    key={workspace.id}
                    onClick={() => handleWorkspaceSelect(workspace)}
                    className={`p-4 border-b cursor-pointer transition-colors relative group ${
                      selectedWorkspace?.id === workspace.id
                        ? isDark 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-blue-50 border-gray-200'
                        : isDark 
                          ? 'hover:bg-gray-700 border-gray-700' 
                          : 'hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <MessageSquare className="w-4 h-4 mr-2 mt-1 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {workspace.name.length > 50 
                            ? `${workspace.name.slice(0, 50)}...` 
                            : workspace.name}
                          {workspace.id === activeWorkspaceId && (
                            <span className={`ml-2 px-1.5 py-0.5 text-xs rounded ${
                              isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                            }`}>
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatTimestamp(workspace.last_activity)} • {workspace.message_count} messages
                        </div>
                      </div>
                      {/* Delete Button */}
                      {workspace.id !== activeWorkspaceId && (
                        <button
                          className={`p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                            isDark 
                              ? 'hover:bg-red-800 text-gray-400 hover:text-red-200' 
                              : 'hover:bg-red-100 text-gray-500 hover:text-red-700'
                          }`}
                          onClick={(e) => handleDeleteClick(e, workspace.id)}
                          title="Delete workspace history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-xs text-gray-500">
                  {searchTerm 
                    ? 'No workspaces matching your search' 
                    : 'No workspaces found'}
                </div>
              )}
            </div>
          </div>

          {/* Middle Panel - Message List for Selected Workspace */}
          <div style={{ width: '400px' }} className={`border-r overflow-x-hidden ${scrollbarStyles.container} ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {selectedWorkspace ? (
              <>
                {/* Message List Header */}
                <div className={`sticky top-0 p-2 border-b ${
                  isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <h3 className="text-sm font-medium">
                    Messages ({history?.messages?.length || 0})
                  </h3>
                </div>
                
                {/* Message List */}
                <div className="overflow-y-auto overflow-x-hidden h-full">
                  {loading ? (
                    <div className="flex justify-center items-center h-24">
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
                    </div>
                  ) : history?.messages && history.messages.length > 0 ? (
                    history.messages.map((message) => (
                      <div 
                        key={message.id}
                        onClick={() => handleMessageSelect(message)}
                        className={`p-3 border-b cursor-pointer transition-colors ${
                          selectedMessage?.id === message.id
                            ? isDark 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-blue-50 border-gray-200'
                            : isDark 
                              ? 'hover:bg-gray-700 border-gray-700' 
                              : 'hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        <div className="flex items-start">
                          {message.sender === 'user' ? (
                            <MessageSquare className="w-3 h-3 mr-1 mt-1 text-blue-500 flex-shrink-0" />
                          ) : (
                            <Bot className="w-3 h-3 mr-1 mt-1 text-green-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-xs ${
                              message.sender === 'user' 
                                ? 'text-blue-500' 
                                : 'text-green-500'
                            }`}>
                              {message.sender === 'user' ? 'You' : 'Agent'}
                            </div>
                            <p className="text-xs truncate">
                              {message.text.slice(0, 60)}
                              {message.text.length > 60 ? '...' : ''}
                            </p>
                          </div>
                          <div className="text-xs text-gray-500 ml-1 flex-shrink-0">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-gray-500">
                      No messages in this workspace
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <p className="text-sm text-gray-500">Select a workspace to view messages</p>
              </div>
            )}
          </div>

          {/* Right Panel - Selected Message Detail */}
          <div style={{ width: '350px' }} className={scrollbarStyles.rightPanel}>
            {selectedMessage ? (
              <div className={`p-4 h-full ${scrollbarStyles.rightPanel}`}>
                <div className={`mb-4 flex justify-between items-center`}>
                  <div className="flex items-center">
                    {selectedMessage.sender === 'user' ? (
                      <MessageSquare className="w-4 h-4 mr-2 text-blue-500" />
                    ) : (
                      <Bot className="w-4 h-4 mr-2 text-green-500" />
                    )}
                    <div>
                      <h3 className={`text-sm font-medium ${
                        selectedMessage.sender === 'user'
                          ? 'text-blue-500'
                          : 'text-green-500'
                      }`}>
                        {selectedMessage.sender === 'user' ? 'You' : 'Agent'}
                      </h3>
                      <div className="text-xs text-gray-500">
                        {formatTimestamp(selectedMessage.timestamp)}
                      </div>
                    </div>
                  </div>
                
                  <button
                    onClick={() => copyToClipboard(selectedMessage.text)}
                    className={`p-1 rounded ${
                      isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                    }`}
                    title="Copy message"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                
                {/* Message Content */}
                <div className={`whitespace-pre-wrap text-sm p-3 rounded mb-4 ${scrollbarStyles.rightPanel} max-h-60 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  {selectedMessage.text}
                </div>
                
                {/* Tool invocations if available */}
                {selectedMessage.tools_invoked && selectedMessage.tools_invoked.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium mb-2">Tool Invocations</h4>
                    {selectedMessage.tools_invoked.map((tool, index) => (
                      <div
                        key={index}
                        className={`mb-3 rounded overflow-hidden ${
                          isDark ? 'bg-gray-800' : 'bg-gray-100'
                        }`}
                      >
                        <div className={`flex justify-between items-center px-2 py-1 ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          <span className="text-xs">{tool.name || 'Tool'}</span>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(tool, null, 2))}
                            className={`p-1 rounded ${
                              isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-300'
                            }`}
                            title="Copy tool details"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <pre className={`p-2 text-xs ${scrollbarStyles.codeBlock} ${
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          <code>{JSON.stringify(tool, null, 2)}</code>
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <div className="flex flex-col items-center justify-center">
                  <Bot className="w-8 h-8 mb-3" />
                  <p className="text-sm text-gray-500">Select a message to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 overflow-hidden bg-black bg-opacity-50 flex items-center justify-center">
            <div className={`rounded-lg shadow-xl p-6 w-96 ${
              isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
              <p className="mb-6">Are you sure you want to delete this workspace history? This action cannot be undone.</p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDelete}
                  className={`px-4 py-2 rounded ${
                    isDark 
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentHistoryModal;
