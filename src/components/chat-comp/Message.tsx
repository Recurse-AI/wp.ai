/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "@/context/ThemeProvider";
import "@fontsource/inter";
import { ChatMessage } from "@/lib/types/chat";
import toast from "react-hot-toast";
import { getToastStyle } from "@/lib/toastConfig";
import "./Message.css";
import UserMessage from "./UserMessage";
import AIMessage from "./AIMessage";
import ThinkAndSearchResultsPanel from "./ThinkAndSearchResultsPanel";
import { useWindowDimensions } from "@/lib/hooks/useMessageUI";
import { useStreaming } from "@/context/MessageStateContext";

// Default message when none is provided
const defaultMessage: ChatMessage = {
  id: "unknown",
  role: 'user',
  content: "No message available.",
  created_at: new Date().toISOString(),
  status: 'delivered',
};


interface MessageProps {
  message?: ChatMessage;
  onRegenerateMessage?: () => Promise<any>;
  isLatestMessage?: boolean;
}

// Main Message component
const Message = ({ message = defaultMessage, onRegenerateMessage }: MessageProps) => {
  const msg = message || defaultMessage;
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Access streaming context
  const { 
    currentPhase,
    id: activeStreamingId,
    setId,
  } = useStreaming();

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const responseContainerRef = useRef<HTMLDivElement | null>(null);
  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  const { theme } = useTheme();
  const windowSize = useWindowDimensions();



  useEffect(() => {
   //scroll to bottom of message container
   if(messageContainerRef.current) {
    messageContainerRef.current.scrollIntoView({ behavior: 'smooth' });
   }
  }, [currentPhase]);



  const handleEdit = () => {
    setIsEditing(true);
    setEditedMessage(msg.role === 'user' ? msg.content : "");
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustTextareaHeight();
      }
    }, 50);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    // In a real implementation, this would update the message in the backend
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    if (onRegenerateMessage && !isRegenerating) {
      setIsRegenerating(true);
      
      try {
        await onRegenerateMessage();
      } catch (error) {
        console.error("Error regenerating response:", error);
      } finally {
        setIsRegenerating(false);
      }
    }
  };

  // Adjust textarea height automatically when editing
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(
      'Code copied to clipboard!',
      { style: getToastStyle(theme) as React.CSSProperties }
    );
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const isUserMessage = msg.role === 'user';
  const isAssistantMessage = msg.role === 'assistant';

  return (
    <div 
      ref={messageContainerRef}
      className="message-container transition-all duration-300 opacity-100 visible-message flex justify-center w-full"
      style={{ 
        marginBottom: '1.5rem',
        position: 'relative',
        opacity: 1,
        visibility: 'visible',
        transform: 'translateZ(0)',  // Add hardware acceleration to improve stability
        willChange: 'transform',     // Hint to browser for optimization
        overflow: 'visible',         // Ensure no scrollbars in the container itself
        width: '100%',               // Force full width
        maxWidth: '50rem',           // Constrain to 50rem
        marginLeft: 'auto',
        marginRight: 'auto'
      }}
    >
      <div className="flex flex-col items-center w-full font-inter overflow-x-hidden">
        {isUserMessage && (
          <UserMessage
            content={msg.content}
            isEditing={isEditing}
            editedMessage={editedMessage}
            textareaRef={textareaRef}
            onEdit={handleEdit}
            onCancelEdit={handleCancelEdit}
            onSaveEdit={handleSaveEdit}
            onTextareaChange={handleTextareaChange}
            theme={theme}
          />
        )}

        {isAssistantMessage && !isEditing && (
          <>
              <ThinkAndSearchResultsPanel
                search_results={Array.isArray(msg?.search_results) ? msg?.search_results : []}
                thinking={msg?.thinking || ""}
                messageId={msg.id || "unknown"} // Pass message ID to panel
              />
              
            {/* AI Message (always visible) */}
            <div 
              className="ai-response-section completed w-full"
              data-section="response"
              style={{ 
                transition: 'opacity 0.3s ease',
                opacity: 1,
                visibility: 'visible',
                overflow: 'visible'  // Ensure no scrollbars
              }}
            >
                <AIMessage
                  content={msg.content}
                  theme={theme}
                  responseContainerRef={responseContainerRef}
                  onCopyCode={handleCopyCode}
                  copiedCode={copiedCode}
                  onRegenerate={onRegenerateMessage}
                  metadata={msg.metadata}
                  messageId={msg?.id || "unknown"}
                  disableActionButtons={msg?.metadata?.disableActionButtons || false}
                />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Message;
