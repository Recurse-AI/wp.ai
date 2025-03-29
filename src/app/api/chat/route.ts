import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { ConversationRequest, RegenerateRequest } from '@/lib/types/chat';

/**
 * POST /api/chat/conversation - Create or continue a conversation
 * 
 * Body:
 * - query: string - The message to send
 * - session_id?: string - Existing session ID (if continuing a conversation)
 * - provider?: string - The provider ID
 * - model?: string - The model ID to use
 * - temperature?: number - Temperature parameter for generation
 * - max_tokens?: number - Maximum tokens to generate
 * 
 * Returns:
 * - response: string - The AI response
 * - session_id: string - The session ID
 * - conversation_id: string - The conversation ID
 * - title: string - The conversation title
 * - created_at: string - Creation timestamp
 * - updated_at: string - Update timestamp
 * - is_new_session: boolean - Whether this is a new session
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
    const { query, id, provider, model, temperature, max_tokens } = body as ConversationRequest;

    // Validate required fields
    if (!query) {
      return NextResponse.json(
        { message: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Generate a new session ID if not provided
    const currentSessionId = id || uuidv4();
    const isNewSession = !id;
    
    // Call external API or AI provider directly
    const apiUrl = process.env.EXTERNAL_AI_API_URL || 'https://api.example.com/chat';
    
    const requestBody = {
      query,
      session_id: currentSessionId,
      provider: provider || 'openai',
      model: model || 'gpt-4',
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 1024,
      user_id: session.user.email,
    };
    
    // Example using axios to call external API
    // In a real implementation, you would call your actual AI service
    // For now, we'll simulate a response
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create a simulated response
    const simulatedResponse = {
      response: `This is a simulated response to: "${query}"`,
      session_id: currentSessionId,
      conversation_id: uuidv4(),
      title: isNewSession ? generateTitle(query) : "Existing Conversation",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_new_session: isNewSession,
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

/**
 * GET /api/chat/get_history - Get chat history for a specific session
 * 
 * Query Parameters:
 * - session_id: string - The session ID to get history for
 * 
 * Returns:
 * - count: number - Total number of messages
 * - next: string | null - URL for next page
 * - previous: string | null - URL for previous page
 * - results: ChatMessage[] - List of chat messages
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get session ID from query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { message: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, you would fetch messages from your database
    // For now, we'll simulate a response with dummy messages
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Create simulated messages
    const simulatedMessages = [
      {
        id: uuidv4(),
        role: 'user',
        content: 'Hello, how can you help me with WordPress?',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        status: 'delivered',
        metadata: { client_timestamp: new Date(Date.now() - 3600000).toISOString() },
        versions: []
      },
      {
        id: uuidv4(),
        role: 'assistant',
        content: 'I can help you with WordPress development, troubleshooting, plugin recommendations, theme customization, and best practices. What specific aspect of WordPress do you need assistance with?',
        created_at: new Date(Date.now() - 3590000).toISOString(),
        updated_at: new Date(Date.now() - 3590000).toISOString(),
        status: 'delivered',
        metadata: { token_count: 150, processing_time_ms: 2300 },
        versions: []
      }
    ];
    
    return NextResponse.json({
      count: simulatedMessages.length,
      next: null,
      previous: null,
      results: simulatedMessages
    });
  } catch (error: any) {
    console.error('Chat history API error:', error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error fetching chat history',
          error: error.response.data 
        },
        { status: error.response.status || 500 }
      );
    }
    
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