"use client";
import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";
import Message from "@/components/chat-comp/Message";
import { SendHorizontal, Database, Globe, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip } from 'react-tooltip';
import toast from "react-hot-toast";
import { getToastStyle } from "@/lib/toastConfig";
import { FiChevronDown, FiRefreshCw } from "react-icons/fi";
import { SiOpenai, SiClaude, SiGooglegemini } from "react-icons/si";
import { FaWordpress } from "react-icons/fa";
import { ChatMessage, ChatResponse } from "@/lib/types/chat";
import { setLocalStorageItem, getLocalStorageItem } from '@/lib/utils/localStorage';
import { useStreaming } from "@/context/MessageStateContext";

// AI Provider configuration - same as layout.tsx for consistency
const AI_PROVIDERS = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    icon: SiOpenai,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', wpOptimized: true },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', wpOptimized: false },
      { id: 'gpt-4', name: 'GPT-4', wpOptimized: true },
      { id: 'gpt-o1', name: 'GPT-o1', wpOptimized: true }
    ]
  },
  { 
    id: 'anthropic', 
    name: 'Claude',
    icon: SiClaude,
    models: [
      { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', wpOptimized: true },
      { id: 'claude-3-7-sonnet-thinking', name: 'Claude 3.7 Sonnet (Thinking)', wpOptimized: true },
      { id: 'claude-3-5-sonnet-v2', name: 'Claude 3.5 Sonnet v2', wpOptimized: true },
      { id: 'claude-3-5-haiku', name: 'Claude 3.5 Haiku', wpOptimized: false },
      { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', wpOptimized: true },
      { id: 'claude-3-opus', name: 'Claude 3 Opus', wpOptimized: true }
    ]
  },
  { 
    id: 'google', 
    name: 'Google Gemini',
    icon: SiGooglegemini,
    models: [
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', wpOptimized: true },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', wpOptimized: false },
      { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', wpOptimized: false }
    ]
  },
  {
    id: 'qwen',
    name: 'Qwen',
    icon: SiClaude, // Replace with appropriate icon if available
    models: [
      { id: 'qwen-max', name: 'Qwen Max', wpOptimized: false }
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: SiClaude, // Replace with appropriate icon if available
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', wpOptimized: false }
    ]
  }
];

interface DefaultChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<ChatResponse>;
  onRegenerateMessage?: () => Promise<ChatResponse>;
  onUpdateSettings?: (settings: { provider: string; model: string }) => void;
  webSearchEnabled?: boolean;
  onWebSearchToggle?: (enabled: boolean) => void;
  isLoading?: boolean;
}


