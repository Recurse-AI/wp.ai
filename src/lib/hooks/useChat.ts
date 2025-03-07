import { useState, useCallback } from 'react';
import { ChatService } from '../services/chatService';
import { ChatResponse } from '../types/chat';
import { ChatSettings } from '../services/chatConfig';

export const useChat = (initialOptions?: Partial<ChatSettings>) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [chatService] = useState(() => new ChatService(undefined, initialOptions));

  const sendMessage = useCallback(async (message: string, options?: Partial<ChatSettings>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await chatService.sendMessage(message, options);
      setLoading(false);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      setLoading(false);
      throw err;
    }
  }, [chatService]);

  const updateSettings = useCallback((settings: Partial<ChatSettings>) => {
    chatService.updateSettings(settings);
  }, [chatService]);

  return {
    sendMessage,
    updateSettings,
    loading,
    error,
    getSettings: chatService.getSettings.bind(chatService),
  };
}; 