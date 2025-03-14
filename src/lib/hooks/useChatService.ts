import { useState, useCallback, useEffect } from 'react';
import { ChatService } from '../services/chatService';
import { ChatResponse } from '../types/chat';
import { ChatSettings } from '../services/chatConfig';

interface UseChatServiceOptions {
  initialSettings?: Partial<ChatSettings>;
  onError?: (error: Error) => void;
}

interface ChatState {
  loading: boolean;
  error: Error | null;
  messages: ChatResponse[];
}

export function useChatService({ initialSettings, onError }: UseChatServiceOptions = {}) {
  const [chatService] = useState(() => new ChatService(initialSettings));
  const [state, setState] = useState<ChatState>({
    loading: false,
    error: null,
    messages: [],
  });

  // Load conversation history when id changes
  useEffect(() => {
    const id = chatService.getCurrentId();
    if (id) {
      loadConversationHistory();
    }
  }, [chatService.getCurrentId()]);

  // Clean up the chatService when the component unmounts
  useEffect(() => {
    return () => {
      chatService.cleanup();
    };
  }, [chatService]);

  const loadConversationHistory = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      const history = await chatService.getConversationHistory();
      
      // Map ChatMessage[] to ChatResponse[] by adding missing properties
      const messagesAsResponses = history.map(msg => ({
        ...msg,
        response: msg.content,
        id: chatService.getCurrentId() || ''
      }));
      
      setState(prev => ({
        ...prev,
        loading: false,
        messages: messagesAsResponses,
      }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load conversation history');
      setState(prev => ({ ...prev, loading: false, error }));
      onError?.(error);
    }
  }, [chatService, onError]);

  const sendMessage = useCallback(async (message: string, options?: Partial<ChatSettings>) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      const response = await chatService.sendMessage(message, options);
      setState(prev => ({
        ...prev,
        loading: false,
        messages: [...prev.messages, response],
      }));
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send message');
      setState(prev => ({ ...prev, loading: false, error }));
      onError?.(error);
      throw error;
    }
  }, [chatService, onError]);

  const updateSettings = useCallback((newSettings: Partial<ChatSettings>) => {
    chatService.updateSettings(newSettings);
  }, [chatService]);

  const setId = useCallback((id: string | null) => {
    chatService.setId(id);
  }, [chatService]);

  return {
    ...state,
    sendMessage,
    updateSettings,
    setId,
    getSettings: chatService.getSettings.bind(chatService),
    getCurrentId: chatService.getCurrentId.bind(chatService),
  };
} 