const DefaultChatInterface: React.FC<DefaultChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onRegenerateMessage,
  onUpdateSettings,
  webSearchEnabled,
  onWebSearchToggle,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [embeddingEnabled, setEmbeddingEnabled] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [currentProvider, setCurrentProvider] = useState(AI_PROVIDERS[0]);
  const [currentModel, setCurrentModel] = useState(AI_PROVIDERS[0].models[0]);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [newMessageAdded, setNewMessageAdded] = useState(false);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const { id: messageId } = useStreaming();
  const [startFresh, setStartFresh] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const modelButtonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const outerContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Tooltip refs
  const [tooltipsReady, setTooltipsReady] = useState(false);
  
  // Initialize tooltips after component is mounted
  useEffect(() => {
    // Only set tooltip ready state once after mount
    setTooltipsReady(true);
    
    // Cleanup function - don't set state during unmount
    return () => {
      // Don't set state on unmount as this can cause issues
      // setTooltipsReady(false); // Removing this line
    };
  }, []);

  // Simplified message detection - removing complex animation logic
  useEffect(() => {
    if (messages && messages.length > prevMessagesLength) {
      // Auto-scroll to bottom when new message is added
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
    
    // Update previous messages length
    setPrevMessagesLength(messages?.length || 0);
  }, [messages, prevMessagesLength]);

  // Simplified scroll button detection
  useEffect(() => {
    const handleScroll = () => {
      const messagesContainer = messagesContainerRef.current;
      if (messagesContainer) {
        const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
        setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
      }
    };

    const messagesContainer = messagesContainerRef.current;
    messagesContainer?.addEventListener('scroll', handleScroll);
    return () => {
      messagesContainer?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Simplified scroll to bottom function
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Load saved preferences
  useEffect(() => {
    // Load KB state
    const savedEmbeddingEnabled = localStorage.getItem('embeddingEnabled') === 'true';
    if (savedEmbeddingEnabled) {
      setEmbeddingEnabled(true);
    }
    
    // Load web search preference
    const savedWebSearchEnabled = localStorage.getItem('webSearchEnabled') === 'true';
    if (savedWebSearchEnabled && onWebSearchToggle) {
      onWebSearchToggle(savedWebSearchEnabled);
    }
    
    // Load saved AI model preferences
    const savedModel = getLocalStorageItem('selectedAIModel', null);
    if (savedModel) {
      try {
        const { provider: providerId, model: modelId } = savedModel;
        const providerObj = AI_PROVIDERS.find(p => p.id === providerId);
        if (providerObj) {
          setCurrentProvider(providerObj);
          const modelObj = providerObj.models.find(m => m.id === modelId);
          if (modelObj) setCurrentModel(modelObj);
        }
      } catch (e) {
        console.error("Error loading saved model", e);
      }
    }
  }, []);

  // Update the textarea resizing logic for the spacer-based layout
  useEffect(() => {
    // Function to resize textarea based on content
    const resizeTextarea = () => {
      if (textareaRef.current) {
        // Reset height to auto to get the correct scrollHeight
        textareaRef.current.style.height = 'auto';
        
        // Check if content would exceed maxHeight
        const scrollHeight = textareaRef.current.scrollHeight;
        const maxHeight = 150; // same as the maxHeight in style
        
        if (scrollHeight > maxHeight) {
          // Content exceeds maxHeight, add scrolling class
          textareaRef.current.classList.add('overflowing');
          textareaRef.current.style.height = `${maxHeight}px`;
          textareaRef.current.style.overflowY = 'auto';
          textareaRef.current.style.overflowX = 'hidden';
          textareaRef.current.style.marginBottom = '-10px';
          if (outerContainerRef.current) {
            outerContainerRef.current.style.height = `200px`;
          }
        } else {
          // Content fits, remove scrolling class
          textareaRef.current.classList.remove('overflowing');
          textareaRef.current.style.height = `${scrollHeight}px`;
          textareaRef.current.style.overflowY = 'hidden';
          textareaRef.current.style.overflowX = 'hidden';
          textareaRef.current.style.marginBottom = '0px';
          if (outerContainerRef.current) {
            //delete the height
            outerContainerRef.current.style.height = 'auto';
          }
        }
      }
    };
    
    // Resize initially and when message changes
    resizeTextarea();
  }, [message]);

  // Handle input changes - update for new layout
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize will be handled by the useEffect
  };

  // Handle key presses
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (message.trim()) {
        handleSubmit();
      }
    }
  };

  // Toggle KB mode
  const toggleEmbedding = () => {
    const newState = !embeddingEnabled;
    setEmbeddingEnabled(newState);
    localStorage.setItem('embeddingEnabled', newState.toString());
    
    toast.success(
      newState 
        ? "Knowledge base activated" 
        : "Knowledge base deactivated",
      {
        icon: newState ? '🧠' : '🔍',
        style: getToastStyle(theme) as React.CSSProperties,
      }
    );
  };

  // Handle model selection
  const handleModelSelect = (provider: typeof AI_PROVIDERS[0], model: typeof AI_PROVIDERS[0]['models'][0]) => {
    setCurrentProvider(provider);
    setCurrentModel(model);
    setShowModelDropdown(false);
    
    const modelSettings = {provider: provider.id, model: model.id};
    
    // Save selection to localStorage
    setLocalStorageItem('selectedAIModel', modelSettings);
    
    // Also update the chat service directly if it's available
    if (onUpdateSettings) {
      onUpdateSettings({
        provider: provider.id,
        model: model.id,
      });
    }
    
    toast.success(
      `${model.name} model selected`,
      {
        icon: '🤖',
        style: getToastStyle(theme) as React.CSSProperties,
      }
    );
  };

  // Toggle web search
  const toggleWebSearch = () => {
    const newState = !webSearchEnabled;
    
    // If there's an external handler, use it
    if (onWebSearchToggle) {
      onWebSearchToggle(newState);
    }
    
    toast.success(
      newState 
        ? "Web search activated" 
        : "Web search deactivated",
      {
        icon: newState ? '🔍' : '📝',
        style: getToastStyle(theme) as React.CSSProperties,
      }
    );
  };

  // Function to start fresh with simpler implementation
  const startFreshConversation = () => {
    if (messagesContainerRef.current) {
      // Set flag to start fresh
      setStartFresh(true);
      
      // Immediately scroll to top
      messagesContainerRef.current.scrollTop = 0;
      
      // Reset after a delay
      setTimeout(() => {
        setStartFresh(false);
      }, 1000);
    }
  };
  
  // Simplified handle message submission with less scroll behavior
  const handleSubmit = async () => {
    if (!message.trim() || isProcessing) return;
    
    try {
      setIsProcessing(true);
      const text = message;
      setMessage("");
      
      // Simple scroll to bottom
      scrollToBottom();
      
      // Send the message
      await onSendMessage(text);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full items-center">
      {/* Messages Container - The only scrollable part */}
      <div 
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto overflow-x-hidden w-full px-4 pb-8 pt-2 custom-scrollbar flex flex-col ${startFresh ? 'items-start justify-start' : 'items-center'}`}
        style={{ maxWidth: '100%' }}
      >
        <style jsx global>{`
          /* Custom scrollbar styling */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(156, 163, 175, 0.5);
            border-radius: 20px;
            border: 2px solid transparent;
            background-clip: content-box;
          }
          
          /* Message animations - simplified */
          .message-wrapper {
            transition: opacity 0.3s ease-out;
            opacity: 1;
            width: 100%;
            display: flex;
            justify-content: center;
            max-width: 100%;
            position: relative;
          }
          
          /* Basic message container styling */
          .messages-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            max-width: 50rem;
            margin: 0 auto;
            position: relative;
          }
          
          /* Add blank space at the bottom */
          .messages-container::after {
            content: '';
            display: block;
            min-height: 60px;
            width: 100%;
          }
        `}</style>

        {messages && messages.length > 0 && (
          <div className="w-full flex flex-col items-center messages-container">
            {messages.map((msg, index) => (
              <div 
                key={msg.id || `msg-${index}`}
                data-message-id={msg.id || `msg-${index}`}
                className={`message-wrapper ${index === messages.length - 1 ? 'last-message' : ''} ${
                  msg.id === messageId ? 'streaming-message' : ''
                  } animate-fadeIn`}
              >
                <Message 
                  message={msg}
                  onRegenerateMessage={index === messages.length - 1 && msg.role === 'assistant' ? onRegenerateMessage : undefined}
                  isLatestMessage={index === messages.length - 1}
                />
              </div>
            ))}
            
            {/* Add a smaller, more minimal blank space container */}
            <div className="blank-space-container"></div>
          </div>
        )}
      
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area - Fixed at the bottom */}
      <div className="w-full bg-opacity-90 backdrop-blur-sm pt-2 pb-4 mt-auto" >
        <div
          ref={outerContainerRef}
          className={`flex flex-col rounded-xl px-5 py-4 w-full max-w-3xl mx-auto justify-between border ${
          theme === "dark" 
          ? "bg-gray-900/80 border-gray-700 shadow-sm" 
          : "bg-white border-gray-200 shadow-sm"
        } transition-all duration-300 relative hover:border-blue-300 dark:hover:border-blue-700 focus-within:border-blue-400 dark:focus-within:border-blue-600`} >
          
          {/* Simplified scroll to bottom button */}
          {showScrollButton && (
            <div className="absolute -top-12 right-2 z-10">
              <button
                onClick={scrollToBottom}
                className={`p-2 rounded-full shadow-md transition-all duration-200 ${
                  theme === "dark" 
                    ? "bg-gray-800 hover:bg-gray-700 text-gray-300" 
                    : "bg-white hover:bg-gray-100 text-gray-600"
                }`}
                aria-label="Scroll to bottom"
              >
                <FiChevronDown className="w-5 h-5" />
              </button>
            </div>
          )}
          
          {/* Action buttons row - positioned at the top always */}
          <div className="flex justify-between items-center mb-3 relative z-20">
            {/* Model selection dropdown */}
            <div className="relative flex-1" ref={modelDropdownRef}>
              <button
                ref={modelButtonRef}
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className={`flex items-center gap-1 font-medium text-xs px-2 py-1 rounded-lg duration-300 ${
                  theme === "dark"
                    ? "bg-gray-700/60 text-white hover:bg-gray-700/70"
                    : "bg-white text-gray-800 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {currentProvider.id === 'openai' && <SiOpenai className="text-xs" />}
                  {currentProvider.id === 'anthropic' && <SiClaude className="text-xs" />}
                  {currentProvider.id === 'google' && <SiGooglegemini className="text-xs" />}
                  {currentProvider.id === 'qwen' && <SiClaude className="text-xs" />}
                  {currentProvider.id === 'deepseek' && <SiClaude className="text-xs" />}
                  <span>{currentModel.name}</span>
                  <FiChevronDown className="text-xs" />
                </div>
              </button>
              
              {/* Model dropdown - shows above the button */}
              {showModelDropdown && (
                <motion.div
                  className="absolute bottom-full left-0 mb-2 w-56 bg-white/95 dark:bg-gray-700/95 rounded-lg shadow-lg overflow-hidden z-50 backdrop-blur-sm border border-gray-200 dark:border-gray-600"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                    <h3 className="text-xs font-medium">Select AI Provider & Model</h3>
                  </div>
                  
                  <div 
                    className="max-h-60 overflow-y-auto custom-scrollbar" 
                  >
                    {AI_PROVIDERS.map((provider) => (
                      <div key={provider.id} className="border-b border-gray-200 dark:border-gray-600 last:border-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 font-medium bg-gray-50/80 dark:bg-gray-700/80 text-xs sticky top-0">
                          {provider.id === 'openai' && <SiOpenai className="text-xs" />}
                          {provider.id === 'anthropic' && <SiClaude className="text-xs" />}
                          {provider.id === 'google' && <SiGooglegemini className="text-xs" />}
                          {provider.id === 'qwen' && <SiClaude className="text-xs" />}
                          {provider.id === 'deepseek' && <SiClaude className="text-xs" />}
                          <span>{provider.name}</span>
                        </div>
                        <div className="pl-3">
                          {provider.models.map((model) => (
                            <div 
                              key={model.id} 
                              className={`flex items-center justify-between py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                                currentProvider.id === provider.id && currentModel.id === model.id
                                  ? 'bg-blue-50 dark:bg-blue-900/30'
                                  : ''
                              }`}
                              onClick={() => handleModelSelect(provider, model)}
                            >
                              <span className="text-xs">{model.name}</span>
                              {model.wpOptimized && (
                                <span className="flex items-center text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1 py-0.5 rounded-full">
                                  <FaWordpress className="mr-0.5 text-[8px]" /> Optimized
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Action Buttons - Reordered to have Search Web and Thinking first */}
            <div className="flex items-center gap-2" >
              {/* Search Web Button - Now first */}
              <motion.button
                type="button"
                onClick={toggleWebSearch}
                whileTap={{ scale: 0.95 }}
                data-tooltip-id="tooltip-search"
                data-tooltip-content={webSearchEnabled ? "Web Search Active" : "Enable Web Search"}
                className={`flex items-center gap-1.5 justify-center p-1 rounded-lg transition-all relative ${
                  webSearchEnabled 
                    ? "text-purple-500 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
                }`}
              >
                <Globe className={`w-4 h-4 ${webSearchEnabled ? "text-purple-500" : ""}`} strokeWidth={2} />
                <span className={`text-[11px] font-medium ${webSearchEnabled ? "text-purple-600 dark:text-purple-400" : ""}`}>
                  {webSearchEnabled ? "Search On" : "Search Off"}
                </span>
                {webSearchEnabled && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
                )}
              </motion.button>
              {tooltipsReady && <Tooltip id="tooltip-search" place="top" />}
              
              {/* Thinking Mode Button - Added as second */}
              <motion.button
                type="button"
                onClick={() => {
                  // Toggle between thinking models
                  if (currentProvider.id === 'anthropic' && currentModel.id === 'claude-3-7-sonnet') {
                    // Switch from normal to thinking mode
                    handleModelSelect(
                      currentProvider,
                      currentProvider.models.find(m => m.id === 'claude-3-7-sonnet-thinking') || currentModel
                    );
                  } else if (currentProvider.id === 'anthropic' && currentModel.id === 'claude-3-7-sonnet-thinking') {
                    // Switch from thinking mode back to normal
                    const model = currentProvider.models.find(m => m.id === 'claude-3-7-sonnet');
                    if (model) handleModelSelect(currentProvider, model);
                  }
                  // Do nothing if not on a Claude 3.7 model (don't force switch to Sonnet)
                }}
                whileTap={{ scale: 0.95 }}
                data-tooltip-id="tooltip-thinking"
                data-tooltip-content="Toggle Thinking Mode"
                className={`flex items-center gap-1.5 justify-center p-1 rounded-lg transition-all relative ${
                  currentProvider.id === 'anthropic' && currentModel.id === 'claude-3-7-sonnet-thinking'
                    ? "text-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
                }`}
              >
                <FiRefreshCw className={`w-4 h-4 ${
                  currentProvider.id === 'anthropic' && currentModel.id === 'claude-3-7-sonnet-thinking' 
                    ? "text-yellow-500" 
                    : ""
                }`} />
                <span className={`text-[11px] font-medium ${
                  currentProvider.id === 'anthropic' && currentModel.id === 'claude-3-7-sonnet-thinking'
                    ? "text-yellow-600 dark:text-yellow-400" 
                    : ""
                }`}>
                  {currentProvider.id === 'anthropic' && currentModel.id === 'claude-3-7-sonnet-thinking' 
                    ? "Thinking On" 
                    : "Thinking Off"}
                </span>
                {currentProvider.id === 'anthropic' && currentModel.id === 'claude-3-7-sonnet-thinking' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                )}
              </motion.button>
              {tooltipsReady && <Tooltip id="tooltip-thinking" place="top" />}
              
              {/* KB Button - Now last */}
              <motion.button
                type="button"
                onClick={toggleEmbedding}
                whileTap={{ scale: 0.95 }}
                data-tooltip-id="tooltip-embedding"
                data-tooltip-content={embeddingEnabled ? "Knowledge Base Active" : "Enable Knowledge Base"}
                className={`flex items-center gap-1.5 justify-center p-1 rounded-lg transition-all relative ${
                  embeddingEnabled 
                    ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" 
                    : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
                }`}
              >
                <Database className={`w-4 h-4 ${embeddingEnabled ? "text-blue-500" : ""}`} strokeWidth={2} />
                <span className={`text-[11px] font-medium ${embeddingEnabled ? "text-blue-600 dark:text-blue-400" : ""}`}>
                  {embeddingEnabled ? "KB On" : "KB Off"}
                </span>
                {embeddingEnabled && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                )}
              </motion.button>
              {tooltipsReady && <Tooltip id="tooltip-embedding" place="top" />}
            </div>
          </div>
          
          {/* Fixed height container for input area */}
          <div className="relative" style={{ minHeight: '40px', maxHeight: '200px' }}>
            <div className="w-full mt-1 input-container flex flex-col">
              <div className="relative w-full">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me about WordPress plugins, themes, or anything else related to WordPress..."
                  className={`bg-transparent w-full outline-none resize-none rounded-lg px-3 py-3 pr-12
                    font-medium tracking-wide text-base
                    ${theme === "dark" 
                      ? "text-gray-200 placeholder:text-gray-400 border-gray-700" 
                      : "text-gray-800 placeholder:text-gray-500 border-gray-200"
                    }
                    font-sans placeholder:font-medium placeholder:tracking-wide transition-all duration-200 
                    focus:ring-0 focus:border-transparent`}
                  style={{
                    minHeight: "40px",
                    maxHeight: "120px", // Set a reasonable max height for very long messages
                    lineHeight: "24px",
                    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    overflow: 'auto',
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none', /* IE and Edge */
                  }}
                  disabled={isProcessing || isLoading}
                  rows={1}
                />
                
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || isProcessing || isLoading}
                  className={`absolute bottom-3 right-3 p-2 rounded-md transition-colors z-10 ${
                    message.trim() && !isProcessing && !isLoading
                      ? "text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      : "text-gray-400"
                  }`}
                  aria-label="Send message"
                >
                  {isProcessing && isLoading ? (
                    <div className="w-5 h-5 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                  ) : (
                    <SendHorizontal className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-grow" style={{ minHeight: '8px' }}></div>
      </div>
    </div>
  );
};

export default DefaultChatInterface;