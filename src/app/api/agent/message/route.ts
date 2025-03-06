import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';

/**
 * POST /api/agent/message - Send a message to the agent
 * 
 * Body:
 * - message: string - The message to send
 * - project_id: string - The project ID
 * - model_id: string - The model ID to use
 * - provider: string - The provider ID
 * - temperature?: number - Temperature parameter for generation
 * - max_tokens?: number - Maximum tokens to generate
 * - session_id?: string - Existing session ID (if continuing a conversation)
 * 
 * Returns:
 * - session_id: string - Session ID
 * - message_id: string - Message ID
 * - response: string - Agent response
 * - code_changes?: any[] - Code changes made by the agent
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
    const { 
      message, 
      project_id, 
      model_id, 
      provider, 
      temperature, 
      max_tokens, 
      session_id 
    } = body;

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { message: 'Message is required' },
        { status: 400 }
      );
    }
    
    if (!project_id) {
      return NextResponse.json(
        { message: 'Project ID is required' },
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
    const apiUrl = process.env.EXTERNAL_AGENT_API_URL || 'https://api.example.com/agent/message';
    
    const requestBody = {
      message,
      project_id,
      model_id,
      provider,
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 4096,
      user_id: session.user.id || session.user.email,
      ...(session_id && { session_id }),
    };
    
    // In a real implementation, this would call an external API or LLM directly
    const response = await axios.post(apiUrl, requestBody);
    
    // Here's a mock response for testing
    /* 
    const mockResponse = {
      session_id: session_id || `session-${Date.now()}`,
      message_id: `msg-${Date.now()}`,
      response: `I've analyzed your request and made the following changes...`,
      code_changes: [
        {
          operation: 'update',
          fileId: 'file-123',
          content: '// Updated code content'
        }
      ]
    };
    */
    
    // Return the response from the API
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Agent API error:', error);
    
    // Proper error handling with status codes
    if (error.response) {
      // External API returned error
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error processing agent request',
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