import { MessageOptions, MessageResponse } from '@/lib/types/messageTypes';

// Base message service for common functionality
export const baseMessageService = {
  // Format the model parameter for API requests
  formatModelParam: (model: string = 'openai'): string => {
    const modelMap: Record<string, string> = {
      'openai': 'gpt-4o',
      'anthropic': 'claude-3-opus',
      'gemini': 'gemini-pro',
      'mistral': 'mistral-large',
    };
    
    return modelMap[model] || 'gpt-4o';
  },
  
  // Generic error handler for API requests
  handleApiError: (error: any): MessageResponse => {
    console.error('API Error:', error);
    return {
      success: false,
      message: error.message || 'An unexpected error occurred',
    };
  }
};

// Chat message service
export const chatMessageService = {
  // Send a message in the chat component
  sendChatMessage: async (
    chatId: string,
    message: string,
    options: MessageOptions = {}
  ): Promise<MessageResponse> => {
    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          message,
          model: baseMessageService.formatModelParam(options.model),
          webSearch: options.webSearch || false,
          temperature: options.temperature || 0.7,
          systemPrompt: options.systemPrompt,
          attachments: options.attachments || [],
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message');
      }
      
      return {
        success: true,
        message: 'Message sent successfully',
        data,
      };
    } catch (error) {
      return baseMessageService.handleApiError(error);
    }
  },
  
  // Retrieve chat history
  getChatHistory: async (chatId: string): Promise<MessageResponse> => {
    try {
      const response = await fetch(`/api/chat/${chatId}/history`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch chat history');
      }
      
      return {
        success: true,
        message: 'Chat history retrieved successfully',
        data,
      };
    } catch (error) {
      return baseMessageService.handleApiError(error);
    }
  },
};

// Agent message service
export const agentMessageService = {
  // Send a message to the agent component
  sendAgentMessage: async (
    projectId: string,
    sessionId: string | null,
    message: string,
    options: MessageOptions = {}
  ): Promise<MessageResponse> => {
    try {
      const response = await fetch('/api/agent/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          sessionId,
          message,
          model: baseMessageService.formatModelParam(options.model),
          webSearch: options.webSearch || false,
          temperature: options.temperature || 0.7,
          systemPrompt: options.systemPrompt,
          attachments: options.attachments || [],
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send message to agent');
      }
      
      return {
        success: true,
        message: 'Message sent to agent successfully',
        data,
      };
    } catch (error) {
      return baseMessageService.handleApiError(error);
    }
  },
  
  // Get agent session history
  getAgentHistory: async (sessionId: string): Promise<MessageResponse> => {
    try {
      const response = await fetch(`/api/agent/session/${sessionId}/history`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch agent session history');
      }
      
      return {
        success: true,
        message: 'Agent session history retrieved successfully',
        data,
      };
    } catch (error) {
      return baseMessageService.handleApiError(error);
    }
  },
}; 