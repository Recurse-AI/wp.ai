"use client"
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthProvider";
import TokenManager from "@/lib/tokenManager";
import toast from "react-hot-toast";
import WelcomeHeader from "@/components/chat-comp/input-components/WelcomeHeader";
import SendButton from "@/components/chat-comp/input-components/SendButton";
import InfoFooter from "@/components/chat-comp/input-components/InfoFooter";
import TextAreaInput from "@/components/chat-comp/TextAreaInput";
import AIProviderSelect from "@/components/chat-comp/input-components/AIProviderSelect";
import { WordPressIcon, BrainIcon } from "@/components/chat-comp/input-components/EnhancedIcons";
import { Database, Globe } from "lucide-react";
import { getToastStyle } from "@/lib/toastConfig";
import { useChatSocket } from "@/context/ChatSocketContext";

const Page = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuthContext();
  const [authChecking, setAuthChecking] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [do_web_search, setDoWebSearch] = useState(false);
  const [do_vector_search, setDoVectorSearch] = useState(false);
  const [selectedModel, setSelectedModel] = useState<{provider: string; model: string}>({
    provider: 'openai',
    model: 'gpt-4o-mini'
  });
  const { connect, connected, connecting, connectionStatus, disconnect } = useChatSocket();
  const [debugInfo, setDebugInfo] = useState<string>('');


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

      if (isAuthenticated || hasToken || hasRefreshToken || hasUserData || hasAuthToken) {
        console.log("Chat page: Authentication confirmed, allowing access");
        setAuthChecking(false);
      } else {
        console.log("Chat page: No valid authentication found, redirecting to signin");
        localStorage.setItem('isChat', 'true');
        router.push('/signin');
      }
    };

    checkAuth();
  }, [isAuthenticated, authLoading, user, router]);

  // Additional debug info for development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const token = localStorage.getItem('token');
      const tokenExists = !!token;
      const tokenInfo = tokenExists 
        ? `Token exists (${token?.substring(0, 10)}...)`
        : 'No token found';
        
      setDebugInfo(`
        Auth: ${isAuthenticated ? 'Yes' : 'No'}
        Connection: ${connectionStatus}
        Connected: ${connected ? 'Yes' : 'No'}
        Connecting: ${connecting ? 'Yes' : 'No'}
        Token: ${tokenInfo}
      `);
    }
  }, [isAuthenticated, connected, connecting, connectionStatus]);

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

  // Toggle search mode
  const toggleSearch = () => { 
    let webSearchEnabled = !do_web_search ? 'true' : 'false';
    setDoWebSearch(!do_web_search);
    localStorage.setItem('webSearchEnabled', webSearchEnabled);
    toast.success(
      !do_web_search 
        ? "WordPress knowledge base activated" 
        : "WordPress knowledge base deactivated",
      {
        icon: !do_web_search ? '🧠' : '🔍',
        ...getToastStyle(theme)
      }
    );
  };
  // Toggle embedding mode
  const toggleEmbedding = () => {
    let vectorSearchEnabled = !do_vector_search ? 'true' : 'false';
    setDoVectorSearch(!do_vector_search);
    localStorage.setItem('vectorSearchEnabled', vectorSearchEnabled);
    toast.success(
      !do_vector_search 
        ? "Web Search functionality activated" 
        : "Web Search functionality deactivated",
      {
        icon: !do_vector_search ? '🌐' : '💬',
        ...getToastStyle(theme)
      }
    );
  };

  // Handle model change
  const handleModelChange = useCallback((settings : { provider: string; model: string }) => {
    console.log("Model changed:", settings);
    setSelectedModel(settings);
    localStorage.setItem('selectedAIModel', JSON.stringify(settings));
  }, []);

  // Handle submit - when a user sends a message
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;
    
    try {
      // Store the initial message in localStorage so the chat/:id page can use it
      localStorage.setItem('pendingChatMessage', prompt);
      
      // Store selected model settings for the chat/:id page
      localStorage.setItem('pendingChatModel', JSON.stringify({
        provider: selectedModel.provider,
        model: selectedModel.model,
        doWebSearch: do_web_search,
        doVectorSearch: do_vector_search
      }));
      
     
      // Show loading state
      setPrompt('');
      connect();
      
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("Failed to create new chat", {
        id: 'creating-chat',
        ...getToastStyle(theme)
      });
    }
  };

  useEffect(() => {
    //update settings variable from local storage
    const isWebSearchEnabled = localStorage.getItem('webSearchEnabled') === 'true';
    const isVectorSearchEnabled = localStorage.getItem('vectorSearchEnabled') === 'true';
    setDoWebSearch(isWebSearchEnabled);
    setDoVectorSearch(isVectorSearchEnabled);
    const savedAIModel = localStorage.getItem('selectedAIModel');
    if (savedAIModel) {
      setSelectedModel(JSON.parse(savedAIModel));
    }
  }, []);

  if (authChecking) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col items-center justify-center px-2 overflow-hidden chat-page`}>
      {/* Debug info panel - only shown in development */}
      {process.env.NODE_ENV !== 'production' && debugInfo && (
        <div className="absolute top-2 right-2 p-2 bg-gray-800 text-white rounded-md text-xs font-mono z-50 opacity-75 hover:opacity-100">
          <pre>{debugInfo}</pre>
        </div>
      )}
      
      <div className="w-full flex flex-col items-center justify-center max-w-3xl mx-auto px-4">
          <WelcomeHeader 
            username={user?.username || ''}
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
            {do_vector_search && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                <div className="flex items-center gap-1">
                  <WordPressIcon />
                  <BrainIcon />
                </div>
                <span>WordPress Knowledge Active</span>
              </div>
            )}

            {do_web_search && (
              <div className="absolute -top-3 right-5 bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                <Globe className="w-4 h-4 text-white" strokeWidth={2} />
                <span>Web Search Active</span>
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
                <div className="flex gap-3 text-gray-500 text-xs">
                  {/* Toggle Embedding Button */}
                  <button 
                    type="button"
                    onClick={toggleSearch}
                    className={`flex items-center gap-1.5 justify-center p-1 rounded-lg transition-all ${
                      do_web_search 
                        ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
                    }`}
                  >
                   <Globe className={`w-4 h-4 ${do_web_search ? "text-blue-500" : ""}`} strokeWidth={2} />
                <span className={`text-[11px] font-medium ${do_web_search ? "text-blue-600 dark:text-blue-400" : ""}`}>
                      {do_web_search ? "Web Search On" : "Web Search Off"}
                    </span>
                  </button>

                  {/* Toggle Search Button */}
                  <button 
                    type="button"
                    onClick={toggleEmbedding}
                    className={`flex items-center gap-1.5 justify-center p-1 rounded-lg transition-all ${
                      do_vector_search
                        ? "text-green-500 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
                    }`}
                  >
                    <Database className={`w-4 h-4 ${do_vector_search ? "text-green-500" : ""}`} strokeWidth={2} />
                    <span className={`text-[11px] font-medium ${do_vector_search ? "text-green-600 dark:text-green-400" : ""}`}>
                      {do_vector_search ? "KB On" : "KB Off"}
                    </span>
                  </button>
                </div>
                
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
          do_web_search={do_web_search}
          do_vector_search={do_vector_search}
        />
      </div>
    </div>
  );
};

export default Page;
