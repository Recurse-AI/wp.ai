/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import NewChat from "./newChat";
import ChatRow from "./chatRow";
import { getUser } from "@/utils/getUser";
import Link from "next/link";
import { useTheme } from "@/context/ThemeProvider";
import { motion } from "framer-motion";
import { Bot, MessageSquare, Sparkles } from "lucide-react";
import axios from 'axios';
import { ChatService } from "@/lib/services/chatService";
import { ChatConversation } from "@/lib/types/chat";
import { getToastStyle } from "@/lib/toastConfig";
import toast from "react-hot-toast";

const Sidebar = ({ onClose }: { onClose?: () => void }) => {
  const { theme } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", image: "" });
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [chatService] = useState(() => new ChatService());

  const router = useRouter();
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    getUser(setIsLoggedIn, setUser, router, pathname);
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    setError(false);
    try {
      // Fetch recent conversations using our ChatService
      const recentConversations = await chatService.getRecentConversations(10);
      setConversations(recentConversations);
    } catch (err) {
      console.error("Error fetching conversations:", err);
      
      // Handle specific status codes
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 401) {
          console.log("User not authenticated, clearing conversations");
          setConversations([]);
          return;
        }
        console.error(`Error fetching conversations: ${err.response.status} ${err.response.statusText}`);
      }
      
      setError(true);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchConversations();
    }
  }, [isLoggedIn]);

  const handleChatSelect = (sessionId: string, mode: 'agent' | 'default') => {
    if (onClose) {
      onClose();
    }
    
    // Mark this as an existing chat session in localStorage
    try {
      // const sessionData = localStorage.getItem(`chat-session-${sessionId}`);
      //remove all items from localStorage that start with chat-session-
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('chat-session-')) {
          localStorage.removeItem(key);
        }
      });

      const embeddingEnabled = localStorage.getItem('embeddingEnabled') === 'true';

      const sessionData = {
        mode: mode,
        embedding_enabled: embeddingEnabled,
        prompt: '',
        isNewChat: false
      }

      localStorage.setItem(`chat-session-${sessionId}`, JSON.stringify(sessionData));

      router.push(`/chat/${sessionId}`);

    } catch (error) {
      console.error('Error updating session data:', error);
    }
  };

  // Wrapper function that only takes sessionId and uses default mode
  const handleChatSelectWrapper = (sessionId: string) => {
    handleChatSelect(sessionId, 'default');
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const success = await chatService.deleteChatSession(chatId);
      if (success) {
        toast.success("Chat deleted successfully", getToastStyle(theme));
        fetchConversations(); // Refresh the list
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat", getToastStyle(theme));
    }
  };

  return (
    <div
      className={`h-screen w-full max-w-md transition-all duration-300 flex flex-col
      ${
        theme === "dark"
          ? "bg-gray-900/80 backdrop-blur-md shadow-md"
          : "bg-gray-200 border-r "
      }`}
    >
      {/* Enhanced Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`px-4 pt-4 pb-3 border-b ${theme === "dark" ? "border-gray-800" : "border-gray-300"}`}
      >
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mr-3 shadow-md">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              WordPress AI Expert
            </h2>
            <div className="flex items-center text-xs">
              <span className={`h-2 w-2 rounded-full bg-green-500 mr-1.5`}></span>
              <span className={`${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>AI-powered assistance</span>
            </div>
          </div>
        </div>
        
        <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-600"} mb-2 flex items-center`}>
          <Sparkles size={12} className="mr-1 text-yellow-500" />
          <span>WordPress expertise at your service</span>
        </div>
      </motion.div>

      {/* New Chat Button */}
      <div className="px-4 py-3">
        <NewChat onClose={onClose} />
      </div>

      {/* Sidebar Content */}
      <div className="mt-2 px-4 flex-1 overflow-hidden flex flex-col">
        {isLoggedIn ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <p
                className={`text-base font-semibold flex items-center ${
                  theme === "dark" ? "text-gray-300" : "text-gray-800"
                }`}
              >
                <MessageSquare size={16} className="mr-2 opacity-70" />
                Chat History
              </p>
              
              {conversations.length > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${theme === "dark" ? "bg-gray-800 text-gray-400" : "bg-gray-300 text-gray-700"}`}>
                  {conversations.length}
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-6 text-center">
                <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className={`text-sm ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
                    Loading chats...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="py-6 text-center">
                <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/20 px-3 py-2 rounded-lg inline-block">
                  Failed to load chats.
                </p>
              </div>
            ) : conversations.length > 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, staggerChildren: 0.1 }}
                className="mt-2 overflow-y-auto flex-1 custom-scrollbar gap-2 w-full pr-2"
              >
                {conversations.map((conversation, index) => (
                  <motion.div
                    key={conversation.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <ChatRow
                      id={conversation.session_id}
                      name={conversation.title}
                      openDropdown={openDropdown}
                      setOpenDropdown={setOpenDropdown}
                      refreshChats={fetchConversations}
                      onSelect={handleChatSelectWrapper}
                      onDelete={() => handleDeleteChat(conversation.id)}
                      lastMessage={conversation.last_message?.content}
                      timestamp={conversation.updated_at}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="py-6 text-center flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"} flex items-center justify-center mb-3`}>
                  <MessageSquare size={24} className={`${theme === "dark" ? "text-gray-600" : "text-gray-400"}`} />
                </div>
                <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                  No chat history yet
                </p>
                <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                  Start a new conversation
                </p>
              </div>
            )}
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 text-center flex flex-col items-center p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10"
          >
            <div className={`w-16 h-16 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 flex items-center justify-center mb-3 border ${theme === "dark" ? "border-gray-700" : "border-gray-300"}`}>
              <MessageSquare size={24} className={`${theme === "dark" ? "text-blue-400" : "text-blue-600"}`} />
            </div>
            <p className={`font-medium ${theme === "dark" ? "text-white" : "text-gray-800"} mb-2`}>
              Sign in to Access Chat History
            </p>
            <p className={`text-xs mb-4 ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              Sign in to view your previous conversations
            </p>
            <Link
              href="/signin"
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-300 
                ${theme === "dark" 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-blue-500 text-white hover:bg-blue-600"}`}
            >
              Sign In
            </Link>
          </motion.div>
        )}
      </div>
      
      {/* Expert Info Footer */}
      <div className={`p-4 mt-auto border-t ${theme === "dark" ? "border-gray-800" : "border-gray-300"}`}>
        <div className="flex items-center">
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mr-3">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-200" : "text-gray-700"}`}>WP.ai Assistant</p>
            <p className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>Trained on WordPress expertise</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
