/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { FaWordpress } from "react-icons/fa";
import { ImArrowUpRight2 } from "react-icons/im";
import { IoGlobeOutline } from "react-icons/io5";
import { MdImage, MdSmartToy } from "react-icons/md";
import { TbPaperclip } from "react-icons/tb";
import { fetchMessages } from "@/utils/fetchMessages";
import toast from "react-hot-toast"; // ✅ For success & error messages
import ProcessingMessage from "./processingMessage";
import { useTheme } from "@/context/ThemeProvider";
import { Tooltip } from "react-tooltip";
import { motion } from "framer-motion";
import useAuth from "@/lib/useAuth";
import { Brain, Bot, Book, Send, Database, MessageSquare, SendHorizontal, ArrowRight, ArrowUpRight, Zap } from "lucide-react";

interface ChatInputProps {
  id: string;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  fetchMessages: () => void;
  onSendMessage: (message: string) => Promise<any>;
}

const ChatInput: React.FC<ChatInputProps> = ({
  id,
  setMessages,
  fetchMessages,
  onSendMessage,
}) => {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const { user } = useAuth();
  const { theme } = useTheme();
  const userEmail = user?.email || "anonymous";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showProcessing, setShowProcessing] = useState(false);
  const [embeddingEnabled, setEmbeddingEnabled] = useState(false);
  const [agentMode, setAgentMode] = useState(false);

  // Initialize agent mode from localStorage
  useEffect(() => {
    const savedAgentMode = localStorage.getItem('selectedAgentMode');
    if (savedAgentMode === 'agent') {
      setAgentMode(true);
    }
  }, []);

  // ✅ Handle text input & auto-expand textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Maximum height for 5 lines
      textareaRef.current.style.height = `${Math.min(
        scrollHeight,
        maxHeight
      )}px`;
    }
  };

  // ✅ Handle key press events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default new line
      if (prompt.trim()) {
        handleSubmit(e as any);
      }
    }
  };

  // ✅ Toggle embedding mode
  const toggleEmbedding = () => {
    setEmbeddingEnabled(!embeddingEnabled);
    toast.success(
      !embeddingEnabled 
        ? "WordPress knowledge base activated" 
        : "WordPress knowledge base deactivated",
      {
        icon: !embeddingEnabled ? '🧠' : '🔍',
        style: {
          borderRadius: '10px',
          background: theme === 'dark' ? '#333' : '#f0f0f0',
          color: theme === 'dark' ? '#fff' : '#333',
        },
      }
    );
  };

  // Toggle agent mode
  const toggleAgentMode = () => {
    const newAgentMode = !agentMode;
    setAgentMode(newAgentMode);
    
    // Save to localStorage
    localStorage.setItem('selectedAgentMode', newAgentMode ? 'agent' : 'default');
    
    // Show toast notification
    toast.success(
      newAgentMode 
        ? "Agent mode activated" 
        : "Default mode activated",
      {
        icon: newAgentMode ? '∞' : '💬',
        style: {
          borderRadius: '10px',
          background: theme === 'dark' ? '#333' : '#f0f0f0',
          color: theme === 'dark' ? '#fff' : '#333',
        },
      }
    );
    
    // Reload the page to apply the changes
    // This ensures all components update to reflect the new mode
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // ✅ Handle chat submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) return;

    // Show ProcessingMessage if it's a new chat
    if (!id) {
      setShowProcessing(true);
    }

    // Temporary Message Object
    const tempMessage = {
      message_id: "temp_" + new Date().getTime(),
      group: id || "new_chat",
      owner_name: "You",
      user_prompt: prompt,
      ai_response: "Loading...",
      created_at: new Date().toISOString(),
    };

    // Add Temporary Message to UI - do this for both new chats and existing chats
    setMessages((prevMessages) => [...prevMessages, tempMessage]);

    try {
      // Send the message
      await onSendMessage(prompt);
      
      // Clear the input
      setPrompt("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
      
      // If in agent mode, don't fetch messages as the agent interface handles this differently
      if (!agentMode && id) {
        // Fetch updated messages for existing chats in default mode
        await fetchMessages();
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error("Something went wrong. Try again later.");

      // Remove Temporary Message on Error
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.message_id !== tempMessage.message_id)
      );
    } finally {
      setShowProcessing(false);
    }
  };

  return (
    <div
      className={`w-full flex flex-col items-center justify-center max-w-3xl mx-auto px-4 `}
    >
      {/* User greeting with WordPress branding - Enhanced */}
      {user && user?.username && (
        <div className={`w-full text-center mb-6 ${
          theme === "dark" ? "text-gray-300" : "text-gray-700"
        }`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="bg-blue-600 text-white p-2 rounded-full">
              <FaWordpress className="text-lg" />
            </div>
            <span className="font-bold text-xl text-blue-600 dark:text-blue-400">WP.AI</span>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30 shadow-sm mb-4">
            <p className="text-blue-800 dark:text-blue-300 font-medium mb-1">Welcome back, {user.username}!</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              I'm your WordPress assistant. What would you like help with today?
            </p>
            
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button 
                onClick={() => setPrompt("How do I optimize my WordPress site performance?")} 
                className="text-xs bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                Site Performance
              </button>
              <button 
                onClick={() => setPrompt("Help me troubleshoot WordPress plugin conflicts")} 
                className="text-xs bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                Plugin Conflicts
              </button>
              <button 
                onClick={() => setPrompt("How do I create a custom WordPress theme?")} 
                className="text-xs bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
              >
                Custom Themes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* ✅ Show Processing Message */}
      {showProcessing ? (
        <ProcessingMessage isOpen={showProcessing} />
      ) : (
        <form
          onSubmit={handleSubmit}
          className={`flex rounded-xl items-end px-5 py-4 w-full justify-between border ${
            theme === "dark" 
            ? "bg-gray-900/80 border-gray-700 shadow-sm" 
            : "bg-white border-gray-200 shadow-sm"
          } transition-all duration-300 relative hover:border-blue-300 dark:hover:border-blue-700 focus-within:border-blue-400 dark:focus-within:border-blue-600`}
        >
          {/* Embedding Mode Active Indicator */}
          {embeddingEnabled && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
              <div className="flex items-center gap-1">
                <FaWordpress className="text-white text-xs" />
                <Brain className="text-white text-xs animate-pulse" />
              </div>
              <span>WordPress Knowledge Active</span>
            </div>
          )}
          
          {/* Agent Mode Active Indicator */}
          {agentMode && (
            <div className="absolute -top-3 right-5 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
              <div className="flex items-center gap-1">
                <Zap className="text-white text-xs animate-pulse" />
              </div>
              <span>Agent Mode Active</span>
            </div>
          )}
          
          {/* Input and Attachments Wrapper */}
          <div className="relative flex flex-col w-full">
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              placeholder="Ask about WordPress themes, plugins, development, or any WP questions..."
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              value={prompt}
              className={`bg-transparent placeholder:text-gray-400 px-3 outline-none 
                w-full font-medium tracking-wide text-base resize-none overflow-y-auto ${
                theme === "dark" ? "text-gray-300" : "text-gray-800"
              }`}
              style={{
                minHeight: "40px", // Starts at 1 line height
                maxHeight: "120px", // Stops expanding after 5 lines
                height: "40px", // Initial height
                paddingBottom: "10px", // Prevent text from touching the bottom
                lineHeight: "24px", // Maintain proper line spacing
              }}
            />

            {/* Icons Below Input */}
            <div className="left-0 mt-2 px-3 flex gap-4 text-gray-500 text-xs">
              {/* Mode Toggles Group */}
              <div className="flex gap-3">
                {/* Agent/Default Mode Toggle Button */}
                <div className="relative">
                  <motion.button
                    type="button"
                    onClick={toggleAgentMode}
                    whileTap={{ scale: 0.95 }}
                    data-tooltip-id="tooltip-agent-mode"
                    data-tooltip-content={agentMode ? "Switch to Default Mode" : "Switch to Agent Mode"}
                    className={`flex items-center gap-1.5 justify-center p-1 rounded-lg transition-all ${
                      agentMode 
                        ? "text-purple-500 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
                    }`}
                  >
                    {agentMode ? (
                      <Zap className="text-base text-purple-500" />
                    ) : (
                      <MessageSquare className="text-base" />
                    )}
                    <span className={`text-[11px] font-medium ${agentMode ? "text-purple-600 dark:text-purple-400" : ""}`}>
                      {agentMode ? "Agent" : "Default"}
                    </span>
                  </motion.button>
                  <Tooltip id="tooltip-agent-mode" place="top" />
                </div>

                {/* Embedding Toggle Button - Enhanced */}
                <div className="relative">
                  <motion.button
                    type="button"
                    onClick={toggleEmbedding}
                    whileTap={{ scale: 0.95 }}
                    data-tooltip-id="tooltip-embedding"
                    data-tooltip-content={embeddingEnabled ? "WordPress Knowledge Base Active" : "Enable WordPress Knowledge Base"}
                    className={`flex items-center gap-1.5 justify-center p-1 rounded-lg transition-all ${
                      embeddingEnabled 
                        ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
                    }`}
                  >
                    <Database className={`text-base ${embeddingEnabled ? "text-blue-500" : ""}`} />
                    <span className={`text-[11px] font-medium ${embeddingEnabled ? "text-blue-600 dark:text-blue-400" : ""}`}>
                      {embeddingEnabled ? "KB On" : "KB Off"}
                    </span>
                  </motion.button>
                  <Tooltip id="tooltip-embedding" place="top" />
                </div>
              </div>
            </div>
          </div>

          {/* Send Button on the Right - Enhanced */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={!prompt.trim()} // Disable if input is empty
            className={`p-3 rounded-full ml-3 ${
              prompt.trim() 
                ? theme === "dark"
                  ? "bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 shadow-md"
                  : "bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 shadow-md"
                : theme === "dark"
                  ? "bg-gray-800 text-gray-600"
                  : "bg-gray-100 text-gray-400"
            } flex items-center justify-center transition-all`}
          >
            <motion.div
              animate={prompt.trim() ? { 
                scale: [1, 1.1, 1],
                y: [0, -2, 0], 
                x: [0, 2, 0],
              } : {}}
              transition={{ 
                repeat: prompt.trim() ? Number.POSITIVE_INFINITY : 0, 
                repeatType: "reverse", 
                duration: 1.2,
                repeatDelay: 0.5
              }}
              className="flex items-center justify-center"
            >
              <ArrowUpRight className={`w-5 h-5 ${prompt.trim() ? "text-white" : ""}`} strokeWidth={2.5} />
            </motion.div>
          </motion.button>
        </form>
      )}

      {/* ✅ Info Footer - Enhanced */}
      <p
        className={`text-xs mt-2 font-medium tracking-wide flex items-center justify-center gap-2 ${
          theme === "dark" ? "text-gray-500" : "text-gray-600"
        }`}
      >
        {embeddingEnabled && (
          <>
            <span className="flex items-center gap-1">
              <Database className="text-blue-500" />
              <span className="text-blue-500">WordPress knowledge base active</span>
            </span>
            <span className="mx-1">•</span>
          </>
        )}
        {agentMode && (
          <>
            <span className="flex items-center gap-1">
              <Zap className="text-purple-500" />
              <span className="text-purple-500">Agent mode active</span>
            </span>
            <span className="mx-1">•</span>
          </>
        )}
        <span>WP.AI helps with WordPress development. Verify important info.</span>
      </p>
    </div>
  );
};

export default ChatInput;