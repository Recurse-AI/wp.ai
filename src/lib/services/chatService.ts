import { AIModel } from './aiModels';
import apiClient from './apiClient';
import { AxiosResponse } from 'axios';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_id?: string;
  created_at?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
  model: string;
  provider: string;
}

export interface ChatOptions {
  model: AIModel;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * Send a message to the chat API
 * @param chatId - The ID of the existing chat, or null for a new chat
 * @param message - The message content to send
 * @param options - Chat configuration options
 * @returns Response with chat ID, message ID, and response text
 */
export const sendChatMessage = async (
  chatId: string | null,
  message: string,
  options: ChatOptions
): Promise<{ 
  chatId: string; 
  messageId: string; 
  response: string; 
  isNewChat: boolean 
}> => {
  try {
    // Determine if this is a new chat or continuing an existing one
    const isNewChat = !chatId;
    const endpoint = '/api/chat';
    
    const payload = {
      prompt: message,
      model_id: options.model.id,
      provider: options.model.provider,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || options.model.maxTokens,
      stream: options.stream || false,
      ...(chatId ? { group_id: chatId } : {})
    };
    
    const response: AxiosResponse = await apiClient.post(endpoint, payload);
    const data = response.data;
    
    return {
      chatId: data.chat_group.group_id,
      messageId: data.chat_message.message_id,
      response: data.chat_message.ai_response,
      isNewChat
    };
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

/**
 * Fetch chat history
 * @returns List of chat sessions
 */
export const fetchChatHistory = async (): Promise<ChatSession[]> => {
  try {
    const endpoint = '/api/chat/history';
    const response: AxiosResponse = await apiClient.get(endpoint);
    
    return response.data.chats || [];
  } catch (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }
};

/**
 * Fetch messages for a specific chat
 * @param chatId - The ID of the chat to fetch messages for
 * @returns List of chat messages
 */
export const fetchChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  try {
    const endpoint = `/api/chat/${chatId}`;
    const response: AxiosResponse = await apiClient.get(endpoint);
    
    // Transform API response to our ChatMessage format
    return response.data.messages.map((msg: any) => ({
      role: msg.owner_name === 'You' ? 'user' : 'assistant',
      content: msg.owner_name === 'You' ? msg.user_prompt : msg.ai_response,
      message_id: msg.message_id,
      created_at: msg.created_at
    }));
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
};

/**
 * Delete a chat session
 * @param chatId - The ID of the chat to delete
 * @returns Success boolean
 */
export const deleteChatSession = async (chatId: string): Promise<boolean> => {
  try {
    const endpoint = `/api/chat/${chatId}`;
    await apiClient.delete(endpoint);
    
    return true;
  } catch (error) {
    console.error('Error deleting chat session:', error);
    throw error;
  }
}; 