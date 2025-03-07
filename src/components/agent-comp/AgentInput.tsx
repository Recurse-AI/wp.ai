"use client";
import React, { useState, useRef } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { SendHorizontal } from "lucide-react";

interface AgentInputProps {
  sessionId: string | null;
  projectId: string;
  onMessageSent: (message: string) => Promise<void>;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
}

const AgentInput: React.FC<AgentInputProps> = ({
  sessionId,
  projectId,
  onMessageSent,
  isProcessing,
  setIsProcessing
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
    if (!message.trim() || isProcessing) return;
    
    try {
      setIsProcessing(true);
      await onMessageSent(message);
      
      // Clear the input
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <div className={`flex items-end rounded-lg border ${
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
          disabled={isProcessing}
        />
        
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isProcessing}
          className={`p-3 ${
            message.trim() && !isProcessing
              ? "text-blue-500 hover:text-blue-600"
              : "text-gray-400"
          }`}
        >
          <SendHorizontal className="w-5 h-5" />
        </button>
      </div>
      
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
        {isProcessing ? "Processing your request..." : "The agent will help you understand and modify your code."}
      </div>
    </div>
  );
};

export default AgentInput; 