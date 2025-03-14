import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { ConversationRequest } from '@/lib/types/chat';

/**
 * POST /api/chat/conversation - Create or continue a conversation
 * 
 * Body:
 * - query: string - The message to send
 * - id?: string - Existing ID (if continuing a conversation)
 * - is_new_chat?: boolean - Whether this is a new chat
 * - provider?: string - The provider ID
 * - model?: string - The model ID to use
 * - temperature?: number - Temperature parameter for generation
 * - max_tokens?: number - Maximum tokens to generate
 * 
 * Returns:
 * - response: string - The AI response
 * - id: string - The conversation ID
 * - title: string - The conversation title
 * - created_at: string - Creation timestamp
 * - updated_at: string - Update timestamp
 * - is_new_chat: boolean - Whether this is a new chat
 * - provider_used: string - The provider used
 * - model_used: string - The model used
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { query, id, is_new_chat, provider, model, temperature, max_tokens } = body as ConversationRequest;

    // Validate required fields
    if (!query) {
      return NextResponse.json(
        { message: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Generate a new ID if not provided
    const currentId = id || uuidv4();
    const isNewChat = is_new_chat || !id;
    
    // In a real implementation, you would call your AI service
    // For now, we'll simulate a response
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create a simulated response
    const simulatedResponse = {
      response: `This is a simulated response to: "${query}"`,
      id: currentId,
      title: isNewChat ? generateTitle(query) : "Existing Conversation",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_new_chat: isNewChat,
      provider_used: provider || 'openai',
      model_used: model || 'gpt-4',
    };
    
    // Return the response
    return NextResponse.json(simulatedResponse);
  } catch (error: any) {
    console.error('Chat API error:', error);
    
    // Proper error handling with status codes
    if (error.response) {
      // External API returned error
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error processing chat request',
          error: error.response.data 
        },
        { status: error.response.status || 500 }
      );
    }
    
    // General error handling
    return NextResponse.json(
      { message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate a title from the first message
function generateTitle(message: string): string {
  // Truncate the message if it's too long
  const truncated = message.length > 30 ? message.substring(0, 30) + '...' : message;
  return truncated;
} 