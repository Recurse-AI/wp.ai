import { AIModel } from './aiModels';
import apiClient from './apiClient';
import { AxiosResponse } from 'axios';
import { ChatMessage, ChatResponse, ChatOptions, ChatConfig } from '../types/chat';
import { CHAT_CONFIG, ChatSettings } from './chatConfig';

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
  model: string;
  provider: string;
}

const DEFAULT_CONFIG: ChatConfig = {
  provider: 'openai',
  model: 'gpt-4o',
  temperature: 0.7,
  max_tokens: 1000,
  use_vector_search: false,
};

export class ChatService {
  private config: ChatConfig;
  private settings: ChatSettings;
  private sessionId: string | null;

  constructor(config: Partial<ChatConfig> = {}, initialSettings?: Partial<ChatSettings>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.settings = {
      ...CHAT_CONFIG.DEFAULT_SETTINGS,
      ...initialSettings,
    };
    this.sessionId = initialSettings?.session_id || null;
  }

  async sendMessage(query: string, options: Partial<ChatSettings> = {}): Promise<ChatResponse> {
    const requestBody = {
      query,
      session_id: this.sessionId || crypto.randomUUID(),
      provider: options.provider || this.settings.provider,
      model: options.model || this.settings.model,
      temperature: options.temperature || this.settings.temperature,
      max_tokens: options.max_tokens || this.settings.max_tokens,
      use_vector_search: options.use_vector_search ?? this.settings.use_vector_search
    };

    try {
      const response = await apiClient.post(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      const data = response.data;

      // Update session ID if this is a new chat
      if (!this.sessionId) {
        this.sessionId = data.session_id;
      }

      return {
        response: data.response,
        response_time: data.response_time,
        provider: data.provider,
        model: data.model,
        used_vector_search: data.used_vector_search,
        session_id: data.session_id,
        conversation: {
          id: data.conversation.id,
          title: data.conversation.title,
          created_at: data.conversation.created_at,
          updated_at: data.conversation.updated_at,
        },
      };
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  async getConversationHistory(): Promise<ChatResponse[]> {
    if (!this.sessionId) {
      return [];
    }

    try {
      const response = await apiClient.get(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/${this.sessionId}`,
        { withCredentials: true }
      );

      return response.data.messages.map((msg: any) => ({
        response: msg.response,
        response_time: msg.response_time,
        provider: msg.provider,
        model: msg.model,
        used_vector_search: msg.used_vector_search,
        session_id: msg.session_id,
        conversation: {
          id: msg.conversation.id,
          title: msg.conversation.title,
          created_at: msg.conversation.created_at,
          updated_at: msg.conversation.updated_at,
        },
      }));
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  }

  setSessionId(sessionId: string | null): void {
    this.sessionId = sessionId;
  }

  updateSettings(newSettings: Partial<ChatSettings>): void {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
  }

  getSettings(): ChatSettings {
    return { ...this.settings };
  }

  getCurrentSessionId(): string | null {
    return this.sessionId;
  }

  async deleteChatSession(chatId: string): Promise<boolean> {
    try {
      await apiClient.delete(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/${chatId}`,
        { withCredentials: true }
      );
      if (chatId === this.sessionId) {
        this.sessionId = null;
      }
      return true;
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  }
} 