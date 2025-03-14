import { AIModel } from './aiModels';
import apiClient from './apiClient';
import { AxiosResponse, AxiosError } from 'axios';
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
  ChatFeedback,
  ChatSessionResponse,
  Message
} from '../types/chat';
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
  max_tokens: 2000,
  use_vector_search: false,
  is_new_chat: false,
  mode: 'default',
};

// Static cache to track non-existent sessions across instances
// Using id as key
const nonExistentSessionsCache = new Set<string>();

// Track API calls in progress to prevent duplicate calls
const pendingApiCalls = new Map<string, Promise<Message[]>>();

export class ChatService {
  private config: ChatConfig;
  private settings: ChatSettings;
  private id: string | null;
  private apiUrl: string;
  private storageListener: ((this: Window, ev: StorageEvent) => any) | null = null;

  constructor(config: Partial<ChatConfig> = {}, initialSettings?: Partial<ChatSettings>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.settings = {
      ...CHAT_CONFIG.DEFAULT_SETTINGS,
      ...initialSettings,
    };
    this.id = initialSettings?.id || null;
    this.apiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL || '';
    
    // Set extended_thinking parameter based on the model
    this.updateExtendedThinkingFromModel();
    
    // Initialize with localStorage value if available
    this.initFromLocalStorage();
    
    // Set up localStorage listener
    if (typeof window !== 'undefined') {
      this.setupLocalStorageListener();
    }
  }
  
  /**
   * Update extended_thinking parameter based on the selected model
   */
  private updateExtendedThinkingFromModel(): void {
    if (this.settings.model === 'claude-3-7-sonnet-thinking') {
      // Enable extended thinking for the thinking model variant
      this.settings.extended_thinking = true;
      this.settings.extended_thinking_budget = 1024;
      // Note: When sending to API, we'll use 'claude-3-7-sonnet' instead
    } else {
      this.settings.extended_thinking = false;
    }
  }
  
