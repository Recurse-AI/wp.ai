import apiClient from './apiClient';
import {
  ChatConversation,
  ChatHistoryResponse,
  MessageGroup,
  SharedConversation,
  SharedMessage
} from '../types/chat';

/**
 * ChatService class for handling all chat-related REST API endpoints
 */
export class ChatService {
  private BASE_PATH = '/api/chat';

  /**
   * Get all chat conversations with pagination
   * @param page Optional page number
   * @param limit Optional limit per page
   * @returns ChatHistoryResponse with paginated conversations
   */
  async getChatHistory(page: number = 1, limit: number = 10): Promise<ChatHistoryResponse> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/history/`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }

  /**
   * Get recent chat conversations
   * @param limit Number of recent conversations to fetch
   * @returns Array of ChatConversation objects
   */
  async getRecentConversations(limit: number = 10): Promise<ChatConversation[]> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/history/recent/`, {
        params: { limit }
      });
      // console.log('🔄 ChatService: Recent conversations:', response.data);
        return response.data;
    } catch (error) {
      console.error('Error fetching recent conversations:', error);
      throw error;
    }
  }

  /**
   * Get a specific chat conversation by ID
   * @param conversationId The ID of the conversation to fetch
   * @returns ChatConversation object
   */
  async getConversation(conversationId: string): Promise<ChatConversation> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/history/${conversationId}/`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new chat conversation
   * @param title Optional title for the conversation
   * @param metadata Optional metadata for the conversation
   * @returns The created ChatConversation object
   */
  async createConversation(
    title?: string,
    conversationType: 'chat' | 'agent' = 'chat',
    provider?: string,
    model?: string,
    metadata?: Record<string, any>
  ): Promise<ChatConversation> {
    try {
      const payload = {
        title: title || 'New Conversation',
        conversation_type: conversationType,
        provider,
        model,
        metadata
      };
      
      const response = await apiClient.post(`${this.BASE_PATH}/history/`, payload);
      return response.data;
    } catch (error) {
      console.error('Error creating new conversation:', error);
      throw error;
    }
  }

  /**
   * Delete a chat conversation
   * @param conversationId ID of the conversation to delete
   * @returns Boolean indicating success
   */
  async deleteChatSession(conversationId: string): Promise<boolean> {
    try {
      await apiClient.delete(`${this.BASE_PATH}/history/${conversationId}/`);
      return true;
    } catch (error) {
      console.error(`Error deleting conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Rename a chat conversation
   * @param conversationId ID of the conversation to rename
   * @param newTitle New title for the conversation
   * @returns Updated ChatConversation object
   */
  async renameConversation(conversationId: string, newTitle: string): Promise<ChatConversation> {
    try {
      const response = await apiClient.post(`${this.BASE_PATH}/history/${conversationId}/rename/`, {
        title: newTitle
      });
      return response.data;
    } catch (error) {
      console.error(`Error renaming conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Update conversation metadata
   * @param conversationId ID of the conversation to update
   * @param metadata New metadata object
   * @returns Updated ChatConversation object
   */
  async updateConversationMetadata(
    conversationId: string,
    metadata: Record<string, any>
  ): Promise<ChatConversation> {
    try {
      const response = await apiClient.patch(`${this.BASE_PATH}/history/${conversationId}/`, {
        metadata
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating conversation metadata ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Archive or unarchive a conversation
   * @param conversationId ID of the conversation to update
   * @param isArchived Boolean indicating whether to archive or unarchive
   * @returns Updated ChatConversation object
   */
  async setConversationArchived(
    conversationId: string,
    isArchived: boolean
  ): Promise<ChatConversation> {
    try {
      const response = await apiClient.patch(`${this.BASE_PATH}/history/${conversationId}/`, {
        is_archived: isArchived
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating conversation archive status ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Pin or unpin a conversation
   * @param conversationId ID of the conversation to update
   * @param isPinned Boolean indicating whether to pin or unpin
   * @returns Updated ChatConversation object 
   */
  async setConversationPinned(
    conversationId: string,
    isPinned: boolean
  ): Promise<ChatConversation> {
    try {
      const response = await apiClient.patch(`${this.BASE_PATH}/history/${conversationId}/`, {
        is_pinned: isPinned
      });
      return response.data;
    } catch (error) {
      console.error(`Error updating conversation pin status ${conversationId}:`, error);
      throw error;
    }
  }

  // Message Group methods

  /**
   * Get message groups for a conversation
   * @param conversationId Conversation ID
   * @param page Optional page number
   * @param limit Optional limit per page
   * @returns MessageGroup array with pagination info
   */
  async getMessageGroups(
    conversationId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ results: MessageGroup[], count: number, next: string | null, previous: string | null }> {
    try {
      const response = await apiClient.get(
        `${this.BASE_PATH}/conversations/${conversationId}/message-groups/`,
        { params: { page, limit } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching message groups for conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific message group
   * @param conversationId Conversation ID
   * @param messageGroupId Message group ID
   * @returns MessageGroup object
   */
  async getMessageGroup(conversationId: string, messageGroupId: string): Promise<MessageGroup> {
    try {
      const response = await apiClient.get(
        `${this.BASE_PATH}/conversations/${conversationId}/message-groups/${messageGroupId}/`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching message group ${messageGroupId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new message group in a conversation
   * @param conversationId Conversation ID
   * @param userContent User's message content
   * @param systemContent Optional system message content
   * @param metadata Optional metadata
   * @returns Created MessageGroup object
   */
  async createMessageGroup(
    conversationId: string,
    userContent: string,
    systemContent?: string,
    metadata?: Record<string, any>
  ): Promise<MessageGroup> {
    try {
      const payload = {
        user_content: userContent,
        system_content: systemContent,
        metadata
      };
      
      const response = await apiClient.post(
        `${this.BASE_PATH}/conversations/${conversationId}/message-groups/`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error(`Error creating message group in conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Add feedback to a message
   * @param conversationId Conversation ID
   * @param messageId Message ID
   * @param feedback Feedback object (can include upvote, downvote, or other feedback)
   * @returns Updated MessageGroup with feedback
   */
  async addMessageFeedback(
    conversationId: string,
    messageId: string,
    feedback: { upvote?: boolean, downvote?: boolean, feedback_text?: string }
  ): Promise<MessageGroup> {
    try {
      const response = await apiClient.post(
        `${this.BASE_PATH}/history/${conversationId}/messages/${messageId}/feedback/`,
        feedback
      );
      return response.data;
    } catch (error) {
      console.error(`Error adding feedback to message ${messageId}:`, error);
      throw error;
    }
  }

  // Shared conversation methods

  /**
   * Share a conversation
   * @param conversationId Conversation ID to share
   * @param shareTitle Optional custom title for sharing
   * @param shareDescription Optional description for sharing
   * @returns SharedConversation object
   */
  async shareConversation(
    conversationId: string,
    shareTitle?: string,
    shareDescription?: string
  ): Promise<SharedConversation> {
    try {
      const payload = {
        conversation: conversationId,
        share_title: shareTitle,
        share_description: shareDescription
      };
      
      const response = await apiClient.post(`${this.BASE_PATH}/shared/`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error sharing conversation ${conversationId}:`, error);
      throw error;
    }
  }

  /**
   * Get list of shared conversations
   * @returns Array of SharedConversation objects
   */
  async getSharedConversations(): Promise<SharedConversation[]> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/shared/list/`);
      return response.data.results;
    } catch (error) {
      console.error('Error fetching shared conversations:', error);
      throw error;
    }
  }

  /**
   * View a shared conversation by ID
   * @param sharedId Shared conversation ID
   * @returns SharedConversation object with messages
   */
  async viewSharedConversation(sharedId: string): Promise<SharedConversation> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/shared/${sharedId}/view/`);
      return response.data;
    } catch (error) {
      console.error(`Error viewing shared conversation ${sharedId}:`, error);
      throw error;
    }
  }

  // Shared message methods

  /**
   * Share a specific message
   * @param conversationId Conversation ID
   * @param messageGroupId Message group ID to share
   * @returns SharedMessage object
   */
  async shareMessage(
    conversationId: string,
    messageGroupId: string
  ): Promise<SharedMessage> {
    try {
      const payload = {
        conversation: conversationId,
        message_group: messageGroupId
      };
      
      const response = await apiClient.post(`${this.BASE_PATH}/shared/messages/`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error sharing message ${messageGroupId}:`, error);
      throw error;
    }
  }

  /**
   * Get list of shared messages
   * @returns Array of SharedMessage objects
   */
  async getSharedMessages(): Promise<SharedMessage[]> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/shared/messages/list/`);
      return response.data.results;
    } catch (error) {
      console.error('Error fetching shared messages:', error);
      throw error;
    }
  }

  /**
   * View a shared message by ID
   * @param sharedId Shared message ID
   * @returns SharedMessage object with message_group_data
   */
  async viewSharedMessage(sharedId: string): Promise<SharedMessage> {
    try {
      const response = await apiClient.get(`${this.BASE_PATH}/shared/messages/${sharedId}/view/`);
      return response.data;
    } catch (error) {
      console.error(`Error viewing shared message ${sharedId}:`, error);
      throw error;
    }
  }
}

export default ChatService; 