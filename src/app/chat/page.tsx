"use client"
import React, { useState, useEffect } from "react";
import ChatInput from "@/components/chat-comp/chatInput"
import { useTheme } from "@/context/ThemeProvider";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthProvider";
import useAuth from "@/lib/useAuth";
import TokenManager from "@/lib/tokenManager";
import { useChat } from "@/lib/hooks/useChat";
import AgentModeInterface from "@/components/chat-comp/AgentModeInterface";
import toast from "react-hot-toast";

const Page = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isLoggedIn } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [agentMode, setAgentMode] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  const {
    sendMessage,
    updateSettings,
    loading: chatLoading,
    error: chatError,
  } = useChat();

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
        setLoading(false);
      } else {
        console.log("Chat page: No valid authentication found, redirecting to signin");
        localStorage.setItem('isChat', 'true');
        router.push('/signin');
      }
    };

    checkAuth();
  }, [isAuthenticated, isLoggedIn, authLoading, user, router]);

  useEffect(() => {
    const savedAgentMode = localStorage.getItem('selectedAgentMode');
    if (savedAgentMode === 'agent') {
      setAgentMode(true);
    }
  }, []);

  const handleSendMessage = async (message: string) => {
    try {
      if (!hasStartedChat) {
        setHasStartedChat(true);
      }

      if (agentMode) {
        const userMessage = {
          message_id: `user_${Date.now()}`,
          owner_name: "You",
          user_prompt: message,
          ai_response: "",
          created_at: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        setTimeout(() => {
          const aiResponse = {
            message_id: `ai_${Date.now()}`,
            owner_name: "AI",
            user_prompt: "",
            ai_response: `I've analyzed your code request: "${message}". Check the editor tab for changes.`,
            created_at: new Date().toISOString(),
          };
          
          setMessages(prev => [...prev, aiResponse]);
        }, 1000);
        
        return { success: true };
      } else {
        const response = await sendMessage(message);
        
        if (!window.location.pathname.includes('/chat/')) {
          router.push(`/chat/${response.session_id}`);
        }
        
        return response;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
      return { success: false, error };
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col items-center justify-center px-2 overflow-hidden ${hasStartedChat ? 'justify-end' : 'justify-center'}`}>
      {hasStartedChat && agentMode ? (
        <div className="w-full h-full">
          <AgentModeInterface 
            messages={messages}
            onSendMessage={handleSendMessage}
          />
        </div>
      ) : (
        <div className={`max-w-4xl mx-auto flex flex-col items-center gap-5 w-full ${hasStartedChat ? 'mb-4' : ''}`}>
          {!hasStartedChat && (
            <h2 className="text-xl md:text-3xl font-semibold">
              How can I help you?
            </h2>
          )}
          <ChatInput 
            id="" 
            setMessages={setMessages} 
            fetchMessages={() => {}}
            onSendMessage={handleSendMessage}
          /> 
        </div>
      )}
    </div>
  );
};

export default Page;
