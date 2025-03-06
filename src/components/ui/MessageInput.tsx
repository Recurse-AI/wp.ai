"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { Textarea } from "./textarea";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSubmit: (message: string, options?: any) => void;
  isProcessing?: boolean;
  placeholder?: string;
  modelSelection?: boolean;
  webSearch?: boolean;
  className?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSubmit,
  isProcessing = false,
  placeholder = "Type your message...",
  modelSelection = false,
  webSearch = false,
  className,
}) => {
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState({
    model: "default",
    webSearch: false,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!message.trim() || isProcessing) return;
    
    onSubmit(message, options);
    setMessage("");
    
    // Reset height after submission
    if (textareaRef.current) {
      textareaRef.current.style.height = "inherit";
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setOptions((prev) => ({ ...prev, model: e.target.value }));
  };

  const toggleWebSearch = () => {
    setOptions((prev) => ({ ...prev, webSearch: !prev.webSearch }));
  };

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      {modelSelection && (
        <div className="flex items-center space-x-2 text-sm">
          <label htmlFor="model-select" className="text-gray-500 dark:text-gray-400">
            Model:
          </label>
          <select
            id="model-select"
            className="bg-transparent border border-gray-300 dark:border-gray-700 rounded px-2 py-1"
            onChange={handleModelChange}
            value={options.model}
          >
            <option value="default">Default</option>
            <option value="gpt-4">GPT-4</option>
            <option value="claude-3">Claude 3</option>
          </select>
          
          {webSearch && (
            <div className="flex items-center ml-4">
              <input
                type="checkbox"
                id="web-search"
                checked={options.webSearch}
                onChange={toggleWebSearch}
                className="mr-2"
              />
              <label htmlFor="web-search" className="text-gray-500 dark:text-gray-400">
                Enable web search
              </label>
            </div>
          )}
        </div>
      )}
      
      <div className="flex items-end space-x-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[60px] flex-1 resize-none p-2"
          disabled={isProcessing}
        />
        <Button 
          onClick={handleSubmit} 
          disabled={!message.trim() || isProcessing}
          className="h-10"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin"></div>
          ) : (
            "Send"
          )}
        </Button>
      </div>
    </div>
  );
};

export default MessageInput; 