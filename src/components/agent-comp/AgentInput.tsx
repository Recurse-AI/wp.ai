"use client";
import React, { useState, useRef } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { SendHorizontal, RefreshCw } from "lucide-react";

interface AgentInputProps {
  onSendMessage: (message: string) => Promise<any>;
  disabled?: boolean;
  onRegenerateMessage?: () => Promise<any>;
  showRegenerateButton?: boolean;
}

const AgentInput: React.FC<AgentInputProps> = ({
  onSendMessage,
  disabled = false,
  onRegenerateMessage,
  showRegenerateButton = false
}) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle input change and auto-resize
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 120)}px`; // Max 120px
    }
  };

  // Handle key press (Enter to submit)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Handle message submission
  const handleSubmit = async () => {
    if (!message.trim() || disabled) return;
    
    try {
      await onSendMessage(message);
      
      // Clear the input
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        {/* Regenerate button */}
        {showRegenerateButton && onRegenerateMessage && (
          <button
            onClick={() => onRegenerateMessage()}
            disabled={disabled}
            className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm ${
              disabled
                ? "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
            }`}
            title="Regenerate response"
          >
            <RefreshCw size={16} />
            <span>Regenerate</span>
          </button>
        )}
      </div>
      
      <div className={`flex items-end rounded-lg border mt-2 ${
        theme === "dark" 
          ? "bg-gray-800 border-gray-700" 
          : "bg-white border-gray-200"
      } overflow-hidden`}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your code or request changes..."
          className={`flex-1 resize-none outline-none py-3 px-4 min-h-[40px] max-h-[120px] ${
            theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-800"
          }`}
          disabled={disabled}
        />
        
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          className={`p-3 ${
            message.trim() && !disabled
              ? "text-blue-500 hover:text-blue-600"
              : "text-gray-400"
          }`}
        >
          <SendHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
        {disabled ? "Processing your request..." : "The agent will help you understand and modify your code."}
      </div>
    </div>
  );
};

export default AgentInput; 