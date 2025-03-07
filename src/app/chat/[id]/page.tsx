/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback, use, useEffect } from "react";
import ChatInput from "@/components/chat-comp/chatInput";
import Message from "@/components/chat-comp/Message";
import { fetchMessages } from "@/utils/fetchMessages"; 
import { useTheme } from "@/context/ThemeProvider";
import AgentModeInterface from "@/components/chat-comp/AgentModeInterface";
import toast from "react-hot-toast";

interface Props {
  params: Promise<{ id: string }>;
}

const ChatPage = ({ params }: Props) => {
  useTheme();

  const { id } = use(params);
  const [messages, setMessages] = useState<any[]>([]);
  const [, setError] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchChatMessages = useCallback(async () => {
    setLoading(true);
    try {
      await fetchMessages(id, setMessages, setError);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load chat messages");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load messages on initial render
  useEffect(() => {
    fetchChatMessages();
  }, [fetchChatMessages]);

  // Check if agent mode is enabled
  useEffect(() => {
    const savedAgentMode = localStorage.getItem('selectedAgentMode');
    if (savedAgentMode === 'agent') {
      setAgentMode(true);
    }
  }, []);

  // Handle sending a message
  const handleSendMessage = async (message: string) => {
    try {
      // In a real implementation, this would send the message to the API
      // For now, we'll just add it to the messages array
      const newMessage = {
        message_id: `temp_${Date.now()}`,
        group: id,
        owner_name: "You",
        user_prompt: message,
        ai_response: "This is a placeholder response. In a real implementation, this would be the response from the API.",
        created_at: new Date().toISOString(),
      };
      
      // Add the message to the state
      setMessages(prev => [...prev, newMessage]);
      
      // In a real implementation, we would wait for the API response
      // and then update the message with the actual response
      
      // For demo purposes, simulate a delay and add an AI response
      if (!agentMode) {
        setTimeout(() => {
          const aiResponse = {
            message_id: `ai_${Date.now()}`,
            group: id,
            owner_name: "AI",
            user_prompt: "",
            ai_response: `I've processed your request: "${message}". Here's my response as a chatbot.`,
            created_at: new Date().toISOString(),
          };
          
          setMessages(prev => [...prev, aiResponse]);
        }, 1000);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
      return { success: false, error };
    }
  };

  if (loading && messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center h-full w-full relative">
      {agentMode ? (
        // Agent Mode Interface
        <AgentModeInterface 
          messages={messages}
          onSendMessage={handleSendMessage}
        />
      ) : (
        // Default Chat Interface
        <>
          <div className="flex-1 overflow-y-auto w-full pb-24">
            {messages.map((message, index) => (
              <Message 
                key={message.message_id || index}
                message={message}
              />
            ))}
          </div>

          <ChatInput 
            id={id} 
            setMessages={setMessages} 
            fetchMessages={fetchChatMessages}
            onSendMessage={handleSendMessage}
          />
        </>
      )}
    </div>
  );
};

export default ChatPage;
