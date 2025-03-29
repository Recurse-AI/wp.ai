"use client";
import React, { useState, useRef, useEffect } from 'react';
import { motion } from "framer-motion";
import { SiOpenai, SiClaude, SiGooglegemini } from "react-icons/si";
import { FaWordpress } from "react-icons/fa";
import { FiChevronDown } from "react-icons/fi";
import { useTheme } from "@/context/ThemeProvider";
import { setLocalStorageItem, getLocalStorageItem } from '@/lib/utils/localStorage';

// AI Provider configuration
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

interface AIProviderSelectProps {
  className?: string;
  onModelChange?: (settings: { provider: string; model: string }) => void;
  disabled?: boolean;
}

const AIProviderSelect: React.FC<AIProviderSelectProps> = ({ className, onModelChange, disabled = false }) => {
  const { theme } = useTheme();
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const [currentProvider, setCurrentProvider] = useState(AI_PROVIDERS[0]);
  const [currentModel, setCurrentModel] = useState(AI_PROVIDERS[0].models[0]);
  
  const aiButtonRef = useRef<HTMLButtonElement>(null);
  const aiDropdownRef = useRef<HTMLDivElement>(null);

  // Load saved AI model preferences on component mount
  useEffect(() => {
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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        aiDropdownRef.current &&
        !aiDropdownRef.current.contains(event.target as Node) &&
        aiButtonRef.current &&
        !aiButtonRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowAIDropdown(false), 100);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle model selection
  const handleModelSelection = (provider: typeof AI_PROVIDERS[0], model: typeof AI_PROVIDERS[0]['models'][0]) => {
    setCurrentProvider(provider);
    setCurrentModel(model);
    setShowAIDropdown(false);
    
    const modelSettings = {provider: provider.id, model: model.id};
    
    // Save selection to localStorage
    setLocalStorageItem('selectedAIModel', modelSettings);
    
    // Also update the chat service directly if callback is provided
    if (onModelChange) {
      onModelChange(modelSettings);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={aiButtonRef}
        onClick={() => !disabled && setShowAIDropdown(!showAIDropdown)}
        disabled={disabled}
        className={`flex items-center gap-1 font-medium tracking-wide px-2 py-1.5 rounded-lg text-xs duration-300
          ${
            theme === "dark"
              ? "bg-gray-700/60 text-white hover:bg-gray-700/70"
              : "bg-white text-gray-800 hover:bg-gray-100"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div className="flex items-center gap-1.5">
          {currentProvider.id === 'openai' && <SiOpenai className="text-sm" />}
          {currentProvider.id === 'anthropic' && <SiClaude className="text-sm" />}
          {currentProvider.id === 'google' && <SiGooglegemini className="text-sm" />}
          {currentProvider.id === 'qwen' && <SiClaude className="text-sm" />}
          {currentProvider.id === 'deepseek' && <SiClaude className="text-sm" />}
          <span>{currentModel.name}</span>
          <FiChevronDown className="text-xs" />
        </div>
      </button>

      {/* AI Provider Dropdown - Now opens upward with scrolling */}
      {showAIDropdown && (
        <motion.div
          ref={aiDropdownRef}
          className="absolute right-0 bottom-full mb-1 w-60 max-h-64 overflow-y-auto bg-white/95 dark:bg-gray-700/95 rounded-lg shadow-lg z-50 backdrop-blur-sm border border-gray-200 dark:border-gray-600 scrollbar-hide"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
          }}
        >
          <style jsx global>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="sticky top-0 p-2 border-b border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-700/95 z-10">
            <h3 className="text-xs font-medium">Select AI Provider & Model</h3>
          </div>
          
          {AI_PROVIDERS.map((provider) => (
            <div key={provider.id} className="border-b border-gray-200 dark:border-gray-600 last:border-0">
              <div className="flex items-center gap-2 px-3 py-1.5 font-medium bg-gray-50/80 dark:bg-gray-700/80 text-xs sticky top-9 z-10">
                {provider.id === 'openai' && <SiOpenai className="text-sm" />}
                {provider.id === 'anthropic' && <SiClaude className="text-sm" />}
                {provider.id === 'google' && <SiGooglegemini className="text-sm" />}
                {provider.id === 'qwen' && <SiClaude className="text-sm" />}
                {provider.id === 'deepseek' && <SiClaude className="text-sm" />}
                <span>{provider.name}</span>
              </div>
              <div className="pl-3">
                {provider.models.map((model) => (
                  <div 
                    key={model.id} 
                    className={`flex items-center justify-between py-1.5 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                      currentProvider.id === provider.id && currentModel.id === model.id
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : ''
                    }`}
                    onClick={() => handleModelSelection(provider, model)}
                  >
                    <span className="text-xs">{model.name}</span>
                    {model.wpOptimized && (
                      <span className="flex items-center text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                        <FaWordpress className="mr-0.5 text-[8px]" /> Optimized
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default AIProviderSelect; 