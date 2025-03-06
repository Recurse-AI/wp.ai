"use client";
import React from "react";
import MessageRenderer from "@/components/ui/MessageRenderer";

interface AgentMessageProps {
  role: 'user' | 'agent';
  content: string;
  timestamp?: Date;
  isProcessing?: boolean;
  animate?: boolean;
}

const AgentMessage: React.FC<AgentMessageProps> = ({
  role,
  content,
  timestamp,
  isProcessing = false,
  animate = false,
}) => {
  // Map agent role to the format expected by MessageRenderer
  const mappedRole = role === 'agent' ? 'assistant' : 'user';
  
  return (
    <MessageRenderer
      content={isProcessing ? "Thinking..." : content}
      role={mappedRole}
      timestamp={timestamp}
      animate={animate && !isProcessing}
    />
  );
};

export default AgentMessage; 