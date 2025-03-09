"use client"
import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthProvider";
import useAuth from "@/lib/useAuth";
import TokenManager from "@/lib/tokenManager";
import toast from "react-hot-toast";
import WelcomeHeader from "@/components/chat-comp/input-components/WelcomeHeader";
import ModeToggleButtons from "@/components/chat-comp/input-components/ModeToggleButtons";
import SendButton from "@/components/chat-comp/input-components/SendButton";
import InfoFooter from "@/components/chat-comp/input-components/InfoFooter";
import TextAreaInput from "@/components/chat-comp/TextAreaInput";
import AIProviderSelect from "@/components/chat-comp/input-components/AIProviderSelect";
import { WordPressIcon, BrainIcon } from "@/components/chat-comp/input-components/EnhancedIcons";
import { Zap } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { getToastStyle } from "@/lib/toastConfig";
import { useChatService } from '@/lib/hooks/useChatService';
import { ChatProvider, ChatModel } from '@/lib/services/chatConfig';

const Page = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isLoggedIn } = useAuthContext();
  const [authChecking, setAuthChecking] = useState(true);
  const [agentMode, setAgentMode] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [embeddingEnabled, setEmbeddingEnabled] = useState(false);
  
  // Initialize chat service
  const { updateSettings } = useChatService();
  
  useEffect(() => {
    const checkAuth = async () => {
      const hasToken = !!TokenManager.getToken();
      const hasRefreshToken = !!TokenManager.getRefreshToken();
      const hasUserData = !!localStorage.getItem('userData');
      const hasAuthToken = !!localStorage.getItem('token');

      if (authLoading) {
        console.log("Chat page: Still loading auth state, waiting...");
        return;
      }

      if (isAuthenticated || isLoggedIn || hasToken || hasRefreshToken || hasUserData || hasAuthToken) {
        console.log("Chat page: Authentication confirmed, allowing access");
        setAuthChecking(false);
      } else {
        console.log("Chat page: No valid authentication found, redirecting to signin");
        localStorage.setItem('isChat', 'true');
        router.push('/signin');
      }
    };

    checkAuth();
  }, [isAuthenticated, isLoggedIn, authLoading, user, router]);

  // Handle text input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  // Handle key press events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim()) {
        handleSubmit(e as any);
      }
    }
  };

  // Toggle embedding mode
  const toggleEmbedding = () => {
    setEmbeddingEnabled(!embeddingEnabled);
    toast.success(
      !embeddingEnabled 
        ? "WordPress knowledge base activated" 
        : "WordPress knowledge base deactivated",
      {
        icon: !embeddingEnabled ? '🧠' : '🔍',
      ...getToastStyle(theme)
      }
    );
  };

  // Toggle agent mode - Now toggles the button state immediately
  const toggleAgentMode = () => {
    const newAgentMode = !agentMode;
    
    // Set button state immediately
    setAgentMode(newAgentMode);
    
    // Store selection in localStorage
    localStorage.setItem('selectedAgentMode', newAgentMode ? 'agent' : 'default');
    
    toast.success(
      newAgentMode 
        ? "Agent mode selected. Send a message to activate." 
        : "Default mode selected. Send a message to activate.",
      {
        icon: newAgentMode ? '∞' : '💬',
        ...getToastStyle(theme)
      }
    );
  };

  // Function to clean up old chat sessions in localStorage
  const cleanupChatSessions = (currentSessionId: string) => {
    if (typeof window === 'undefined') return;
    
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);
    
    // Filter out chat session keys
    const chatSessionKeys = keys.filter(key => key.startsWith('chat-session-'));
    
    // Delete all chat sessions except the current one
    chatSessionKeys.forEach(key => {
      if (key !== `chat-session-${currentSessionId}`) {
        localStorage.removeItem(key);
      }
    });
  };

  // Handle model change
  const handleModelChange = useCallback((settings: { provider: string; model: string }) => {
    updateSettings({
      provider: settings.provider as ChatProvider,
      model: settings.model as ChatModel
    });
  }, [updateSettings]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    const startSessionData = {
      mode: agentMode ? 'agent' : 'default',
      embedding_enabled: embeddingEnabled,
      prompt: prompt,
      isNewChat: true,
      isExistingChat: false,
    };

    // Generate a UUID for the new chat session
    const sessionId = uuidv4();
    
    // Store the initial prompt and settings in localStorage
    localStorage.setItem(`chat-session-${sessionId}`, JSON.stringify(startSessionData));
    
    // Clean up old chat sessions
    cleanupChatSessions(sessionId);
    
    // Navigate to the new chat using Next.js router
    router.push(`/chat/${sessionId}`);
  };

  if (authChecking) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col items-center justify-center px-2 overflow-hidden`}>
      
        <div className="w-full flex flex-col items-center justify-center max-w-3xl mx-auto px-4">
            <WelcomeHeader 
              username={user?.username || ''}
              setPrompt={setPrompt}
            />
          
            <form
              onSubmit={handleSubmit}
              className={`flex rounded-xl items-end px-5 py-4 w-full justify-between border ${
                theme === "dark" 
                ? "bg-gray-900/80 border-gray-700 shadow-sm" 
                : "bg-white border-gray-200 shadow-sm"
              } transition-all duration-300 relative hover:border-blue-300 dark:hover:border-blue-700 focus-within:border-blue-400 dark:focus-within:border-blue-600`}
            >
              {/* Mode Indicators */}
              {embeddingEnabled && !agentMode && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                  <div className="flex items-center gap-1">
                    <WordPressIcon />
                    <BrainIcon />
                  </div>
                  <span>WordPress Knowledge Active</span>
                </div>
              )}
              
              {agentMode && (
                <div className="absolute -top-3 right-5 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                  <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                  <span>Agent Mode Active</span>
                </div>
              )}
              
              {/* Input and Attachments Wrapper */}
              <div className="relative flex flex-col w-full">
                <TextAreaInput
                  prompt={prompt}
                  handleInput={handleInput}
                  handleKeyDown={handleKeyDown}
                />

                {/* Mode Toggle Buttons and AI Provider */}
                <div className="left-0 mt-2 px-3 flex justify-between items-center">
                  <ModeToggleButtons
                    agentMode={agentMode}
                    embeddingEnabled={embeddingEnabled}
                    toggleAgentMode={toggleAgentMode}
                    toggleEmbedding={toggleEmbedding}
                  />
                  
                  {/* AI Provider Selection */}
                  <AIProviderSelect 
                    className="mt-0.5" 
                    onModelChange={handleModelChange}
                  />
                </div>
              </div>

              {/* Send Button */}
              <SendButton isDisabled={!prompt.trim()} />
            </form>

          {/* Info Footer */}
          <InfoFooter
            embeddingEnabled={embeddingEnabled}
            agentMode={agentMode}
          />
        </div>
      
    </div>
  );
};

export default Page;
