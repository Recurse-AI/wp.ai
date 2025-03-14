import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/chat/history/:id/rename - Rename a chat conversation
 * 
 * Request Body:
 * - title: string - The new title for the conversation
 * 
 * Returns:
 * - The updated conversation object
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get conversation ID from route params
    const conversationId = params.id;
    
    if (!conversationId) {
      return NextResponse.json(
        { message: 'Conversation ID is required' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { title } = body;
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { message: 'Title is required and must be a string' },
        { status: 400 }
      );
    }
    
    // In a real implementation, you would update the conversation in your database
    // For now, we'll simulate a response with the updated conversation
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Create a simulated updated conversation
    const updatedConversation = {
      id: conversationId,
      title: title,
      conversation_type: 'default',
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updated_at: new Date().toISOString(),
      last_message: {
        content: "This is the last message in the conversation",
        role: 'assistant',
        created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      message_count: 10
    };
    
    // Return the updated conversation
    return NextResponse.json(updatedConversation);
  } catch (error: any) {
    console.error('Chat rename API error:', error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error renaming conversation',
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