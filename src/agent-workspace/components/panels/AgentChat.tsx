"use client";

import React, { useState, useRef, useEffect } from 'react';
import { AgentSessionState, AgentMessage, AgentChatProps } from '../../types';
import { useTheme } from '@/context/ThemeProvider';
import { Send, RefreshCw, ExternalLink, Code } from 'lucide-react';
import ScrollableMessageContainer from './ScrollableMessageContainer';
import { toast } from 'react-hot-toast';
import { FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import ProcessingStatusIndicator from './ProcessingStatusIndicator';
import { 
  processAttachedFolders, 
  saveFilesToLocalStorage, 
  extractFormattedStructureFromChat, 
  extractFileTreeFromContent, 
  extractFilesFromMessage, 
  extractWordPressPlugin,
  extractJSONStructureFromContent,
  extractTextTreeFormat,
  parseDirectoryTree
} from '../../utils/fileUtils';
import FileOperationNotification from '../notifications/FileOperationNotification';
import { useFileOperations } from '../../context/FileOperationsContext';
import MessageContent from './MessageContent';

// Extend the ReactMarkdown types to include inline property
declare module 'react-markdown' {
  interface CodeProps {
    inline?: boolean;
  }
}

const AgentChat: React.FC<AgentChatProps> = ({
  sessionState,
  onSendMessage,
  processingFilePath,
  hideCodeInMessages = false
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);
  const [currentThinking, setCurrentThinking] = useState<string | null>(null);
  const [processingIndicator, setProcessingIndicator] = useState<string | null>(null); 
  const { operations } = useFileOperations();
  
 
  
  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  

  // Auto-resize textarea with improved handling
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height before calculating new height to avoid cumulative growth
      textarea.style.height = '0px';
      const maxHeight = isMobile ? 120 : 180; // Increased max height values
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      
      // If we're at max height, ensure the textarea is scrollable
      if (newHeight === maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  };
  
  // Readjust textarea when mobile state changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [isMobile]);
  
  // Focus input when conversation is empty
  useEffect(() => {
    if (sessionState.messages.length === 0 && textareaRef.current && !isMobile) {
      textareaRef.current.focus();
    }
  }, [sessionState.messages.length, isMobile]);
  
  // Handle input change with improved resize handling
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };
  
  // Handle key press (Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Function to send a message to the agent
  const processUserMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;
    
    setMessage('');
    setIsTyping(true);
    
    // Remove processing indicator completely
    setProcessingIndicator(null);
    
    // Check for manual file structure commands
    if (userMessage.toLowerCase().includes('/parse-tree') || 
        userMessage.toLowerCase().includes('/parse structure')) {
      try {
        // Extract the tree structure text
        const treeMatch = userMessage.match(/```([\s\S]+?)```/);
        if (treeMatch && treeMatch[1]) {
          // Get the structure text
          const treeText = treeMatch[1];
          
          // Try parsing as JSON first
          try {
            const jsonObj = JSON.parse(treeText);
            if (jsonObj && typeof jsonObj === 'object') {
              // Check if it looks like our file structure format
              const hasFolder = Object.values(jsonObj).some(
                (val: any) => val && val.type === 'folder'
              );
              
              if (hasFolder && sessionState.id) {
                // Merge with existing files
                const updatedFiles = { ...sessionState.files, ...jsonObj };
                
                // Save to localStorage
                saveFilesToLocalStorage(sessionState.id, updatedFiles);
                
                // Add user message
                const userMessageObj: AgentMessage = {
                  id: uuidv4(),
                  role: 'user',
                  content: userMessage,
                  timestamp: new Date(),
                  codeBlocks: []
                };
                
                // Add system response
                const assistantMessageObj: AgentMessage = {
                  id: uuidv4(),
                  role: 'assistant',
                  content: `I've parsed your JSON structure and created the following structure:\n\n${Object.keys(jsonObj).map(root => `- ${root}/`).join('\n')}`,
                  timestamp: new Date(),
                  codeBlocks: [],
                  status: 'completed'
                };
                
                // Update messages in the state
                sessionState.messages.push(userMessageObj);
                sessionState.messages.push(assistantMessageObj);
                
                setIsTyping(false);
                return;
              }
            }
          } catch (jsonError) {
            // Not a valid JSON, continue with tree parsing
            console.log('Not a valid JSON structure, falling back to tree parsing');
          }
          
          // Check if this looks like a tree structure
          if (treeText.includes('/') || /[├└─│]/.test(treeText)) {
            const parsedFiles = parseDirectoryTree(treeText);
            
            if (parsedFiles && Object.keys(parsedFiles).length > 0 && sessionState.id) {
              // Merge with existing files
              const updatedFiles = { ...(sessionState.files || {}), ...parsedFiles };
              
              // Save to localStorage
              saveFilesToLocalStorage(sessionState.id, updatedFiles);
              
              // Add user message
              const userMessageObj: AgentMessage = {
                id: uuidv4(),
                role: 'user',
                content: userMessage,
                timestamp: new Date(),
                codeBlocks: []
              };
              
              // Add system response
              const assistantMessageObj: AgentMessage = {
                id: uuidv4(),
                role: 'assistant',
                content: `I've parsed your directory structure and created the following structure:\n\n${Object.keys(parsedFiles || {}).map(root => `- ${root}/`).join('\n')}`,
                timestamp: new Date(),
                codeBlocks: [],
                status: 'completed'
              };
              
              // Update messages in the state
              sessionState.messages.push(userMessageObj);
              sessionState.messages.push(assistantMessageObj);
              
              setIsTyping(false);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error parsing structure:', error);
      }
    }
    
    try {
      // Import websocket service to directly work with the service
      const { websocketService } = await import('../../utils/websocketService');
      
      // Add user message to state
      if (onSendMessage) {
        // Let the parent handle message addition if callback exists
        await onSendMessage(userMessage);
      } else {
        // Otherwise, add it directly to the session state
        const userMessageObj: AgentMessage = {
          id: uuidv4(),
          role: 'user',
          content: userMessage,
          timestamp: new Date(),
          codeBlocks: []
        };
        
        // Add a placeholder for the assistant's response
        const assistantMessageObj: AgentMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: 'Thinking...',
          timestamp: new Date(),
          codeBlocks: [],
          thinking: '',
          status: 'processing'
        };
        
        // Update messages in the state
        sessionState.messages.push(userMessageObj);
        sessionState.messages.push(assistantMessageObj);
      }
      
      // Basic detection for common operation patterns
      const lowerMessage = userMessage.toLowerCase();
      
      // Check if the message matches any of the workspace operations
      if (lowerMessage.includes('create workspace') || lowerMessage.includes('new workspace')) {
        // Extract workspace name
        const workspaceName = extractNameFromMessage(userMessage) || 'New Workspace';
        
        // Send create workspace command
        websocketService.send(JSON.stringify({
          type: 'create_workspace',
          name: workspaceName
        }));
        return;
      }
      
      // Check if it's a tool execution request
      if (lowerMessage.includes('plugin template') || lowerMessage.includes('create plugin')) {
        // Parse for plugin details
        const templateType = extractTemplateType(userMessage) || 'basic';
        const pluginName = extractNameFromMessage(userMessage) || 'New Plugin';
        const description = extractDescriptionFromMessage(userMessage) || 'Plugin created from chat';
        
        // Send tool execution command
        websocketService.send(JSON.stringify({
          type: 'execute_tool',
          tool_name: 'create_plugin_template',
          params: {
            template_type: templateType,
            plugin_name: pluginName,
            description: description
          }
        }));
        return;
      }
      
      // Check if it's requesting theme template
      if (lowerMessage.includes('theme template') || lowerMessage.includes('create theme')) {
        // Parse for theme details
        const templateType = extractTemplateType(userMessage) || 'basic';
        const themeName = extractNameFromMessage(userMessage) || 'New Theme';
        const description = extractDescriptionFromMessage(userMessage) || 'Theme created from chat';
        
        // Send tool execution command
        websocketService.send(JSON.stringify({
          type: 'execute_tool',
          tool_name: 'create_theme_template',
          params: {
            template_type: templateType,
            theme_name: themeName,
            description: description
          }
        }));
        return;
      }
      
      // Default: Send as a query to the agent
      // Remove the processing indicator completely
      
      // Determine the appropriate mode based on content
      const mode = lowerMessage.includes('theme') ? 'theme' : 'plugin';
      
      websocketService.send(JSON.stringify({
        type: 'query_agent',
        query: userMessage,
        mode: mode
      }));
    } catch (error) {
      console.error('Error processing message:', error);
      setIsTyping(false);
      setProcessingIndicator(null);
      
      // Show a more helpful error message without exposing backend details
      toast.error('Failed to process your message. Check that the backend server is properly configured.', {
        duration: 5000
      });
      
      // If onSendMessage is available, use as fallback
      if (typeof onSendMessage === 'function') {
        await onSendMessage(userMessage);
      }
    }
  };
  
  // Helper functions to extract information from message
  const extractNameFromMessage = (message: string): string | null => {
    // Look for patterns like "called X" or "named X" or "with name X"
    const namedPatterns = [
      /(?:called|named)\s+["']?([^"']+)["']?/i,
      /(?:with name|with the name)\s+["']?([^"']+)["']?/i,
      /name\s+(?:is|should be)\s+["']?([^"']+)["']?/i,
      /(?:create|make)(?:\s+a)?\s+(?:new)?\s+(?:plugin|theme|workspace)(?:\s+(?:called|named))?\s+["']?([^"']+)["']?/i
    ];
    
    for (const pattern of namedPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  };
  
  const extractTemplateType = (message: string): string | null => {
    // Common plugin/theme template types
    const templateTypes = ['blank', 'basic', 'settings_page', 'shortcode', 'custom_post_type', 'dashboard_widget', 'ecommerce', 'blog', 'portfolio'];
    
    for (const type of templateTypes) {
      if (message.toLowerCase().includes(type)) {
        return type;
      }
    }
    
    return null;
  };
  
  const extractDescriptionFromMessage = (message: string): string | null => {
    // Look for description patterns
    const descriptionPatterns = [
      /description\s+(?:is|should be)\s+["']([^"']+)["']/i,
      /with\s+(?:the\s+)?description\s+["']([^"']+)["']/i,
      /that\s+(?:is|will be)\s+["']([^"']+)["']/i
    ];
    
    for (const pattern of descriptionPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  };
  
  // Enhanced send message function
  const handleSendMessage = async () => {
    if (!message.trim() || sessionState.isProcessing || isTyping) return;
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      // Focus back on input after sending for continuous conversation
      textareaRef.current.focus();
    }
    
    // Call the new message processor
    await processUserMessage(message);
  };
  
  // Handle example click from empty state
  const handleExampleClick = (exampleText: string) => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      setMessage(exampleText);
      adjustTextareaHeight();
    }
  };

  // Function to format file paths for display
  const formatFilePath = (path: string) => {
    if (!path) return {
      fullPath: "",
      fileName: "",
      directory: "",
      emoji: "📄 "
    };
    
    // Extract the file name and directory
    const parts = path.split('/');
    const fileName = parts.pop() || "";
    const directory = parts.join('/');
    
    // Get the file extension to determine emoji
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
    const fileEmoji = 
      fileExt === 'php' ? '🐘 ' : 
      fileExt === 'js' ? '⚡ ' : 
      fileExt === 'css' ? '🎨 ' : 
      fileExt === 'html' ? '🌐 ' : 
      fileExt === 'json' ? '📋 ' : 
      '📄 ';
    
    return {
      fullPath: path,
      fileName,
      directory: directory ? directory + '/' : "",
      emoji: fileEmoji
    };
  };

  // Prepare content for display by adding file formatting
  const prepareContentForDisplay = (content: string) => {
    if (!content) return content;
    
    // Look for file paths in the content and format them
    const filePathRegex = /(?:file|path):\s*([^\s]+\/[^\s]+\.[a-zA-Z0-9]+)/gi;
    const formattedContent = content.replace(filePathRegex, (match, filePath) => {
      const { fullPath, fileName, directory, emoji } = formatFilePath(filePath);
      return `\n┌─ File: ${fullPath}\n│  ${emoji} ${fileName}\n└─ Available in File Explorer\n`;
    });
    
    return formattedContent;
  };

  // Update the setupWebSocketListeners implementation
  const setupWebSocketListeners = async () => {
    const { websocketService } = await import('../../utils/websocketService');
    
    if (!websocketService) return;
    
    // Set a higher max listeners limit to avoid memory leak warnings
    if (typeof websocketService.setMaxListeners === 'function') {
      websocketService.setMaxListeners(100);
    }
    
    // Reset processing state handler
    const resetProcessingHandler = () => {
      setCurrentResponse(null);
      setCurrentThinking(null);
      setProcessingIndicator(null);
      setIsTyping(false);
    };
    
    // Handle API errors
    const handleApiError = (data: any) => {
      console.error("AI Error:", data);
      resetProcessingHandler();
      toast.error(
        data.message || "An error occurred with the AI service. Please try again.",
        { duration: 5000 }
      );
    };
    
    // Handle agent responses
    const handleAgentResponse = (data: any) => {
      resetProcessingHandler();
      if (data.content && (
        data.content.includes("Create a WordPress plugin") || 
        data.content.includes("Let's create a WordPress plugin"))) {
        
        // Extract plugin details when finished
        if (data.status === 'completed') {
          extractWordPressPlugin(data.content);
        }
      }
      
      // Extract file structure from messages
      if (data.status === 'completed' && data.content && data.content.includes('Here is the file structure')) {
        extractFormattedStructureFromChat(data.content);
      }
      
      // Extract file tree from directories
      if (data.status === 'completed' && data.content && 
          (data.content.includes('directory structure') || 
           data.content.includes('file structure'))) {
        extractFileTreeFromContent(data.content);
      }
      
      // Parse JSON descriptions of file structures
      if (data.status === 'completed' && data.content && 
          data.content.includes('{') && 
          data.content.includes('}')) {
        extractJSONStructureFromContent(data.content);
      }
      
      // Parse text-based tree format
      if (data.status === 'completed' && data.content && 
          (data.content.includes('└──') || 
           data.content.includes('├──') || 
           data.content.includes('│'))) {
        extractTextTreeFormat(data.content);
      }
      
      // Parse file attachments
      if (data.status === 'completed' && data.content) {
        try {
          const filesResult = extractFilesFromMessage(data.content);
          if (sessionState?.id) {
            saveFilesToLocalStorage(sessionState.id, filesResult);
          }
        } catch (error) {
          console.error('Error extracting files:', error);
        }
      }
    };
    
    // Handle tool results (usually file operations)
    const handleToolResult = (data: any) => {
      resetProcessingHandler();
    };
    
    // Handle workspace history events
    const handleWorkspaceHistory = (data: any) => {
      resetProcessingHandler();
    };
    
    // Handle workspace creation events
    const handleWorkspaceCreated = (data: any) => {
      resetProcessingHandler();
    };
    
    // Handle thinking updates during processing
    const handleThinkingUpdate = (data: any) => {
      if (data && data.thinking) {
        setCurrentThinking(data.thinking);
      }
    };
    
    // Handle text updates during streaming responses
    const handleTextUpdate = (data: any) => {
      if (data && data.text) {
        setCurrentResponse(data.text);
        
        // If the processing path changes during a response
        if (data.processing_file) {
          const formattedPath = formatFilePath(data.processing_file);
          // Use only the string portion for the indicator
          setProcessingIndicator(formattedPath.fullPath);
        }
      }
    };
    
    // Handle available tools notification (typically not used directly in UI)
    const handleAvailableTools = (data: any) => {
      // This is mainly for debugging, could be used to show available actions
      console.log('Available tools:', data);
    };
    
    // Add all event listeners
    websocketService.addListener('agent_response', handleAgentResponse);
    websocketService.addListener('ai_error', handleApiError);
    websocketService.addListener('tool_result', handleToolResult);
    websocketService.addListener('workspace_history', handleWorkspaceHistory);
    websocketService.addListener('workspace_created', handleWorkspaceCreated);
    websocketService.addListener('thinking_update', handleThinkingUpdate);
    websocketService.addListener('text_update', handleTextUpdate);
    websocketService.addListener('available_tools', handleAvailableTools);
    
    // Return cleanup function to remove listeners
    return () => {
      websocketService.removeListener('agent_response', handleAgentResponse);
      websocketService.removeListener('ai_error', handleApiError);
      websocketService.removeListener('tool_result', handleToolResult);
      websocketService.removeListener('workspace_history', handleWorkspaceHistory);
      websocketService.removeListener('workspace_created', handleWorkspaceCreated);
      websocketService.removeListener('thinking_update', handleThinkingUpdate);
      websocketService.removeListener('text_update', handleTextUpdate);
      websocketService.removeListener('available_tools', handleAvailableTools);
    };
  };

  // Set up event listeners on component mount and clean up on unmount
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const initListeners = async () => {
      cleanup = await setupWebSocketListeners();
    };
    
    initListeners();
    
    // Clean up listeners when component unmounts
    return () => {
      if (cleanup) cleanup();
    };
  }, [sessionState?.id]); // Only re-attach listeners if workspace ID changes

  // Add a new useEffect to process attached folders when messages change
  useEffect(() => {
    // Check for attached folders in the latest message
    if (sessionState.messages && sessionState.messages.length > 0) {
      const latestMessage = sessionState.messages[sessionState.messages.length - 1];
      
      // Only process assistant messages that are completed
      if (latestMessage && 
          latestMessage.role === 'assistant' && 
          latestMessage.status === 'completed' && 
          latestMessage.content) {
        
        // Use the enhanced file extraction functions to process the message content
        if (sessionState.id) {
          // Start with current files
          let updatedFiles = { ...(sessionState.files || {}) };
          
          // Apply each extraction function in sequence
          const extractionFunctions = [
            // Try extracting JSON structure first (highest priority)
            (content: string) => extractJSONStructureFromContent(content) || {},
            // Try extracting text tree format
            (content: string) => extractTextTreeFormat(content) || {},
            // Then try the other formats
            extractFormattedStructureFromChat,
            (content: string) => extractFileTreeFromContent(content, updatedFiles),
            extractFilesFromMessage,
            (content: string) => extractWordPressPlugin(content, updatedFiles)
          ];
          
          // Process with each extraction method
          extractionFunctions.forEach(extractFn => {
            try {
              // Only update if we got new files and result is valid
              const result = extractFn(latestMessage.content);
              if (result && typeof result === 'object' && Object.keys(result).length > 0) {
                updatedFiles = { ...updatedFiles, ...result };
              }
            } catch (error) {
              console.error(`Error in extraction function:`, error);
            }
          });
          
          // Only save if we found files to save
          if (Object.keys(updatedFiles).length > 0) {
            // Save to localStorage
            saveFilesToLocalStorage(sessionState.id, updatedFiles);
            console.log('Processed and saved file structure from chat response');
          }
        }
      }
    }
  }, [sessionState.messages, sessionState.id, sessionState.files]);

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono" style={{ 
      height: '100%', 
      maxHeight: '100vh'
    }}>
      {/* Header with terminal-style presentation */}
      <div className={`px-3 py-2 border-b ${
        isDark ? 'bg-gray-800/70 border-gray-700 text-gray-300' : 'bg-gray-900/90 border-green-800/50 text-green-400'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FiMessageSquare className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">
              {sessionState.selectedService ? 
                `${sessionState.selectedService.title} Assistant` : 
                'WordPress AI Assistant'}
            </span>
          </div>
          {isTyping && (
            <div className="flex items-center text-xs">
              <div className={`w-2 h-2 ${isDark ? 'bg-blue-500' : 'bg-green-500'} rounded-full animate-pulse mr-1`}></div>
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Using the ScrollableMessageContainer component */}
      <ScrollableMessageContainer
        messages={sessionState.messages.map(msg => ({
          ...msg,
          content: msg.role === 'assistant' ? prepareContentForDisplay(msg.content) : msg.content
        }))}
        isDark={isDark}
        isMobile={isMobile}
        emptyStateTitle={sessionState.selectedService ? 
          `${sessionState.selectedService.title} Assistant` : 
          'WordPress AI Assistant'}
        emptyStateDescription={sessionState.selectedService ? 
          sessionState.selectedService.description : 
          'I can help you build, customize, and debug WordPress plugins and themes. Just tell me what you need - no need to select tools or options!'}
        emptyStateExample={sessionState.selectedService?.example || "Create a contact form plugin for WordPress"}
        onExampleClick={handleExampleClick}
        maxHeight="calc(95vh - 160px)" // Adjusted for the new header
        currentResponse={currentResponse ? prepareContentForDisplay(currentResponse) : null}
        isTyping={isTyping}
        currentThinking={currentThinking}
        processingIndicator={processingIndicator}
        hideCodeInMessages={hideCodeInMessages}
        className={isDark ? 'bg-gray-900' : 'bg-black text-green-400'}
      />
      
      {/* File processing indicator */}
      {processingFilePath && (
        <div className="px-4 pt-2">
          <ProcessingStatusIndicator processingFilePath={processingFilePath} />
        </div>
      )}
      
      {/* File operations notifications */}
      {operations.length > 0 && (
        <div className="px-4 pt-2">
          <FileOperationNotification operations={operations} />
        </div>
      )}
      
      {/* Enhanced input box with terminal style */}
      <div className={`p-2 sm:p-4 transition-all flex-shrink-0 ${
        isDark ? 'bg-gray-900' : 'bg-black'
      }`}
      style={{ 
        maxHeight: '180px', // Increased from 140px to accommodate taller textarea
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,128,0,0.2)'}`
      }}
      >
        <div className={`flex flex-col overflow-hidden ${
          isDark ? 'text-gray-400' : 'text-green-600'
        }`}>
          <div className="text-xs px-2 pb-1">
            {isDark ? '┌─' : '┌─'} Command Input
          </div>
          
          <div className={`flex-1 rounded-md overflow-hidden flex flex-col ${
            isDark ? 'bg-gray-800/70' : 'bg-gray-900'
          } ${sessionState.isProcessing || isTyping ? 'opacity-60' : ''} focus-within:ring-1 ${
            isDark ? 'focus-within:ring-blue-500/30' : 'focus-within:ring-green-500/30'
          }`}>
            <textarea
              ref={textareaRef}
              rows={2}
              placeholder={
                processingIndicator ? processingIndicator :
                sessionState.isProcessing || isTyping
                  ? 'Agent is processing...'
                  : 'Type your request here (e.g., "Create a plugin", "Show tools", "Get history")...'
              }
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={sessionState.isProcessing || isTyping}
              className={`flex-1 p-3 resize-none focus:outline-none ${
                isDark ? 'bg-gray-800/90 text-gray-200' : 'bg-gray-900/90 text-green-400'
              } ${isMobile ? 'text-sm' : ''} custom-scrollbar-improved`}
              style={{ 
                minHeight: '60px',
                height: isMobile ? '60px' : '70px',
                maxHeight: isMobile ? '120px' : '180px'
              }}
            />
            <div className={`flex items-center justify-between px-2 py-1 ${
              isDark ? 'bg-gray-800/90' : 'bg-gray-900/90'
            }`}>
              <div className="flex space-x-1">
                {/* Indicator showing when specific actions are processing */}
                {processingIndicator && (
                  <div className="flex items-center gap-2 px-2 py-1 rounded-md text-xs font-medium text-blue-500">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>{processingIndicator}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || sessionState.isProcessing || isTyping}
                className={`px-3 py-1.5 rounded-md ${
                  !message.trim() || sessionState.isProcessing || isTyping
                    ? 'opacity-50 cursor-not-allowed'
                    : isDark
                      ? 'bg-blue-700/80 text-white hover:bg-blue-700/90'
                      : 'bg-green-800/80 text-white hover:bg-green-800/90'
                } transition-colors duration-200 flex items-center justify-center`}
              >
                <span className="mr-1.5 font-medium text-sm">Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          
          <div className="text-xs px-2 pt-1">
            {isDark ? '└─' : '└─'} Press Enter to send
          </div>
        </div>
      </div>

      {/* Add improved custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar-improved::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        .custom-scrollbar-improved::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 4px;
          margin: 2px;
        }
        
        .custom-scrollbar-improved::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,128,0,0.3)'};
          border-radius: 4px;
        }
        
        .custom-scrollbar-improved::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,128,0,0.5)'};
        }
        
        /* Terminal-inspired text cursor effect for input */
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .agent-chat-cursor::after {
          content: '';
          width: 6px;
          height: 14px;
          background: ${isDark ? '#6ee7b7' : '#4ade80'};
          display: inline-block;
          animation: cursor-blink 1.2s infinite;
          margin-left: 4px;
          vertical-align: middle;
        }
        
        /* Message display animation */
        @keyframes message-appear {
          from { opacity: 0.7; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .message-appear {
          animation: message-appear 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AgentChat;