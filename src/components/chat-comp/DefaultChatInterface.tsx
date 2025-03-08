"use client";
import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";
import Message from "@/components/chat-comp/Message";
import { SendHorizontal, Database } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip } from 'react-tooltip';
import toast from "react-hot-toast";
import { getToastStyle } from "@/lib/toastConfig";
import { FiChevronDown } from "react-icons/fi";
import { SiOpenai, SiClaude, SiGooglegemini } from "react-icons/si";
import { FaWordpress } from "react-icons/fa";
import { ChatMessage, ChatResponse } from "@/lib/types/chat";

// AI Provider configuration - same as layout.tsx for consistency
const AI_PROVIDERS = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    icon: SiOpenai,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', wpOptimized: true },
      { id: 'gpt-4', name: 'GPT-4 Turbo', wpOptimized: true },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', wpOptimized: false }
    ]
  },
  { 
    id: 'claude', 
    name: 'Claude',
    icon: SiClaude,
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus', wpOptimized: true },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', wpOptimized: false },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', wpOptimized: false }
    ]
  },
  { 
    id: 'gemini', 
    name: 'Google Gemini',
    icon: SiGooglegemini,
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', wpOptimized: true },
      { id: 'gemini-ultra', name: 'Gemini Ultra', wpOptimized: false }
    ]
  }
];

interface DefaultChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<ChatResponse>;
  onRegenerateMessage?: () => Promise<ChatResponse>;
}

// CSS for hiding scrollbars
const scrollbarHideStyle = {
  scrollbarWidth: 'none' as 'none',  /* Firefox */
  msOverflowStyle: 'none' as 'none',  /* IE and Edge */
  WebkitScrollbar: {
    display: 'none'  /* Chrome, Safari, Opera */
  }
};

const DefaultChatInterface: React.FC<DefaultChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onRegenerateMessage,
}) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [embeddingEnabled, setEmbeddingEnabled] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [currentProvider, setCurrentProvider] = useState(AI_PROVIDERS[0]);
  const [currentModel, setCurrentModel] = useState(AI_PROVIDERS[0].models[0]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const modelButtonRef = useRef<HTMLButtonElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  // Auto-resize effect for textarea (similar to TextAreaInput)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`; // Max 120px
    }
  }, [message]);

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

  // Check for stored preferences
  useEffect(() => {
    // Load KB state
    const savedEmbeddingEnabled = localStorage.getItem('embeddingEnabled') === 'true';
    if (savedEmbeddingEnabled) {
      setEmbeddingEnabled(true);
    }
    
    // Load saved AI model preferences
    const savedModel = localStorage.getItem('selectedAIModel');
    if (savedModel) {
      try {
        const { provider: providerId, model: modelId } = JSON.parse(savedModel);
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

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Handle key press (Enter to submit)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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
    
    // Save selection to localStorage
    localStorage.setItem('selectedAIModel', JSON.stringify({provider: provider.id, model: model.id}));
    
    toast.success(
      `${model.name} model selected`,
      {
        icon: '🤖',
        style: getToastStyle(theme) as React.CSSProperties,
      }
    );
  };

  // Handle message submission
  const handleSubmit = async () => {
    if (!message.trim() || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Store the query in localStorage for potential future use
      const recentQueries = JSON.parse(localStorage.getItem('recentQueries') || '[]');
      recentQueries.unshift({
        query: message,
        timestamp: new Date().toISOString()
      });
      
      // Keep only the 10 most recent queries
      if (recentQueries.length > 10) {
        recentQueries.pop();
      }
      
      localStorage.setItem('recentQueries', JSON.stringify(recentQueries));
      
      // Send the message
      await onSendMessage(message);
      
      // Clear the input
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full overflow-x-hidden">
      {/* Messages Container - Adjusted with more bottom padding */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden w-full px-4 pb-8 custom-scrollbar" 
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
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(156, 163, 175, 0.7);
          }
          
          /* For Firefox */
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
          }
          
          /* Dark mode adjustments */
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(75, 85, 99, 0.5);
          }
          
          .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background-color: rgba(75, 85, 99, 0.7);
          }
          
          .dark .custom-scrollbar {
            scrollbar-color: rgba(75, 85, 99, 0.5) transparent;
          }
        `}</style>

        {messages && messages.length > 0 ? (
          messages.map((msg, index) => (
            <Message 
              key={msg.id || index}
              message={msg}
              onRegenerateMessage={index === messages.length - 1 && msg.role === 'assistant' ? onRegenerateMessage : undefined}
              isLatestMessage={index === messages.length - 1 && msg.role === 'assistant'}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start a conversation!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area - Positioned lower with more spacing */}
      <div className="sticky bottom-0 w-full bg-opacity-90 backdrop-blur-sm pt-2 pb-4">
        <div className={`flex flex-col rounded-xl px-5 py-4 w-full max-w-3xl mx-auto justify-between border ${
          theme === "dark" 
          ? "bg-gray-900/80 border-gray-700 shadow-sm" 
          : "bg-white border-gray-200 shadow-sm"
        } transition-all duration-300 relative hover:border-blue-300 dark:hover:border-blue-700 focus-within:border-blue-400 dark:focus-within:border-blue-600`}>
          {/* Model selection and KB button row */}
          <div className="flex justify-between items-center mb-3">
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
                  {currentProvider.id === 'claude' && <SiClaude className="text-xs" />}
                  {currentProvider.id === 'gemini' && <SiGooglegemini className="text-xs" />}
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
                          {provider.id === 'claude' && <SiClaude className="text-xs" />}
                          {provider.id === 'gemini' && <SiGooglegemini className="text-xs" />}
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
            
            {/* KB Button */}
            <div className="relative ml-2">
              <motion.button
                type="button"
                onClick={toggleEmbedding}
                whileTap={{ scale: 0.95 }}
                data-tooltip-id="tooltip-embedding"
                data-tooltip-content={embeddingEnabled ? "Knowledge Base Active" : "Enable Knowledge Base"}
                className={`flex items-center gap-1.5 justify-center p-1 rounded-lg transition-all ${
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
              <Tooltip id="tooltip-embedding" place="top" />
            </div>
          </div>
          
          {/* Textarea and Send button - Added more bottom margin */}
          <div className="flex items-end w-full mt-2 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className={`bg-transparent w-full outline-none 
                font-medium tracking-wide text-base resize-none overflow-hidden px-3
                ${theme === "dark" 
                  ? "text-gray-200 placeholder:text-gray-400" 
                  : "text-gray-800 placeholder:text-gray-500"
                }
                font-sans placeholder:font-medium placeholder:tracking-wide`}
              style={{
                minHeight: "40px", // Starts at 1 line height
                maxHeight: "120px", // Stops expanding after 5 lines
                height: "40px", // Initial height
                paddingBottom: "16px", // Increased padding at bottom
                paddingTop: "12px", // Added padding at top
                lineHeight: "24px", // Maintain proper line spacing
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                overflow: 'hidden' // Hide scrollbar
              }}
              disabled={isProcessing}
            />
            
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || isProcessing}
              className={`ml-2 p-2 rounded-md transition-colors ${
                message.trim() && !isProcessing
                  ? "text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  : "text-gray-400"
              }`}
              aria-label="Send message"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
              ) : (
                <SendHorizontal className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefaultChatInterface;