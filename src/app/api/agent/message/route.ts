import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/agent/message - Send a message to the agent
 * 
 * Body:
 * - message: string - The message to send
 * - project_id: string - The project ID
 * - id?: string - Existing conversation ID (if continuing a conversation)
 * - file_context?: { name: string, content: string } - Optional file context
 * 
 * Returns:
 * - message: string - The agent's response
 * - id: string - Conversation ID
 * - code_changes?: Array - Optional code changes suggested by the agent
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
      id,
      file_context 
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

    // In a real implementation, you would call your AI agent service
    // For now, we'll simulate a response
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create a simulated response
    const simulatedResponse = {
      message: `I've analyzed your request: "${message}". ${file_context ? 'I see you\'ve shared a file with me. ' : ''}Here's what I can help with...`,
      id: id || `conversation-${Date.now()}`,
      user_id: session.user.email,
      ...(id && { id }),
      code_changes: file_context ? [
        {
          file_name: file_context.name,
          changes: [
            {
              type: 'insert',
              line: 10,
              content: '// This is a suggested change by the agent'
            }
          ]
        }
      ] : undefined
    };
    
    // Return the response
    return NextResponse.json(simulatedResponse);
  } catch (error: any) {
    console.error('Agent message API error:', error);
    
    // Proper error handling with status codes
    if (error.response) {
      // External API returned error
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error processing agent message',
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