"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { Send } from 'lucide-react';
import ScrollableMessageContainer from './ScrollableMessageContainer';
import { toast } from 'react-hot-toast';
import { FiMessageSquare } from 'react-icons/fi';
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
import { FaRobot, FaUser, FaSpinner, FaLightbulb } from 'react-icons/fa';
import { websocketService } from '../../utils/websocketService';

// Extend the ReactMarkdown types to include inline property
declare module 'react-markdown' {
  interface CodeProps {
    inline?: boolean;
  }
}

// Update AgentChatProps and related types
interface AgentChatProps {
  sessionState: {
    messages: any[];
    files: Record<string, any>;
    isProcessing: boolean;
    id?: string;
    selectedService?: {
      title?: string;
      description?: string;
      example?: string;
    };
  };
  onSendMessage: (message: string) => Promise<boolean>;
  processingFilePath?: string | null;
  hideCodeInMessages?: boolean;
  setSessionState?: React.Dispatch<React.SetStateAction<any>>;
}

// Type definition for messages
interface AgentMessage {
  id?: string;
  role: string;
  content: string;
  timestamp: Date | string;
  codeBlocks?: any[];
  thinking?: string | null;
  status?: string;
}

const AgentChat: React.FC<AgentChatProps> = ({
  sessionState,
  onSendMessage,
  processingFilePath,
  hideCodeInMessages = false,
  setSessionState
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
  
  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '0px';
      const maxHeight = isMobile ? 120 : 180;
      const newHeight = Math.min(textarea.scrollHeight, maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = newHeight === maxHeight ? 'auto' : 'hidden';
    }
  };
  
  // Readjust textarea when mobile state changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [isMobile, message]);
  
  // Focus input when conversation is empty
  useEffect(() => {
    if (sessionState.messages.length === 0 && textareaRef.current && !isMobile) {
      textareaRef.current.focus();
    }
  }, [sessionState.messages.length, isMobile, message]);
  
  // Handle input change
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
  
  // Helper functions to extract information from message
  const extractNameFromMessage = (message: string): string | null => {
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
    const templateTypes = ['blank', 'basic', 'settings_page', 'shortcode', 'custom_post_type', 'dashboard_widget', 'ecommerce', 'blog', 'portfolio'];
    
    for (const type of templateTypes) {
      if (message.toLowerCase().includes(type)) {
        return type;
      }
    }
    
    return null;
  };
  
  const extractDescriptionFromMessage = (message: string): string | null => {
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
  
  // Function to process tree structure in user message
  const processTreeStructure = (userMessage: string, treeText: string): boolean => {
    try {
      // Try parsing as JSON first
      try {
        const jsonObj = JSON.parse(treeText);
        if (jsonObj && typeof jsonObj === 'object') {
          const hasFolder = Object.values(jsonObj).some(
            (val: any) => val && val.type === 'folder'
          );
          
          if (hasFolder && sessionState.id) {
            const updatedFiles = { ...sessionState.files, ...jsonObj };
            saveFilesToLocalStorage(sessionState.id, updatedFiles);
            return true;
          }
        }
      } catch (jsonError) {
        console.log('Not a valid JSON structure, falling back to tree parsing');
      }
      
      // Check if this looks like a tree structure
      if (treeText.includes('/') || /[├└─│]/.test(treeText)) {
        const parsedFiles = parseDirectoryTree(treeText);
        
        if (parsedFiles && Object.keys(parsedFiles).length > 0 && sessionState.id) {
          const updatedFiles = { ...(sessionState.files || {}), ...parsedFiles };
          saveFilesToLocalStorage(sessionState.id, updatedFiles);
          return true;
        }
      }
    } catch (error) {
      console.error('Error parsing structure:', error);
    }
    return false;
  }
  
  // Function to send a message to the agent
  const processUserMessage = async (userMessage: string) => {
    if (!userMessage.trim()) return;
    
    setMessage('');
    setIsTyping(true);
    setProcessingIndicator(null);
    
    // Generate a message ID that will be consistent for the client and server
    const messageId = uuidv4();
    
    // Add the user message to the session state immediately
    if (setSessionState) {
      setSessionState((prev: any) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: messageId,
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString(),
            workspace_id: prev.id || null // Add workspace_id to user messages
          }
        ],
        isProcessing: true
      }));
    }
    
    // Check for manual file structure commands
    if (userMessage.toLowerCase().includes('/parse-tree') || 
        userMessage.toLowerCase().includes('/parse structure')) {
      try {
        const treeMatch = userMessage.match(/```([\s\S]+?)```/);
        if (treeMatch && treeMatch[1]) {
          if (processTreeStructure(userMessage, treeMatch[1])) {
            setIsTyping(false);
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing structure:', error);
      }
    }
    
    try {
      // Check for specific command patterns
      const lowerMessage = userMessage.toLowerCase();
      
      // Create workspace command
      if (lowerMessage.includes('create workspace') || lowerMessage.includes('new workspace')) {
        const workspaceName = extractNameFromMessage(userMessage) || 'New Workspace';
        websocketService.send(JSON.stringify({
          type: 'create_workspace',
          name: workspaceName
        }));
        return;
      }
      
      // Plugin template command
      if (lowerMessage.includes('plugin template') || lowerMessage.includes('create plugin')) {
        const templateType = extractTemplateType(userMessage) || 'basic';
        const pluginName = extractNameFromMessage(userMessage) || 'New Plugin';
        const description = extractDescriptionFromMessage(userMessage) || 'Plugin created from chat';
        
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
      
      // Theme template command
      if (lowerMessage.includes('theme template') || lowerMessage.includes('create theme')) {
        const templateType = extractTemplateType(userMessage) || 'basic';
        const themeName = extractNameFromMessage(userMessage) || 'New Theme';
        const description = extractDescriptionFromMessage(userMessage) || 'Theme created from chat';
        
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
      console.log("Sending query_agent message:", userMessage);
      const sent = websocketService.send(JSON.stringify({
        type: 'query_agent',
        query: userMessage,
        workspace_id: sessionState.id || undefined,  // Include workspace ID
        message_id: messageId,  // Send the generated message ID
        timestamp: new Date().toISOString()  // Add timestamp
      }));
      console.log("Message sent successfully:", sent);
    } catch (error) {
      console.error('Error processing message:', error);
      setIsTyping(false);
      setProcessingIndicator(null);
      
      toast.error('Failed to process your message. Check that the backend server is properly configured.', {
        duration: 5000
      });
      
      // If onSendMessage is available, use as fallback
      if (typeof onSendMessage === 'function') {
        await onSendMessage(userMessage);
      }
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
    
    const parts = path.split('/');
    const fileName = parts.pop() || "";
    const directory = parts.join('/');
    
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

  // Enhanced send message function
  const handleSendMessage = async () => {
    if (!message.trim() || sessionState.isProcessing || isTyping) return;
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
    
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

  // Reset processing states
  const resetProcessingState = () => {
    setCurrentResponse(null);
    setCurrentThinking(null);
    setProcessingIndicator(null);
    setIsTyping(false);
  };

  // Process files from messages
  const processFilesFromMessage = (content: string) => {
    if (sessionState.id) {
      // Start with current files
      let updatedFiles = { ...(sessionState.files || {}) };
      
      // Apply each extraction function in sequence
      const extractionFunctions = [
        (content: string) => extractJSONStructureFromContent(content) || {},
        (content: string) => extractTextTreeFormat(content) || {},
        extractFormattedStructureFromChat,
        (content: string) => extractFileTreeFromContent(content, updatedFiles),
        extractFilesFromMessage,
        (content: string) => extractWordPressPlugin(content, updatedFiles)
      ];
      
      // Process with each extraction method
      extractionFunctions.forEach(extractFn => {
        try {
          const result = extractFn(content);
          if (result && typeof result === 'object' && Object.keys(result).length > 0) {
            updatedFiles = { ...updatedFiles, ...result };
          }
        } catch (error) {
          console.error(`Error in extraction function:`, error);
        }
      });
      
      // Only save if we found files to save
      if (Object.keys(updatedFiles).length > 0) {
        saveFilesToLocalStorage(sessionState.id, updatedFiles);
      }
    }
  };

  // Add a handler for the accumulated stream complete event
  const handleStreamComplete = (data: any) => {
    console.log('Stream complete event:', data);
    
    if (data && data.content && setSessionState) {
      // Generate a stable ID for this message
      const messageId = data.message_id || uuidv4();
      
      // Determine the role based on content_type
      const role = data.content_type === 'thinking' ? 'thinking' : 'assistant';
      
      // When a complete stream is received, add it as a single message
      setSessionState((prev: any) => {
        // Check if this message already exists to avoid duplicates
        const messageExists = prev.messages.some((msg: any) => 
          msg.id === messageId || 
          (msg.role === role && msg.content === data.content)
        );
        
        if (messageExists) return prev;
        
        // Create a new message from the accumulated stream content
        const newMessage = {
          id: messageId,
          role: role,
          content: data.content,
          timestamp: data.timestamp || new Date().toISOString(),
          // For assistant messages, include thinking content
          ...(role === 'assistant' && { thinking: currentThinking }),
          status: 'completed',
          // Include workspace ID for tracking
          workspace_id: data.workspace_id || prev.id || null
        };
        
        // Filter out any existing fragments of this same response
        const filteredMessages = prev.messages.filter((msg: any) => {
          // Keep messages that aren't fragments of this message
          if (msg.role === role && new Date(msg.timestamp).getTime() > Date.now() - 10000) {
            return !data.content.includes(msg.content);
          }
          return true;
        });
        
        return {
          ...prev,
          messages: [...filteredMessages, newMessage],
          isProcessing: false
        };
      });
      
      // For assistant messages, process files
      if (role === 'assistant') {
        processFilesFromMessage(data.content);
        resetProcessingState();
      } else if (role === 'thinking') {
        // For thinking, just store the content but don't reset entirely
        setCurrentThinking(data.content);
      }
    }
  };

  // Setup WebSocket listeners
  useEffect(() => {
    // Handle agent responses
    const handleAgentResponse = (data: any) => {
      resetProcessingState();
      
      // Process completed responses for file extraction
      if (data.status === 'completed' && data.content) {
        processFilesFromMessage(data.content);
      }
    };
    
    // Handle new message events (especially important for assistant responses)
    const handleNewMessage = (data: any) => {
      console.log('Handling new_message event:', data);
      
      // If this is a user message but we already have it in the state, skip
      if (data.sender === 'user' && setSessionState) {
        const messageExists = sessionState.messages.some((msg: any) => 
          msg.id === data.message_id || 
          (msg.role === 'user' && msg.content === data.text && 
           new Date(msg.timestamp).getTime() > Date.now() - 10000)
        );
        
        if (messageExists) {
          console.log('User message already exists in state, skipping');
          return;
        }
      }
      
      // When receiving a new message, reset any current streaming state
      if (data.sender === 'assistant') {
        // For assistant messages, keep any accumulated content but add complete message to state
        if (setSessionState && data.text) {
          setSessionState((prev: any) => {
            // Check if message already exists to avoid duplicates
            const messageExists = prev.messages.some((msg: any) => 
              msg.id === data.message_id || 
              (msg.role === 'assistant' && msg.content === data.text && 
               new Date(msg.timestamp).getTime() > Date.now() - 10000)
            );
            
            if (messageExists) return prev;
            
            // Create a new message object with workspace_id included
            const newMessage = {
              id: data.message_id || uuidv4(),
              role: 'assistant',
              content: data.text,
              timestamp: data.timestamp || new Date().toISOString(),
              thinking: currentThinking, // Add any thinking we've accumulated
              status: 'completed',
              workspace_id: data.workspace_id || sessionState.id || null // Track workspace ID
            };
            
            return {
              ...prev,
              messages: [...prev.messages, newMessage],
              isProcessing: false
            };
          });
          
          // Process files from this message
          processFilesFromMessage(data.text);
        }
        
        // Reset streaming state but preserve thinking content
        setCurrentResponse(null);
        setProcessingIndicator(null);
        setIsTyping(false);
      } else {
        // For non-assistant messages, reset all state
        resetProcessingState();
      }
    };
    
    // Handle API errors
    const handleApiError = (data: any) => {
      console.error("AI Error:", data);
      resetProcessingState();
      
      // Extract error message
      let errorMessage = "An error occurred with the AI service. Please try again.";
      
      // Check if it's a model-related error
      if (data.error && typeof data.error === 'string') {
        if (data.error.includes("Model") && data.error.includes("not found")) {
          errorMessage = data.error;
        } else {
          errorMessage = data.error || data.message || errorMessage;
        }
      } else if (data.message) {
        errorMessage = data.message;
      }
      
      // Create an error message to display
      setCurrentResponse(null);
      setCurrentThinking(null);
      setCurrentResponse(`Error: ${errorMessage}`);
      
      toast.error(errorMessage, { duration: 5000 });
    };
    
    // Handle tool results
    const handleToolResult = resetProcessingState;
    const handleWorkspaceHistory = resetProcessingState;
    const handleWorkspaceCreated = resetProcessingState;
    
    // Handle thinking updates
    const handleThinkingUpdate = (data: any) => {
      if (data && data.thinking) {
        setCurrentThinking(data.thinking);
      }
    };
    
    // Handle text updates
    const handleTextUpdate = (data: any) => {
      if (data && data.text) {
        setCurrentResponse(data.text);
        
        // If the processing path changes during a response
        if (data.processing_file) {
          const formattedPath = formatFilePath(data.processing_file);
          setProcessingIndicator(formattedPath.fullPath);
        }
      }
    };
    
    // Handler for block_start events
    const handleBlockStart = (data: any) => {
      console.log('Block start event:', data);
      // If we're starting a thinking block, initialize the thinking state
      if (data.content_type === 'thinking') {
        setCurrentThinking(''); // Initialize with empty string
        setIsTyping(true);
      }
      // If we're starting a text block, initialize the response state
      else if (data.content_type === 'text') {
        setCurrentResponse(''); // Initialize with empty string
        setIsTyping(true);
      }
    };
    
    // Handler for block_stop events
    const handleBlockStop = (data: any) => {
      console.log('Block stop event:', data);
      // We don't need to do anything special here, just log it
    };
    
    // Handler for thinking content
    const handleThinking = (data: any) => {
      console.log('Thinking content:', data);
      if (data && data.content) {
        // Append to current thinking content
        setCurrentThinking((prev) => {
          return prev ? prev + data.content : data.content;
        });
      }
    };
    
    // Handler for text content
    const handleText = (data: any) => {
      console.log('Text content:', data);
      if (data && data.content) {
        // Append to current response content
        setCurrentResponse((prev) => {
          const updatedContent = prev ? prev + data.content : data.content;
          console.log('Updated accumulated text:', updatedContent.substring(0, 50) + (updatedContent.length > 50 ? '...' : ''));
          return updatedContent;
        });
      }
    };
    
    // Handler for complete message
    const handleComplete = (data: any) => {
      console.log('Complete event:', data);
      
      // When we receive the complete event, add the built response to the session state
      if (setSessionState && currentResponse) {
        // Generate a stable message ID for this complete response
        const messageId = data.message_id || uuidv4();
        
        setSessionState((prev: any) => {
          // Check if a message with this content already exists
          const messageExists = prev.messages.some((msg: any) => 
            msg.id === messageId || 
            (msg.role === 'assistant' && msg.content === currentResponse)
          );
          
          if (messageExists) return prev;
          
          // Create a new message object for the assistant response
          const newMessage = {
            id: messageId, // Use consistent ID
            role: 'assistant',
            content: currentResponse,
            timestamp: data.timestamp || new Date().toISOString(),
            thinking: currentThinking,
            status: 'completed',
            workspace_id: data.workspace_id || prev.id || null // Add workspace_id to track responses
          };
          
          // Filter out any text fragments that might have been added
          const filteredMessages = prev.messages.filter((msg: any) => {
            if (msg.role === 'assistant' && new Date(msg.timestamp).getTime() > Date.now() - 10000) {
              return !currentResponse.includes(msg.content);
            }
            return true;
          });
          
          return {
            ...prev,
            messages: [...filteredMessages, newMessage],
            isProcessing: false
          };
        });
        
        // Process files after adding message
        if (currentResponse) {
          processFilesFromMessage(currentResponse);
        }
      }
      
      resetProcessingState();
    };
    
    // Add the stream_complete handler
    websocketService.addListener('stream_complete', handleStreamComplete);
    
    // Add all event listeners with handlers that include workspace_id
    websocketService.addListener('agent_response', handleAgentResponse);
    websocketService.addListener('new_message', handleNewMessage);
    websocketService.addListener('ai_error', handleApiError);
    websocketService.addListener('tool_result', handleToolResult);
    websocketService.addListener('workspace_history', handleWorkspaceHistory);
    websocketService.addListener('workspace_created', handleWorkspaceCreated);
    websocketService.addListener('thinking_update', handleThinkingUpdate);
    websocketService.addListener('text_update', handleTextUpdate);
    
    // Add listeners for Anthropic-specific events
    websocketService.addListener('block_start', handleBlockStart);
    websocketService.addListener('block_stop', handleBlockStop);
    websocketService.addListener('thinking', handleThinking);
    websocketService.addListener('text', handleText);
    websocketService.addListener('complete', handleComplete);
    websocketService.addListener('thinking_start', handleBlockStart);
    websocketService.addListener('text_start', handleBlockStart);
    
    // Return cleanup function
    return () => {
      websocketService.removeListener('stream_complete', handleStreamComplete);
      websocketService.removeListener('agent_response', handleAgentResponse);
      websocketService.removeListener('new_message', handleNewMessage);
      websocketService.removeListener('ai_error', handleApiError);
      websocketService.removeListener('tool_result', handleToolResult);
      websocketService.removeListener('workspace_history', handleWorkspaceHistory);
      websocketService.removeListener('workspace_created', handleWorkspaceCreated);
      websocketService.removeListener('thinking_update', handleThinkingUpdate);
      websocketService.removeListener('text_update', handleTextUpdate);
      
      // Remove Anthropic-specific event listeners
      websocketService.removeListener('block_start', handleBlockStart);
      websocketService.removeListener('block_stop', handleBlockStop);
      websocketService.removeListener('thinking', handleThinking);
      websocketService.removeListener('text', handleText);
      websocketService.removeListener('complete', handleComplete);
      websocketService.removeListener('thinking_start', handleBlockStart);
      websocketService.removeListener('text_start', handleBlockStart);
    };
  }, [sessionState?.id]);

  // Process latest message for file extraction
  useEffect(() => {
    if (sessionState.messages && sessionState.messages.length > 0) {
      const latestMessage = sessionState.messages[sessionState.messages.length - 1];
      
      if (latestMessage && 
          latestMessage.role === 'assistant' && 
          latestMessage.status === 'completed' && 
          latestMessage.content) {
        processFilesFromMessage(latestMessage.content);
      }
    }
  }, [sessionState.messages, sessionState.id, sessionState.files]);

  // Add the stream_complete handler
  useEffect(() => {
    const debugHandler = (data: any) => {
      console.log('SESSION STATE:', sessionState);
    };
    
    // Debug current session state when messages change
    if (sessionState.messages.length > 0) {
      console.log(`Current message count: ${sessionState.messages.length}`, 
        sessionState.messages.map(m => `${m.role}:${m.id?.substring(0, 6) || 'no-id'}`));
    }
    
    // For stream_complete events, log even more info
    const streamCompleteDebug = (data: any) => {
      console.log('STREAM COMPLETE EVENT RECEIVED:', data);
      console.log('Current response:', currentResponse?.substring(0, 50) + (currentResponse && currentResponse.length > 50 ? '...' : ''));
      console.log('Current thinking:', currentThinking?.substring(0, 50) + (currentThinking && currentThinking.length > 50 ? '...' : ''));
    };
    
    websocketService.addListener('stream_complete', streamCompleteDebug);
    websocketService.addListener('message_event_debug', debugHandler);
    
    return () => {
      websocketService.removeListener('stream_complete', streamCompleteDebug);
      websocketService.removeListener('message_event_debug', debugHandler);
    };
  }, [sessionState.messages, currentResponse, currentThinking]);

  return (
    <div className="flex flex-col h-full overflow-hidden font-mono" style={{ 
      height: '100%', 
      maxHeight: '100vh'
    }}>
      {/* Header */}
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
      
      {/* Message Container */}
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
        maxHeight="calc(95vh - 160px)"
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
      
      {/* Input area */}
      <div className={`p-2 sm:p-4 transition-all flex-shrink-0 ${
        isDark ? 'bg-gray-900' : 'bg-black'
      }`}
      style={{ 
        maxHeight: '180px',
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

      {/* Styles */}
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