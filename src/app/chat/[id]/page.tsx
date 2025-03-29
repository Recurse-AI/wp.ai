/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, use, useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeProvider";
import DefaultChatInterface from "@/components/chat-comp/DefaultChatInterface";
import toast from "react-hot-toast";
import { getToastStyle } from "@/lib/toastConfig";
// import { ChatProvider, ChatModel } from "@/lib/services/chatConfig";
import { useRouter } from "next/navigation";
import { useChatSocket } from "@/context/ChatSocketContext";

interface Props {
  params: Promise<{ id: string }>;
}

 // Define model settings interface
 interface ModelSettings {
  provider?: string;
  model?: string;
  doWebSearch?: boolean;
  doVectorSearch?: boolean;
  extended_thinking?: boolean;
  extended_thinking_budget?: number;
}

const ChatPage = ({ params }: Props) => {
  const { theme } = useTheme();
  const { id } = use(params);
  const [loading, setLoading] = useState(false);
  const { connected, connecting, connect, sendMessage } = useChatSocket();
  
  // Create the ref at component level, not inside useEffect
  const isInitialMount = useRef(true);

  // Local state
  const [doWebSearch, setDoWebSearch] = useState(false);
  const [doVectorSearch, setDoVectorSearch] = useState(false);
  const [hasSentPendingMessage, setHasSentPendingMessage] = useState(false);
  const [settings, setSettings] = useState<ModelSettings>({
    provider: 'openai',
    model: 'gpt-4o-mini',
    doWebSearch: false,
    doVectorSearch: false,
    extended_thinking: false,
    extended_thinking_budget: 1024,
  });

  // Send a new message
  const handleSendMessage = async (content: string, modelSettings: ModelSettings = {}) => {
    if (!content.trim() || loading) return;
    
    try {
      setLoading(true);
      
      // Always use the most current settings
      const currentSettings = { ...settings, ...modelSettings };
      
      // Prepare message payload
      const provider = currentSettings.provider;
      let model = currentSettings.model;
      
      // Configure thinking parameters for Claude 3.7 Sonnet
      let extendedThinking = currentSettings.extended_thinking;
      let extendedThinkingBudget = currentSettings.extended_thinking_budget;
      
      // Special handling for claude-3-7-sonnet-thinking
      if (model === 'claude-3-7-sonnet-thinking') {
        extendedThinking = true;
        extendedThinkingBudget = 1024;
        // Use the base model name for the API
        model = 'claude-3-7-sonnet';
      } else if (provider === 'anthropic' && model === 'claude-3-7-sonnet') {
        // For regular Claude 3.7, explicitly set thinking to false if not specified
        extendedThinking = extendedThinking ?? false;
        extendedThinkingBudget = extendedThinkingBudget ?? 1024;
      }
      
      // Prepare the message payload
      const messagePayload: any = {
        message: content,
        do_web_search: currentSettings.doWebSearch,
        do_vector_search: currentSettings.doVectorSearch,
        provider_name: provider,
        model_name: model === 'default' ? 'gpt-4o-mini' : model,
        temperature: provider === 'anthropic' && extendedThinking ? 1.0 : 0.7,
        max_tokens: extendedThinking ? 2048 : 1024,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: null
      };
      
      // Add extended thinking parameters for Anthropic models
      if (provider === 'anthropic' && model === 'claude-3-7-sonnet') {
        messagePayload.extended_thinking = extendedThinking;
        messagePayload.extended_thinking_budget = extendedThinkingBudget;
      }
      
      // Check if we need to connect first
      if (!connected && !connecting) {
        console.log('Not connected, attempting to connect before sending message');
        
        // Connect with the current conversation ID
        connect(id);
        
        // Even without waiting for the connection, we can still send
        // the message as it will be queued by the ChatSocketContext
        console.log('Sending message (will be queued until connected)');
      } else {
        console.log('Sending message through WebSocket...');
      }
      
      console.log('Model settings:', { provider, model, doWebSearch: currentSettings.doWebSearch, doVectorSearch: currentSettings.doVectorSearch, extendedThinking, extendedThinkingBudget });
      
      // Try to send the message, even if not connected (will be queued)
      const success = await sendMessage(messagePayload);
      
      if (!success) {
        // If sendMessage returns false, it means a direct send failed (not queued)
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Error sending message", getToastStyle(theme));
    } finally {
      setLoading(false);
    }
  };

  // Connection effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      
      // Only connect if not already connected to this conversation
      if (!connected && id) {
        console.log("Chat page: Connecting to WebSocket...");
        connect(id);
      }
    }
    
    // No need to reset isInitialMount in cleanup since the ref persists
  }, [connected, id, connect]);

  // Handle pending message from localStorage
  useEffect(() => {
    // Only proceed if connected and we haven't sent the pending message yet
    if (connected && !hasSentPendingMessage) {
      const pendingMessage = localStorage.getItem('pendingChatMessage');
      const pendingChatModelStr = localStorage.getItem('pendingChatModel');
      
      // If we have a pending message to send, send it
      if (pendingMessage && pendingMessage.trim()) {
        console.log('Found pending chat message in localStorage, processing...');
        
        // Immediately mark as sent to prevent reprocessing in case of state changes
        setHasSentPendingMessage(true);
        
        // Immediately remove from localStorage to prevent retrieving it later
        localStorage.removeItem('pendingChatMessage');
        localStorage.removeItem('pendingChatModel');

        // Ensure we have settings for the message
        try {
          // Parse model settings if available
          const modelSettings = pendingChatModelStr ? JSON.parse(pendingChatModelStr) : {};
          handleSendMessage(pendingMessage, {
            provider: modelSettings.provider || settings.provider,
            model: modelSettings.model || settings.model,
            doWebSearch: modelSettings.doWebSearch !== undefined ? modelSettings.doWebSearch : settings.doWebSearch,
            doVectorSearch: modelSettings.doVectorSearch !== undefined ? modelSettings.doVectorSearch : settings.doVectorSearch,
          });
           
        } catch (error) {
          console.error('Error processing pending chat message:', error);
        }
      }
    }
  }, [connected, hasSentPendingMessage, handleSendMessage, settings]);

  // Add this to the useEffect hooks that initialize state
  useEffect(() => {
    // Check saved search preferences
    const savedWebSearchEnabled = localStorage.getItem('webSearchEnabled') === 'true';
    const savedVectorSearchEnabled = localStorage.getItem('vectorSearchEnabled') === 'true';
    
    // Get model settings from localStorage
    const savedAIModelString = localStorage.getItem('selectedAIModel');
    
    if (savedAIModelString) {
      try {
        // Parse the saved model settings
        const savedAIModel = JSON.parse(savedAIModelString);
        
        // Update settings with all saved preferences
        setSettings(prevSettings => {
          const updatedSettings = {
            ...prevSettings,
            provider: savedAIModel.provider,
            model: savedAIModel.model,
            doWebSearch: savedWebSearchEnabled,
            doVectorSearch: savedVectorSearchEnabled,
          };
          
          // Special handling for Claude 3.7 Sonnet thinking mode
          if (savedAIModel.model === 'claude-3-7-sonnet-thinking') {
            updatedSettings.extended_thinking = true;
            updatedSettings.extended_thinking_budget = 1024;
          } else if (savedAIModel.provider === 'anthropic' && savedAIModel.model === 'claude-3-7-sonnet') {
            updatedSettings.extended_thinking = false;
            updatedSettings.extended_thinking_budget = 1024;
          }
          
          console.log('Loaded settings from localStorage:', updatedSettings);
          return updatedSettings;
        });
      } catch (e) {
        console.error('Error parsing savedAIModel:', e);
      }
    }
    
    // Update UI toggles
    if (savedWebSearchEnabled) {
      setDoWebSearch(true);
    }
    
    if (savedVectorSearchEnabled) {
      setDoVectorSearch(true);
    }
  }, []);

  // Add a function to handle web search toggle from the interface
  const handleWebSearchToggle = (enabled: boolean) => {
    setDoWebSearch(enabled);
    localStorage.setItem('webSearchEnabled', enabled.toString());
    setSettings(prevSettings => ({
      ...prevSettings,
      doWebSearch: enabled
    }));
  };

  // Add a function to handle vector search toggle
  const handleVectorSearchToggle = (enabled: boolean) => {
    setDoVectorSearch(enabled);
    localStorage.setItem('vectorSearchEnabled', enabled.toString());
    setSettings(prevSettings => ({
      ...prevSettings,
      doVectorSearch: enabled
    }));
  };

  const onUpdateSettings = (newModelSettings: { provider: string; model: string }) => {
    console.log('Update settings:', newModelSettings);
    
    // Configure extended thinking based on model selection
    let extended_thinking = false;
    let extended_thinking_budget = 1024;
    
    // If model is the special thinking variant, set appropriate flags
    if (newModelSettings.model === 'claude-3-7-sonnet-thinking') {
      extended_thinking = true;
    }
    
    // Create and store updated settings immediately
    const updatedSettings = {
      provider: newModelSettings.provider,
      model: newModelSettings.model,
      doWebSearch,
      doVectorSearch,
      extended_thinking,
      extended_thinking_budget,
    };
    
    setSettings(updatedSettings);
  };

  useEffect(() => {
    //update settings variable from local storage
    const isWebSearchEnabled = localStorage.getItem('webSearchEnabled') === 'true';
    const isVectorSearchEnabled = localStorage.getItem('vectorSearchEnabled') === 'true';
    setDoWebSearch(isWebSearchEnabled);
    setDoVectorSearch(isVectorSearchEnabled);
    const savedAIModel = localStorage.getItem('selectedAIModel');
    if (savedAIModel) {
      setSettings(prevSettings => ({
        ...prevSettings,
        provider: JSON.parse(savedAIModel).provider,
        model: JSON.parse(savedAIModel).model,
        doWebSearch: isWebSearchEnabled,
        doVectorSearch: isVectorSearchEnabled,
      }));
    } else {
      setSettings(prevSettings => ({
        ...prevSettings,
        doWebSearch: isWebSearchEnabled,
        doVectorSearch: isVectorSearchEnabled,
      }));
    }
  }, []);

  return (
    <div className="relative flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden chat-page">
          <div className="flex-1 overflow-hidden">
            <DefaultChatInterface
              onSendMessage={handleSendMessage}
              onUpdateSettings={onUpdateSettings}
              doWebSearch={doWebSearch}
              doVectorSearch={doVectorSearch}
              handleWebSearchToggle={handleWebSearchToggle}
              handleVectorSearchToggle={handleVectorSearchToggle}
            />
          </div>
    </div>
  );
};

export default ChatPage;