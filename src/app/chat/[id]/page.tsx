/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, use, useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";
import AgentModeInterface from "@/components/chat-comp/AgentModeInterface";
import DefaultChatInterface from "@/components/chat-comp/DefaultChatInterface";
import toast from "react-hot-toast";
import { ChatService } from "@/lib/services/chatService";
import { ChatMessage, ChatResponse, Message } from "@/lib/types/chat";
import { getToastStyle } from "@/lib/toastConfig";
import { ChatProvider, ChatModel } from "@/lib/services/chatConfig";
import { useChatStore, useSessionById } from "@/lib/store/chatStore";
import { Share2, PlusCircle, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tooltip } from "react-tooltip";
import { motion } from "framer-motion";
import { searchWeb, SearchResult } from "@/lib/services/searchApi";
import {
  useStreaming
} from "@/context/MessageStateContext";
import { useSidebar } from "../layout"; // Import the sidebar context

// Local implementation of extractThinkingContent and other functions from MessageProvider
const extractThinkingContent = (message: string) => {
  if (!message) return { content: "", thinking: null };
  
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  const match = message.match(thinkRegex);
  
  if (match && match[1]) {
    // Return the message without the <think> tags and the thinking content
    const cleanedMessage = message.replace(thinkRegex, '').trim();
    return { 
      content: cleanedMessage, 
      thinking: match[1].trim() 
    };
  }
  
  // If no <think> tags found, check for alternative formats like #thought:
  const lines = message.split('\n');
  const thoughtLines: string[] = [];
  const contentLines: string[] = [];
  
  lines.forEach(line => {
    if (line.trim().startsWith('#thought:')) {
      thoughtLines.push(line.replace('#thought:', '').trim());
    } else {
      contentLines.push(line);
    }
  });
  
  if (thoughtLines.length > 0) {
    return { 
      content: contentLines.join('\n').trim(),
      thinking: thoughtLines.join('\n').trim()
    };
  }
  
  // If no thinking content found in any format
  return { content: message, thinking: null };
};

interface Props {
  params: Promise<{ id: string }>;
}

