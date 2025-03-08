import { AIModel } from './aiModels';
import apiClient from './apiClient';
import { AxiosResponse } from 'axios';
import { 
  ChatMessage, 
  ChatResponse, 
  ChatOptions, 
  ChatConfig, 
  ChatConversation, 
  ChatHistoryResponse, 
  ChatMessagesResponse,
  RegenerateRequest,
  ConversationRequest,
  ChatFeedback
} from '../types/chat';
import { CHAT_CONFIG, ChatSettings } from './chatConfig';

export interface ChatSession {
  id: string;
  session_id: string;
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
};

export class ChatService {
  private config: ChatConfig;
  private settings: ChatSettings;
  private sessionId: string | null;
  private apiUrl: string;

  constructor(config: Partial<ChatConfig> = {}, initialSettings?: Partial<ChatSettings>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.settings = {
      ...CHAT_CONFIG.DEFAULT_SETTINGS,
      ...initialSettings,
    };
    this.sessionId = initialSettings?.session_id || null;
    this.apiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL || '';
  }

  /**
   * Create or continue a conversation
   */
  async sendMessage(query: string, options: Partial<ChatSettings> = {}): Promise<ChatResponse> {
    const requestBody: ConversationRequest = {
      query,
      session_id: this.sessionId || undefined,
      provider: options.provider || this.settings.provider,
      model: options.model || this.settings.model,
      temperature: options.temperature || this.settings.temperature,
      max_tokens: options.max_tokens || this.settings.max_tokens,
      use_vector_search: options.use_vector_search || this.settings.use_vector_search,
    };

    try {
      const response = await apiClient.post<ChatResponse>(
        `${this.apiUrl}/conversation/`,
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

      return data;
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }

  /**
   * Regenerate a response
   */
  async regenerateResponse(messageId?: string): Promise<ChatResponse> {
    if (!this.sessionId) {
      throw new Error('No active session to regenerate response');
    }

    const requestBody: RegenerateRequest = {
      session_id: this.sessionId,
      message_id: messageId
    };

    try {
      const response = await apiClient.post<ChatResponse>(
        `${this.apiUrl}/conversation/regenerate/`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error regenerating response:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a specific session
   */
  async getConversationHistory(): Promise<ChatMessage[]> {
    if (!this.sessionId) {
      return [];
    }

    try {
      const response = await apiClient.get<ChatMessagesResponse>(
        `${this.apiUrl}/get_history/?session_id=${this.sessionId}`,
        { withCredentials: true }
      );

      return response.data.results;
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  }

  /**
   * Get all conversations
   */
  async getAllConversations(page = 1, pageSize = 10): Promise<ChatHistoryResponse> {
    try {
      const response = await apiClient.get<ChatHistoryResponse>(
        `${this.apiUrl}/history/?page=${page}&page_size=${pageSize}`,
        { withCredentials: true }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching all conversations:', error);
      throw error;
    }
  }

  /**
   * Get recent conversations
   */
  async getRecentConversations(limit = 5): Promise<ChatConversation[]> {
    try {
      const response = await apiClient.get<ChatConversation[]>(
        `${this.apiUrl}/history/recent/?limit=${limit}`,
        { withCredentials: true }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching recent conversations:', error);
      throw error;
    }
  }

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(conversationId: string, page = 1, pageSize = 20): Promise<ChatMessagesResponse> {
    try {
      const response = await apiClient.get<ChatMessagesResponse>(
        `${this.apiUrl}/history/${conversationId}/messages/?page=${page}&page_size=${pageSize}`,
        { withCredentials: true }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      throw error;
    }
  }

  /**
   * Add a message to a conversation
   */
  async addMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string, metadata?: Record<string, any>): Promise<ChatMessage> {
    try {
      const response = await apiClient.post<ChatMessage>(
        `${this.apiUrl}/history/${conversationId}/messages/`,
        {
          role,
          content,
          metadata
        },
        { withCredentials: true }
      );

      return response.data;
    } catch (error) {
      console.error('Error adding message to conversation:', error);
      throw error;
    }
  }

  /**
   * Provide feedback on a message
   */
  async provideFeedback(conversationId: string, messageId: string, feedbackType: 'upvote' | 'downvote' | 'flag', comment?: string): Promise<any> {
    try {
      const response = await apiClient.post(
        `${this.apiUrl}/history/${conversationId}/messages/${messageId}/feedback/`,
        {
          feedback_type: feedbackType,
          comment
        },
        { withCredentials: true }
      );

      return response.data;
    } catch (error) {
      console.error('Error providing feedback:', error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteChatSession(chatId: string): Promise<boolean> {
    try {
      await apiClient.delete(
        `${this.apiUrl}/history/${chatId}/`,
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
} 