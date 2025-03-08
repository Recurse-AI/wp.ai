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
import { ChatMessage, ChatResponse } from "@/lib/types/chat";
import { getToastStyle } from "@/lib/toastConfig";

interface Props {
  params: Promise<{ id: string }>;
}

interface SessionData {
  mode: 'agent' | 'default';
  embedding_enabled: boolean;
  prompt: string;
  isNewChat?: boolean;
  isExistingChat?: boolean;
  maintainHistory?: boolean;
  previousSessionId?: string | null;
  createdAt?: string;
  lastAccessed?: string;
}

const ChatPage = ({ params }: Props) => {
  const { theme } = useTheme();

  const { id } = use(params);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatService] = useState(() => new ChatService({}, { session_id: id }));
  const [initialPrompt, setInitialPrompt] = useState<string | null>(null);
  const [isNewChatSession, setIsNewChatSession] = useState(false);
  const [maintainHistory, setMaintainHistory] = useState(false);
  const [previousSessionId, setPreviousSessionId] = useState<string | null>(null);

  const router = useRouter();

  // Get initial session data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const sessionData = localStorage.getItem(`chat-session-${id}`);
        if (sessionData) {
          const parsedData = JSON.parse(sessionData) as SessionData;
          
          // Check if this is a new chat session
          if (parsedData.isNewChat) {
            setIsNewChatSession(true);
            
            // Check if we should maintain history from a previous session
            if (parsedData.maintainHistory && parsedData.previousSessionId) {
              setMaintainHistory(true);
              setPreviousSessionId(parsedData.previousSessionId);
            }
            
            // Update the session data to mark it as no longer new
            const updatedSessionData = {
              ...parsedData,
              isNewChat: false
            };
            localStorage.setItem(`chat-session-${id}`, JSON.stringify(updatedSessionData));
          }
          
          // Set agent mode based on session data
          if (parsedData.mode === 'agent') {
            setAgentMode(true);
            localStorage.setItem('selectedAgentMode', 'agent');
          } else {
            setAgentMode(false);
            localStorage.removeItem('selectedAgentMode');
          }
          
          // Store the initial prompt
          if (parsedData.prompt) {
            setInitialPrompt(parsedData.prompt);
          }
          
          // Update chat service settings with embedding_enabled
          chatService.updateSettings({
            use_vector_search: parsedData.embedding_enabled
          });
        }
      } catch (error) {
        console.error('Error parsing session data from localStorage:', error);
      }
    }
  }, [id, chatService]);

  const fetchChatMessages = useCallback(async () => {
    setLoading(true);
    try {
      // If it's a new chat session but we should maintain history, fetch from previous session
      if (isNewChatSession && maintainHistory && previousSessionId) {
        console.log("New chat session with history maintenance, fetching from previous session:", previousSessionId);
        
        // Create a temporary chat service for the previous session
        const previousChatService = new ChatService({}, { session_id: previousSessionId });
        
        // Fetch messages from the previous session
        const previousMessages = await previousChatService.getConversationHistory();
        
        if (previousMessages && previousMessages.length > 0) {
          setMessages(previousMessages);
          setInitialPrompt(null);
          setLoading(false);
          return;
        }
      }
      
      // If it's a new chat session without history or previous fetch failed, don't try to fetch messages
      if (isNewChatSession && !maintainHistory) {
        console.log("New chat session detected, skipping database fetch");
        if (initialPrompt) {
          await handleSendMessage(initialPrompt);
          setInitialPrompt(null);
        }
        setLoading(false);
        return;
      }
      
      // For existing sessions, fetch messages from the database
      const chatMessages = await chatService.getConversationHistory();
      
      // If we have messages from the API, use them
      if (chatMessages && chatMessages.length > 0) {
        setMessages(chatMessages);
        setInitialPrompt(null); // Clear initial prompt as we have real messages
      } else if (initialPrompt) {
        // If no messages from API but we have an initial prompt, send it
        await handleSendMessage(initialPrompt);
        setInitialPrompt(null); // Clear initial prompt after sending
      }
      
      setError(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
      
      // If API call fails but we have an initial prompt, still try to send it
      if (initialPrompt) {
        await handleSendMessage(initialPrompt);
        setInitialPrompt(null);
      }
      
      toast.error("Failed to load chat messages", getToastStyle(theme));
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [chatService, theme, initialPrompt, isNewChatSession, maintainHistory, previousSessionId]);

  // Load messages on initial render
  useEffect(() => {
    fetchChatMessages();
  }, [fetchChatMessages, id]);

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
        id: `ai_${Date.now()}`,
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

  if (loading && messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      {agentMode ? (
        // Agent Mode Interface with split screen
        <AgentModeInterface 
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      ) : (
        // Default Chat Interface with input at bottom
        <DefaultChatInterface 
          messages={messages}
          onSendMessage={handleSendMessage}
          onRegenerateMessage={handleRegenerateMessage}
        />
      )}
    </div>
  );
};

export default ChatPage;