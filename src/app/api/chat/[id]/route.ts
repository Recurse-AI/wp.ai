import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * GET /api/chat/[id] - Get messages for a specific chat
 * 
 * Path parameters:
 * - id: string - Chat ID
 * 
 * Returns:
 * - messages: any[] - List of messages in the chat
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const chatId = context.params.id;
    
    if (!chatId) {
      return NextResponse.json(
        { message: 'Chat ID is required' },
        { status: 400 }
      );
    }

    // Call external API for chat messages
    const apiUrl = `${process.env.EXTERNAL_AI_API_URL}/${chatId}` || `https://api.example.com/chat/${chatId}`;
    const userId = session.user.id || session.user.email;
    
    const response = await axios.get(apiUrl, {
      params: { user_id: userId }
    });
    
    return NextResponse.json({ messages: response.data });
  } catch (error: any) {
    console.error(`Chat messages API error for chat ${context.params.id}:`, error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error fetching chat messages',
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

/**
 * DELETE /api/chat/[id] - Delete a specific chat
 * 
 * Path parameters:
 * - id: string - Chat ID to delete
 * 
 * Returns:
 * - success: boolean - Whether deletion was successful
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const chatId = context.params.id;
    
    if (!chatId) {
      return NextResponse.json(
        { message: 'Chat ID is required' },
        { status: 400 }
      );
    }

    // Call external API to delete chat
    const apiUrl = `${process.env.EXTERNAL_AI_API_URL}/${chatId}` || `https://api.example.com/chat/${chatId}`;
    const userId = session.user.id || session.user.email;
    
    await axios.delete(apiUrl, {
      params: { user_id: userId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Chat deletion API error for chat ${context.params.id}:`, error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error deleting chat',
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