/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, use, useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";
import AgentModeInterface from "@/components/chat-comp/AgentModeInterface";
import DefaultChatInterface from "@/components/chat-comp/DefaultChatInterface";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ChatService } from "@/lib/services/chatService";
import { ChatMessage, ChatResponse, Message } from "@/lib/types/chat";
import { getToastStyle } from "@/lib/toastConfig";
import { ChatProvider, ChatModel } from "@/lib/services/chatConfig";
import ChatHeader from "@/components/chat-comp/ChatHeader";

interface Props {
  params: Promise<{ id: string }>;
}

interface SessionData {
  mode: 'agent' | 'default';
  embedding_enabled: boolean;
  prompt: string;
  isNewChat?: boolean;
}

const ChatPage = ({ params }: Props) => {
  const { theme } = useTheme();

  const { id } = use(params);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agentMode, setAgentMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [chatService] = useState(() => new ChatService({}, { session_id: id }));
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [isOldChatSession, setIsOldChatSession] = useState(false);
  const [title, setTitle] = useState('New Chat');

  // Get initial session data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const sessionData = localStorage.getItem(`chat-session-${id}`);
        if (sessionData) {
          const parsedData = JSON.parse(sessionData) as SessionData;

          // Set agent mode based on session data
          if (parsedData.mode === 'agent') {
            setAgentMode(true);
            localStorage.setItem('selectedAgentMode', 'agent');
          } else {
            setAgentMode(false);
            localStorage.removeItem('selectedAgentMode');
          }
          
          // Check if this is a new chat session
          if (!parsedData.isNewChat) {
            setIsOldChatSession(true);
            setLoading(true);
          } else {
            let data = {
              ...parsedData,
              isNewChat: false
            }
            localStorage.setItem(`chat-session-${id}`, JSON.stringify(data));
          }
          
          // Store the initial prompt
          if (parsedData.prompt && parsedData.isNewChat) {
            setInitialPrompt(parsedData.prompt);
          }
          
          // Update chat service settings with embedding_enabled
          chatService.updateSettings({
            use_vector_search: parsedData.embedding_enabled
          });
        }
        
        // Initial loading is complete after checking session data
        setInitialLoading(false);
      } catch (error) {
        console.error('Error parsing session data from localStorage:', error);
        setInitialLoading(false);
      }
    }
  }, [id, chatService]);

  const handleMakeMessage = async (messages: Message[]): Promise<ChatMessage[]> => {
    const chatMessages: ChatMessage[] = [];
    for (const message of messages) {
      let messageId = message.id;
      let content = message.content;
      let role = message.role;
      let created_at = message.created_at;

      const userMessage: ChatMessage = {
        id: messageId,
        role: role,
        content: content,
        created_at: created_at,
        status: 'delivered'
      };

      chatMessages.push(userMessage);
    }

    return chatMessages;
  };

  const fetchChatMessages = useCallback(async () => {
    if (isOldChatSession) {
      setLoading(true);
    }
    
    try {
      // For existing sessions, fetch messages from the database
      if (isOldChatSession) {
        const chatMessages = await chatService.getSessionHistory();
        if (chatMessages && chatMessages.length > 0) {
          const messages = await handleMakeMessage(chatMessages);
          setMessages(messages);
          setInitialPrompt(null); // Clear initial prompt as we have real messages
        }
      }
      
      // If we have messages from the API, use them
      if (initialPrompt) {
        // If no messages from API but we have an initial prompt, send it
        await handleSendMessage(initialPrompt);
        setInitialPrompt(null); // Clear initial prompt after sending
      }
      
    } catch (error) {
      console.error("Error fetching messages:", error);
      
      // If API call fails but we have an initial prompt, still try to send it
      if (initialPrompt) {
        await handleSendMessage(initialPrompt);
        setInitialPrompt(null);
      }
      
      toast.error("Failed to load chat messages", getToastStyle(theme));
    } finally {
      setLoading(false);
    }
  }, [chatService, theme, initialPrompt, isOldChatSession]);

  // Load messages on initial render
  useEffect(() => {
    fetchChatMessages();
    
    // Cleanup function
    return () => {
      // Cancel any pending requests if component unmounts
    };
  }, [fetchChatMessages, id, isOldChatSession]);

  // Handle sending a message
  const handleSendMessage = async (content: string): Promise<ChatResponse> => {
    try {
      // Add user message to the UI immediately
      const userMessage: ChatMessage = {
        id: `temp_${Date.now()}`,
        role: 'user',
        content: content,
        created_at: new Date().toISOString(),
        status: 'delivered'
      };
      
      // Create a temporary pending AI message
      const pendingId = `pending_${Date.now()}`;
      const pendingMessage: ChatMessage = {
        id: pendingId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        status: 'pending'
      };
      
      // Add both messages to the UI
      setMessages(prev => [...prev, userMessage, pendingMessage]);
      
      // Send the message to the API
      const response = await chatService.sendMessage(content);

      console.log(response);
      
      // Replace the pending message with the actual AI response
      const aiMessage: ChatMessage = {
        id: response.conversation?.assistant_message_id || `ai_${Date.now()}`,
        role: 'assistant',
        content: response.response,
        created_at: new Date().toISOString(),
        status: 'delivered',
        metadata: {
          provider: response.provider,
          model: response.model,
          temperature: response.temperature,
          max_tokens: response.max_tokens,
          use_vector_search: response.use_vector_search,
          response_time: response.response_time,
          session_id: response.session_id,
          used_vector_search: response.used_vector_search
        }
      };
      
      // Replace the pending message with the actual response
      setMessages(prev => prev.map(msg => 
        msg.id === pendingId ? aiMessage : msg
      ));
      
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message", getToastStyle(theme));
      // Return a minimal ChatResponse object to satisfy the type
      return {
        response: "Error sending message",
        session_id: "",
      };
    }
  };

  const handleRegenerateMessage = async (): Promise<ChatResponse> => {
    try {
      // Find the last assistant message
      const lastAssistantMessageIndex = [...messages].reverse().findIndex(msg => msg.role === 'assistant');
      
      if (lastAssistantMessageIndex === -1) {
        toast.error("No message to regenerate", getToastStyle(theme));
        // Return a minimal ChatResponse object
        return {
          response: "No message to regenerate",
          session_id: "",
        };
      }
      
      // Get the actual index in the array
      const actualIndex = messages.length - 1 - lastAssistantMessageIndex;
      const lastAssistantMessage = messages[actualIndex];
      
      // Replace the last assistant message with a pending message
      const pendingId = `pending_regen_${Date.now()}`;
      const pendingMessage: ChatMessage = {
        id: pendingId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString(),
        status: 'pending'
      };
      
      const updatedMessages = [...messages];
      updatedMessages[actualIndex] = pendingMessage;
      setMessages(updatedMessages);
      
      // Call the regenerate API
      const response = await chatService.regenerateResponse(lastAssistantMessage.id);
      
      // Replace the pending message with the regenerated response
      const regeneratedMessage: ChatMessage = {
        id: `regen_${Date.now()}`,
        role: 'assistant',
        content: response.response,
        created_at: new Date().toISOString(),
        status: 'delivered',
        metadata: {
          provider: response.provider,
          model: response.model,
          regenerated: true,
          temperature: response.temperature,
          max_tokens: response.max_tokens,
          response_time: response.response_time,
          session_id: response.session_id,
          used_vector_search: response.used_vector_search
        }
      };
      
      // Replace the pending message with the regenerated response
      setMessages(prev => prev.map(msg => 
        msg.id === pendingId ? regeneratedMessage : msg
      ));
      
      toast.dismiss();
      toast.success("Response regenerated", getToastStyle(theme));
      
      return response;
    } catch (error) {
      console.error('Error regenerating message:', error);
      toast.dismiss();
      toast.error("Failed to regenerate response", getToastStyle(theme));
      // Return a minimal ChatResponse object
      return {
        response: "Error regenerating message",
        session_id: "",
      };
    }
  };

  // Function to clean up old chat sessions in localStorage
  const cleanupChatSessions = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);
    
    // Filter out chat session keys
    const chatSessionKeys = keys.filter(key => key.startsWith('chat-session-') && key !== `chat-session-${id}`);
    
    // Keep only the current session and delete all others
    chatSessionKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  }, [id]);

  // Clean up old chat sessions when component mounts
  useEffect(() => {
    cleanupChatSessions();
  }, [cleanupChatSessions]);

  // Add a handler for updating chat settings
  const handleUpdateSettings = useCallback((settings: { provider: string; model: string }) => {
    chatService.updateSettings({
      provider: settings.provider as ChatProvider,
      model: settings.model as ChatModel
    });
  }, [chatService]);

  // Handle title change
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    // You might want to save this to the backend or localStorage
  }, []);
  
  // Handle toggle agent mode
  const handleToggleAgentMode = useCallback(() => {
    setAgentMode(prev => !prev);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-shrink-0 z-10 mt-1 bg-transparent">
          <ChatHeader 
            title={title} 
            onTitleChange={handleTitleChange} 
            onToggleAgentMode={handleToggleAgentMode}
            agentMode={agentMode}
          />
        </div>

      {initialLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading chat...</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden">
          {agentMode ? (
            <AgentModeInterface 
              messages={messages} 
              onSendMessage={handleSendMessage}
              isLoading={loading}
            />
          ) : (
            <DefaultChatInterface 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              onRegenerateMessage={handleRegenerateMessage}
              onUpdateSettings={handleUpdateSettings}
              isLoading={loading}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ChatPage;