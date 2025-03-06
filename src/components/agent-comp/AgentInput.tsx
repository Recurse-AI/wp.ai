"use client";
import { useSession } from "next-auth/react";
import React from "react";
import MessageInput from "@/components/ui/MessageInput";
import { agentMessageService } from "@/lib/services/messageService";
import toast from "react-hot-toast";

interface AgentInputProps {
  sessionId: string | null;
  projectId: string;
  onMessageSent: (message: string, response: string, codeChanges?: any[]) => void;
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
  const { data: session } = useSession();

  // Handle message submission
  const handleSubmit = async (message: string, options: any = {}) => {
    if (!message.trim() || isProcessing) return;
    
    try {
      setIsProcessing(true);
      
      // Send message to agent
      const result = await agentMessageService.sendAgentMessage(
        projectId,
        sessionId,
        message,
        options
      );
      
      if (result.success && result.data) {
        const { response, codeChanges } = result.data;
        onMessageSent(message, response, codeChanges);
      } else {
        throw new Error(result.message || "Failed to process your request");
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full">
      <MessageInput
        onSubmit={handleSubmit}
        isProcessing={isProcessing}
        placeholder="Ask about your code or request changes..."
        modelSelection={true}
        webSearch={true}
        className="w-full"
      />
      
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
        The agent will help you understand and modify your code.
      </div>
    </div>
  );
};

export default AgentInput; 