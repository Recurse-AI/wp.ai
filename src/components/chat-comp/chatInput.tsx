/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useRef } from "react";
import { FaCamera, FaCube, FaDatabase, FaBrain, FaWordpress } from "react-icons/fa";
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

const ChatInput = ({
  id,
  setMessages,
  fetchMessages,
}: {
  id: string;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  fetchMessages: () => void;
}) => {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const { user } = useAuth();
  const { theme } = useTheme();
  const userEmail = user?.email || "anonymous";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showProcessing, setShowProcessing] = useState(false);
  const [embeddingEnabled, setEmbeddingEnabled] = useState(false);

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

  // ✅ Handle chat submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) return; // ✅ Avoid empty messages

    // ✅ Show ProcessingMessage if it's a new chat
    if (!id) {
      setShowProcessing(true);
    }

    // ✅ Temporary Message Object (Shows Immediately)
    const tempMessage = {
      message_id: "temp_" + new Date().getTime(), // Unique ID for temp message
      group: id || "new_chat",
      owner_name: "You", // User who sent the prompt
      user_prompt: prompt,
      ai_response: "Loading...", // ✅ Show this until API responds
      created_at: new Date().toISOString(),
      parent_message: localStorage.getItem("lastMessageId") || null,
    };

    // ✅ Add Temporary Message to UI
    if (id) {
      setMessages((prevMessages) => [...prevMessages, tempMessage]);
    }

    // ✅ Prepare Request Body
    const requestBody = id
      ? {
          prompt: prompt,
          group_id: id,
          parent_message_id: localStorage.getItem("lastMessageId") || null,
          use_embedding: embeddingEnabled,
        }
      : { 
          prompt: prompt,
          use_embedding: embeddingEnabled,
        };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        credentials: "include",
      });
      console.log(res);

      const data = await res.json();

      if (res.ok) {
        const newChatId = data.chat_group.group_id;

        if (id) {
          setMessages((prevMessages) => {
            const updatedMessages = prevMessages.filter(
              (msg) => msg.message_id !== tempMessage.message_id
            );
            localStorage.setItem("set-to-flow", data.chat_message.message_id);

            return [...updatedMessages, data.chat_message];
          });
          setShowProcessing(false);
        } else {
          localStorage.setItem("set-to-flow", data.chat_message.message_id);
          setShowProcessing(false);
          window.location.href = `/chat/${newChatId}`;
        }

        setPrompt(""); // ✅ Clear input field
        if (textareaRef.current) {
          textareaRef.current.style.height = "40px"; // Reset to default size
        }
      } else {
        toast.error(data.message || "Failed to send message.");

        // ✅ Remove Temporary Message on Error
        setMessages((prevMessages) =>
          prevMessages.filter(
            (msg) => msg.message_id !== tempMessage.message_id
          )
        );
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error("Something went wrong. Try again later.");

      // ✅ Remove Temporary Message on Error
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.message_id !== tempMessage.message_id)
      );
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
                <FaBrain className="text-white text-xs animate-pulse" />
              </div>
              <span>WordPress Knowledge Active</span>
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
              {/* Embedding Toggle Button - Enhanced */}
              <div className="relative">
                <motion.button
                  type="button"
                  onClick={toggleEmbedding}
                  whileTap={{ scale: 0.95 }}
                  data-tooltip-id="tooltip-embedding"
                  data-tooltip-content={embeddingEnabled ? "WordPress Knowledge Base Active" : "Enable WordPress Knowledge Base"}
                  className={`flex items-center gap-2 justify-center p-1.5 rounded-lg transition-all ${
                    embeddingEnabled 
                      ? "text-blue-500 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50 border border-transparent"
                  }`}
                >
                  <FaDatabase className={`text-lg ${embeddingEnabled ? "text-blue-500" : ""}`} />
                  <span className={`text-xs font-medium ${embeddingEnabled ? "text-blue-600 dark:text-blue-400" : ""}`}>
                    {embeddingEnabled ? "KB On" : "KB Off"}
                  </span>
                </motion.button>
                <Tooltip id="tooltip-embedding" place="top" />
              </div>
            </div>
          </div>

          {/* Send Button on the Right - Enhanced */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            disabled={!prompt.trim()} // Disable if input is empty
            className={`p-2.5 rounded-lg ml-3 ${
              prompt.trim() 
                ? theme === "dark"
                  ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                  : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
                : theme === "dark"
                  ? "bg-gray-800 text-gray-600"
                  : "bg-gray-100 text-gray-400"
            } flex items-center justify-center transition-all`}
          >
            <ImArrowUpRight2 className={`text-lg ${prompt.trim() ? "text-white" : ""}`} />
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
              <FaDatabase className="text-blue-500" />
              <span className="text-blue-500">WordPress knowledge base active</span>
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