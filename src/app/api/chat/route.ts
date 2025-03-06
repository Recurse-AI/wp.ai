import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';

/**
 * POST /api/chat - Send a message to the chat
 * 
 * Body:
 * - prompt: string - The message to send
 * - model_id: string - The model ID to use
 * - provider: string - The provider ID
 * - temperature?: number - Temperature parameter for generation
 * - max_tokens?: number - Maximum tokens to generate
 * - group_id?: string - Existing chat ID (if continuing a conversation)
 * 
 * Returns:
 * - chat_group: { group_id: string } - Chat group info
 * - chat_message: { message_id: string, ai_response: string } - Message info
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
    const { prompt, model_id, provider, temperature, max_tokens, group_id } = body;

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { message: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    if (!model_id || !provider) {
      return NextResponse.json(
        { message: 'Model ID and provider are required' },
        { status: 400 }
      );
    }

    // Call external API or AI provider directly
    const apiUrl = process.env.EXTERNAL_AI_API_URL || 'https://api.example.com/chat';
    
    const requestBody = {
      prompt,
      model_id,
      provider,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 2048,
      user_id: session.user.id || session.user.email,
      ...(group_id && { group_id }),
    };
    
    // Example using axios to call external API
    const response = await axios.post(apiUrl, requestBody);
    
    // Return the response
    return NextResponse.json(response.data);
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
 * GET /api/chat - Get chat history
 * 
 * Returns:
 * - chats: ChatSession[] - List of chat sessions
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
    
    // Example call to get chat history
    const apiUrl = `${process.env.EXTERNAL_AI_API_URL}/history` || 'https://api.example.com/chat/history';
    const userId = session.user.id || session.user.email;
    
    const response = await axios.get(apiUrl, {
      params: { user_id: userId }
    });
    
    return NextResponse.json({ chats: response.data });
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