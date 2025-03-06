"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { MessageOptions } from "@/lib/types/messageTypes";

interface MessageContextType {
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  lastMessage: string | null;
  setLastMessage: (message: string | null) => void;
  defaultOptions: MessageOptions;
  setDefaultOptions: (options: MessageOptions) => void;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [defaultOptions, setDefaultOptions] = useState<MessageOptions>({
    model: "openai",
    webSearch: false,
    temperature: 0.7,
  });

  return (
    <MessageContext.Provider 
      value={{
        isProcessing,
        setIsProcessing,
        lastMessage,
        setLastMessage,
        defaultOptions,
        setDefaultOptions,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessage = (): MessageContextType => {
  const context = useContext(MessageContext);
  
  if (context === undefined) {
    throw new Error("useMessage must be used within a MessageProvider");
  }
  
  return context;
};

// Helper to register the provider in the app
export const withMessageProvider = (Component: React.ComponentType<any>) => {
  return function WithMessageProvider(props: any) {
    return (
      <MessageProvider>
        <Component {...props} />
      </MessageProvider>
    );
  };
}; 