  /**
   * Initialize settings from localStorage if available
   */
  private initFromLocalStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const savedModel = localStorage.getItem('selectedAIModel');
        if (savedModel) {
          const { provider, model } = JSON.parse(savedModel);
          this.updateSettings({
            provider,
            model,
          });
        }
      } catch (error) {
        console.error('Error loading AI model from localStorage:', error);
      }
    }
  }
  
  /**
   * Set up listener for localStorage changes
   */
  private setupLocalStorageListener(): void {
    // Remove any existing listener
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
    }
    
    // Create and add new listener for changes from other tabs/windows
    this.storageListener = (event: StorageEvent) => {
      if (event.key === 'selectedAIModel' && event.newValue) {
        try {
          const { provider, model } = JSON.parse(event.newValue);
          this.updateSettings({
            provider,
            model,
          });
          console.log('ChatService updated with new AI model settings from another tab:', { provider, model });
        } catch (error) {
          console.error('Error parsing selectedAIModel from localStorage:', error);
        }
      }
    };
    
    window.addEventListener('storage', this.storageListener);
    
    // Also listen for a custom event for changes within the same window
    window.addEventListener('localStorageChange', ((event: CustomEvent) => {
      if (event.detail && event.detail.key === 'selectedAIModel' && event.detail.newValue) {
        try {
          const { provider, model } = JSON.parse(event.detail.newValue);
          this.updateSettings({
            provider,
            model,
          });
          console.log('ChatService updated with new AI model settings from same window:', { provider, model });
        } catch (error) {
          console.error('Error parsing selectedAIModel from custom event:', error);
        }
      }
    }) as EventListener);
  }
  
  /**
   * Clean up listener when service is destroyed
   */
  public cleanup(): void {
    if (typeof window !== 'undefined') {
      if (this.storageListener) {
        window.removeEventListener('storage', this.storageListener);
        // Also remove the custom event listener
        window.removeEventListener('localStorageChange', this.storageListener as EventListener);
        this.storageListener = null;
      }
    }
  }

  /**
   * Create or continue a conversation
   */
  async sendMessage(query: string, options: Partial<ChatSettings> = {}): Promise<ChatResponse> {
    // If model is claude-3-7-sonnet-thinking, ensure extended_thinking is true
    // but send claude-3-7-sonnet as the actual model name to the API
    let modelToSend = options.model || this.settings.model;
    
    if (modelToSend === 'claude-3-7-sonnet-thinking') {
      options.extended_thinking = true;
      options.extended_thinking_budget = options.extended_thinking_budget || this.settings.extended_thinking_budget;
      // Use the standard model name for the API call
      modelToSend = 'claude-3-7-sonnet';
    } else if (modelToSend === 'claude-3-7-sonnet') {
      options.extended_thinking = false;
      options.extended_thinking_budget = 0;
      this.updateExtendedThinkingFromModel();
    }
    
    const requestBody: ConversationRequest = {
      query,
      id: this.id || undefined,
      is_new_chat: options.is_new_chat || this.settings.is_new_chat,
      provider: options.provider || this.settings.provider,
      model: modelToSend,
      temperature: options.temperature || this.settings.temperature,
      max_tokens: options.max_tokens || this.settings.max_tokens,
      use_vector_search: options.use_vector_search || this.settings.use_vector_search,
      mode: options.mode || this.settings.mode,
      extended_thinking: options.extended_thinking || this.settings.extended_thinking || false,
      extended_thinking_budget: options.extended_thinking_budget || this.settings.extended_thinking_budget || 0,
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

      // Update id if this is a new chat
      if (!this.id) {
        this.id = data.id;
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
    if (!this.id) {
      throw new Error('No active session to regenerate response');
    }

    const requestBody: RegenerateRequest = {
      id: this.id,
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
  async getSessionHistory(): Promise<Message[]> {
    if (!this.id) {
      return [];
    }

    // Check if this session is known to not exist
    if (nonExistentSessionsCache.has(this.id)) {
      console.log(`Session ${this.id} is known to not exist, skipping API call`);
      return [];
    }

    // Check if there's already a pending API call for this session
    if (pendingApiCalls.has(this.id)) {
      console.log(`API call for session ${this.id} already in progress, reusing promise`);
      return pendingApiCalls.get(this.id)!;
    }

    // Create a new promise for this API call
    const apiCallPromise = (async () => {
      try {
        const response = await apiClient.get<ChatSessionResponse>(
          `${this.apiUrl}/get_history/?id=${this.id}`,
          { withCredentials: true }
        );

        // Remove from pending calls map once completed
        if (this.id) {
          pendingApiCalls.delete(this.id);
        }

        return response.data.messages || [];
      } catch (error) {
        console.error('Error fetching conversation history:', error);
        
        // Handle 404 errors gracefully
        const axiosError = error as AxiosError;
        if (axiosError.response && (axiosError.response.status === 404 || axiosError.response.status === 400)) {
          console.log(`Session ${this.id} not found or invalid, returning empty array`);
          
          // Add to cache of non-existent sessions
          if (this.id) {
            nonExistentSessionsCache.add(this.id);
          }
          
          return [];
        }
        
        throw error;
      } finally {
        // Always remove from pending calls map
        if (this.id) {
          pendingApiCalls.delete(this.id);
        }
      }
    })();

    // Store the promise in the map
    if (this.id) {
      pendingApiCalls.set(this.id, apiCallPromise);
    }

    return apiCallPromise;
  }

  /**
   * Get all conversations for the current user
   */
  async getAllConversations(page = 1, pageSize = 10): Promise<ChatHistoryResponse> {
    try {
      const response = await apiClient.get<ChatHistoryResponse>(
        `${this.apiUrl}/history/?page=${page}&page_size=${pageSize}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting all conversations:', error);
      throw error;
    }
  }

  /**
   * Get recent conversations for the current user
   */
  async getRecentConversations(limit = 5): Promise<ChatConversation[]> {
    try {
      const response = await apiClient.get<ChatConversation[]>(
        `${this.apiUrl}/history/recent/?limit=${limit}`,
        { withCredentials: true }
      );
      console.log(response.data, "response.data");
      return response.data;
    } catch (error) {
      console.error('Error getting recent conversations:', error);
      return [];
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(): Promise<ChatMessage[]> {
    return this.getSessionHistory();
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
      if (chatId === this.id) {
        this.id = null;
      }
      return true;
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  }

  /**
   * Update the title of a conversation
   */
  async updateChatTitle(chatId: string, title: string): Promise<ChatConversation> {
    try {
      const response = await apiClient.post<ChatConversation>(
        `${this.apiUrl}/history/${chatId}/rename/`,
        { title },
        { withCredentials: true }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error updating chat title:', error);
      throw error;
    }
  }

  /**
   * Set the conversation ID
   */
  setId(id: string | null): void {
    this.id = id;
  }

  /**
   * Update settings
   */
  updateSettings(newSettings: Partial<ChatSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    
    // Update extended_thinking settings when model changes
    if (newSettings.model) {
      this.updateExtendedThinkingFromModel();
    }
  }

  /**
   * Get current settings
   */
  getSettings(): ChatSettings {
    return this.settings;
  }

  /**
   * Get current conversation ID
   */
  getCurrentId(): string | null {
    return this.id;
  }

  /**
   * Clear a conversation from the non-existent sessions cache
   */
  clearNonExistentConversation(id: string): void {
    nonExistentSessionsCache.delete(id);
  }

  /**
   * Get all non-existent conversations
   */
  static getNonExistentConversations(): string[] {
    return Array.from(nonExistentSessionsCache);
  }
}

// Create and export a default instance of the ChatService
export const chatService = new ChatService(); 