const ChatPage = ({ params }: Props) => {
  const { theme } = useTheme();
  const router = useRouter();
  
  // Get sidebar functionality from context
  const { toggleSidebar, collapseSidebar } = useSidebar();

  const { id } = use(params);
  const [loading, setLoading] = useState(false);
  const [chatService] = useState(() => new ChatService({}, { id }));
  
  // Get session from store
  const session = useSessionById(id);
  const { 
    updateSession,
    updateMessages,
    setSession
  } = useChatStore();

  const {
    resetStreaming,
    setId,
    currentPhase
  } = useStreaming();


  // Local state derived from store
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [fetchError, setFetchError] = useState(false);
  const [isNewChat, setIsNewChat] = useState(false);
  
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  // Initialize session if needed
  useEffect(() => {
    // Only set the session if it's a new one (not from active session)
    if (session && (!useChatStore.getState().activeSession || useChatStore.getState().activeSession?.id !== id)) {
      setSession(session);
    }
    
    // Update local state from session after hydration
    if (session) {
      setIsNewChat(session.isNewChat || false);
    }
  }, [id, setSession, session]);

  useEffect(() => {
    if (session && session.isNewChat && !isNewChat) {
      setIsNewChat(session.isNewChat);
    }
  }, [session]);

  // Fetch messages if not in store
  useEffect(() => {
    // Skip fetching if we've already encountered an error for this session
    if (fetchError) return;
    const fetchMessages = async () => {
      // Early returns to prevent unnecessary processing
      if (!id || !session) return;
      if (messages.length > 0) return;
      if (fetchError) return;
      
      try {
        console.log(isNewChat, "isNewChat");
        
        // Handle new chat creation
        if (isNewChat) {
          // For new chats, don't immediately send the message
          // This prevents layout shifts by allowing the UI to stabilize first
          if (session.prompt) {
            // Add a small delay before sending the first message to allow layout to stabilize
            setTimeout(async () => {
              await handleSendMessage(session.prompt, true);
            }, 300);
          } else {
            console.log("No prompt available for new chat");
          }
          return; // Exit early as handleSendMessage will update the state
        }
        
        // Only fetch session history for existing chats
        if (!isNewChat) {
          try {
            const fetchedMessages = await chatService.getSessionHistory();
            if (fetchedMessages.length > 0) {
              const processedMessages = await handleMakeMessage(fetchedMessages);
              console.log(processedMessages, "fetchedMessages");          
              setMessages(processedMessages);
            }
          } catch (historyError) {
            console.error("Error fetching chat history:", historyError);
            // Don't set fetchError here to avoid showing error toast for new chats
          }
        }
        
      } catch (error) {
        console.error("Error in fetchMessages:", error);
        setFetchError(true);
        toast.error("Failed to load chat", getToastStyle(theme));
      }
    };
    
    fetchMessages();
    
    return () => {
    //
    };
  }, [id, isNewChat]);


  // Handle agent mode toggle
  const handleToggleAgentMode = () => {
    updateSession({ mode: 'agent' });
    
    // If the sidebar is not collapsed, toggle it to collapse
    if (!collapseSidebar) {
      toggleSidebar();
    }
  };

  // Convert API messages to UI messages
  const handleMakeMessage = async (messages: Message[]): Promise<ChatMessage[]> => {
    const chatMessages: ChatMessage[] = [];
    for (const message of messages) {
      // Generate a unique ID if one doesn't exist or ensure it's unique
      const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      let messageId = message.id || `${message.role}_${Date.now()}_${randomPart}`;
      let role = message.role;
      let created_at = message.created_at;

      const { content, thinking } = extractThinkingContent(message.content);

      const userMessage: ChatMessage = {
        id: messageId,
        role: role,
        content: content,
        created_at: created_at,
        status: 'delivered',
        thinking
      };

      chatMessages.push(userMessage);
    }

    return chatMessages;
  };

  const handleSearch = async (query: string): Promise<SearchResult[]>    => {
    try {
      const response = await searchWeb(query, 10);
      console.log(response, "response");
      return response.results;
    } catch (error) {
      console.error("Error performing search:", error);
      return [];
    }
  };


  // Send a new message
  const handleSendMessage = async (content: string, isNewChat: boolean = false): Promise<ChatResponse> => {
    
    // Reset streaming state when sending a new message
    
    // Validate input
    if (!content || !content.trim()) {
      toast.error("Message cannot be empty", getToastStyle(theme));
      return {
        response: "Error: Empty message",
        id: ""
      };
    }

    try {
      setLoading(true);
      resetStreaming();

     

      let searchResults: SearchResult[] = [];
      if(webSearchEnabled && content.trim()) {
        searchResults = await handleSearch(content);
      }
     
      // Check for thinking content
      // Generate unique IDs
      const randomPart = Math.random().toString(36).substring(2, 15);
      const tempUserId = `user_${Date.now()}_${randomPart}`;
      const tempAssistantId = `assistant_${Date.now()}_${randomPart}`;
      
      // Create user message with the cleaned content (no think tags)
      const userMessage: ChatMessage = {
        id: tempUserId,
        role: 'user',
        content: content, 
        created_at: new Date().toISOString(),
        status: 'delivered'
      };
      
      // Create temporary assistant message
      // const tempAssistantMessage: ChatMessage = {
      //   id: tempAssistantId,
      //   role: 'assistant',
      //   content: '',
      //   created_at: new Date().toISOString(),
      //   search_results: searchResults,
      //   status: 'pending',
      //   thinking: null,
      //   metadata: {
      //     provider: 'openai',
      //     model: 'gpt-4o',
      //     temperature: 0.5,
      //     max_tokens: 2000,
      //     response_time: 0,
      //     disableActionButtons: true
      //   },
      // };

      // console.log("firstId", tempAssistantId);
      // setId(tempAssistantId);
      // Update title for new chats
      if (messages.length === 0 || isNewChat) {
        const titleContent = content.split(/[.!?]/)[0] || content;
        const truncatedTitle = titleContent.length > 40 
          ? `${titleContent.substring(0, 40).trim()}...` 
          : titleContent.trim();
        
        updateSession({ 
          title: truncatedTitle,
          isNewChat: false
        });
      }
      
      // Clear existing messages and set new ones
      // This is the key change - we're explicitly controlling what messages are shown
      const newMessages = isNewChat 
        ? [userMessage] // For new chats, just show the new messages
        : [...messages, userMessage]; // For existing chats, append to existing messages
      
      setMessages(newMessages);
      
      // Make API call
      const apiCallPromise = chatService.sendMessage(content, {
        id: id,
        is_new_chat: isNewChat,
        mode: 'default'
      });
      
      // Add timeout handling
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), 60000);
      });
      
      // Race the API call against the timeout
      const response = await Promise.race([apiCallPromise, timeoutPromise]) as ChatResponse;
      
      // Check response for thinking content
      const { content: cleanResponse, thinking: responseThinking } = extractThinkingContent(response.response);
      
      // Create final assistant message with cleaned content
      const assistantMessage: ChatMessage = {
        id: response.assistant_message_id || tempAssistantId || '',
        role: 'assistant',
        content: cleanResponse || response.response, // Use cleaned content if thinking tags were found
        created_at: new Date().toISOString(),
        status: 'delivered',
        metadata: {
          provider: response.provider,
          model: response.model,
          temperature: response.temperature,
          max_tokens: response.max_tokens || 2000,
          response_time: response.response_time,
          used_vector_search: response.used_vector_search,
        },
        search_results: searchResults,
        thinking: responseThinking || undefined
      };

      // console.log("secondId", assistantMessage.id);

      setId(assistantMessage.id || '');
      
      // Replace the temporary assistant message with the real one
      // const finalMessages = newMessages.map(msg => 
      //   msg.id === tempAssistantMessage.id ? assistantMessage : msg
      // );
      // let updatedMessages = [...newMessages]; 
      // updatedMessages[updatedMessages.length - 1] = assistantMessage;
      // console.log("updatedMessages", updatedMessages);
      // setMessages(updatedMessages);
      setMessages([...newMessages, assistantMessage]);
      setLoading(false);
      

      return response;
    } catch (error) {
      console.error("Error sending message:", error);
      setLoading(false);
      
      // Error handling
      let errorMessage = "Failed to send message";
      
      if (error instanceof Error) {
        if (error.message === "Request timed out") {
          errorMessage = "Request timed out. Please try again.";
        } else if ((error as any).response?.status === 429) {
          errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
        } else if ((error as any).response?.status === 401) {
          errorMessage = "Authentication error. Please log in again.";
        } else if ((error as any).response?.data?.message) {
          errorMessage = (error as any).response.data.message;
        }
      }
      
      toast.error(errorMessage, getToastStyle(theme));
      
      // Remove the pending assistant message from the UI
      const cleanedMessages = messages.filter(msg => msg.status !== 'pending');
      setMessages([...cleanedMessages, {
        id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        role: 'system',
        content: 'Message failed to send. Please try again.',
        created_at: new Date().toISOString(),
        status: 'error'
      }]);
      
      return {
        response: errorMessage,
        id: ""
      };
    }
  };

  // Regenerate the last assistant message
  const handleRegenerateMessage = async (): Promise<ChatResponse> => {
    // Reset streaming state when regenerating a message
    resetStreaming();
    
    try {
      // Find the last assistant message
      const lastAssistantMessageIndex = [...messages].reverse().findIndex(msg => msg.role === 'assistant');
      
      if (lastAssistantMessageIndex === -1) {
        toast.error("No message to regenerate", getToastStyle(theme));
        // Return a minimal ChatResponse object
        return {
          response: "No message to regenerate",
          id: "",
        };
      }
      
      // Get the actual index in the array
      const actualIndex = messages.length - 1 - lastAssistantMessageIndex;
      
      // Replace the last assistant message with a pending message
      const randomPart = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const pendingId = `pending_regen_${Date.now()}_${randomPart}`;
      const pendingMessage: ChatMessage = {
        id: pendingId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        status: 'pending'
      };
      
      // Update UI - replace the last assistant message with the pending one
      const updatedMessages = [...messages];
      updatedMessages[actualIndex] = pendingMessage;
      setMessages(updatedMessages);
      
      // Update store
      updateMessages(updatedMessages);
      
      // Find the user message that prompted the assistant response
      let userMessageIndex = actualIndex - 1;
      while (userMessageIndex >= 0 && messages[userMessageIndex].role !== 'user') {
        userMessageIndex--;
      }
      
      if (userMessageIndex < 0) {
        toast.error("Could not find user message to regenerate from", getToastStyle(theme));
        return {
          response: "Error regenerating message",
          id: "",
        };
      }
      
      
      // Call API to regenerate
      setLoading(true);
      
     
      const response = await chatService.regenerateResponse();
      
      // Create the regenerated message
      const regeneratedMessage: ChatMessage = {
        id: response.assistant_message_id || `regen_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        role: 'assistant',
        content: response.response,
        created_at: new Date().toISOString(),
        metadata: {
          provider: response.provider,
          model: response.model,
          regenerated: true,
          temperature: response.temperature,
          max_tokens: response.max_tokens,
          response_time: response.response_time,
          used_vector_search: response.used_vector_search
        }
      };
      
      // Update UI - replace the pending message with the regenerated one
      updatedMessages[actualIndex] = regeneratedMessage;
      setMessages(updatedMessages);
      setLoading(false);
      
      // Update store
      updateMessages(updatedMessages);
      
      // Ensure the session is updated in localStorage
      updateSession({
        updated_at: new Date().toISOString()
      });
      
      toast.success("Message regenerated", getToastStyle(theme));
      
      return response;
    } catch (error) {
      console.error("Error regenerating message:", error);
      setLoading(false);
      toast.error("Failed to regenerate message", getToastStyle(theme));
      
      // Return a minimal ChatResponse object
      return {
        response: "Error regenerating message",
        id: ""
      };
    }
  };

  // Add a handler for updating chat settings
  const handleUpdateSettings = useCallback((settings: { provider: string; model: string }) => {
    chatService.updateSettings({
      provider: settings.provider as ChatProvider,
      model: settings.model as ChatModel
    });
  }, [chatService]);

  // Theme-based button styling function
  const getButtonStyle = (isDisabled = false) => {
    return `p-1.5 sm:p-2 rounded-full shadow-md hover:shadow-lg backdrop-blur-sm transition-all duration-200 transform hover:scale-110 active:scale-95 ${
      isDisabled ? 'opacity-50 cursor-not-allowed' : ''
    } ${
      theme === "dark" ? "bg-gray-800/90 text-gray-300 hover:text-white" : "bg-white/90 text-gray-700 hover:text-gray-900"
    }`;
  };

  // Reusable Action Button component
  const ActionButton = ({ 
    icon: Icon, 
    onClick, 
    label, 
    tooltipId, 
    tooltipContent,
    isDisabled = false,
    delay = 0.3
  }: { 
    icon: React.ElementType, 
    onClick: () => void, 
    label: string,
    tooltipId: string,
    tooltipContent: string,
    isDisabled?: boolean,
    delay?: number
  }) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.2 }}
    >
      <button 
        onClick={onClick}
        disabled={isDisabled}
        className={getButtonStyle(isDisabled)}
        aria-label={label}
        data-tooltip-id={tooltipId}
        data-tooltip-content={tooltipContent}
      >
        {isDisabled && tooltipId === "new-chat-tooltip" ? (
          <Icon size={18} />
        ) : (
          <Icon size={18} />
        )}
      </button>
    </motion.div>
  );

  // Button action handlers
  const handleShare = () => {
    const chatUrl = window.location.href;
    navigator.clipboard.writeText(chatUrl);
    toast.success("Chat link copied to clipboard", getToastStyle(theme));
  };
  
  const handleNewChat = () => {
    if (!loading) {
      router.push('/chat');
    }
  };
  
  const handleProfile = () => {
    router.push('/profile');
  };

  // Add this to the useEffect hooks that initialize state
  useEffect(() => {
    // Check saved web search preference
    const savedWebSearchEnabled = localStorage.getItem('webSearchEnabled') === 'true';
    if (savedWebSearchEnabled) {
      setWebSearchEnabled(true);
    }
  }, []);

  // Add a function to handle web search toggle from the interface
  const handleWebSearchToggle = (enabled: boolean) => {
    setWebSearchEnabled(enabled);
    localStorage.setItem('webSearchEnabled', enabled.toString());
  };

  return (
    <div className="relative flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
          {/* Action Buttons Container */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-3 right-3 md:absolute md:top-2 md:right-2 z-50 flex items-center space-x-1 sm:space-x-2 p-1 rounded-full bg-gray-100/30 dark:bg-gray-900/30 backdrop-blur-sm"
          >
            {/* Share Button */}
            <ActionButton
              icon={Share2}
              onClick={handleShare}
              label="Share chat"
              tooltipId="share-tooltip"
              tooltipContent="Share chat"
              delay={0.3}
            />
            
            {/* New Chat Button */}
            <ActionButton
              icon={PlusCircle}
              onClick={handleNewChat}
              label="New chat"
              tooltipId="new-chat-tooltip"
              tooltipContent="New chat"
              isDisabled={loading}
              delay={0.4}
            />
            
            {/* Profile Button */}
            <ActionButton
              icon={UserCircle}
              onClick={handleProfile}
              label="Profile"
              tooltipId="profile-tooltip"
              tooltipContent="Profile"
              delay={0.5}
            />
          </motion.div>
          
          {/* Tooltips with fixed positioning and portal to ensure visibility */}
          <div id="tooltip-container" className="tooltip-container">
            <Tooltip id="share-tooltip" place="bottom" style={{ zIndex: 9999 }} positionStrategy="fixed" />
            <Tooltip id="new-chat-tooltip" place="bottom" style={{ zIndex: 9999 }} positionStrategy="fixed" />
            <Tooltip id="profile-tooltip" place="top" style={{ zIndex: 9999 }} positionStrategy="fixed" />
          </div>
          
          <div className="flex-1 overflow-hidden">
            {session?.mode === 'agent' ? (
              <AgentModeInterface
                messages={messages} 
                onSendMessage={handleSendMessage}
                onRegenerateMessage={handleRegenerateMessage}
                isLoading={loading}
              />
            ) : (
              <>
                <DefaultChatInterface
                  messages={messages}
                  onSendMessage={handleSendMessage} 
                  onRegenerateMessage={handleRegenerateMessage}
                  onUpdateSettings={handleUpdateSettings}
                  webSearchEnabled={webSearchEnabled}
                  onWebSearchToggle={handleWebSearchToggle}
                  isLoading={loading}
                />
               
              </>
            )}
          </div>
    </div>
  );
};

export default ChatPage;