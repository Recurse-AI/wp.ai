import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/chat/history/recent - Get recent conversations
 * 
 * Query Parameters:
 * - limit: number - Maximum number of conversations to return (default: 5)
 * 
 * Returns:
 * - Array of ChatConversation objects
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
    
    // Get limit parameter
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    
    // In a real implementation, you would fetch recent conversations from your database
    // For now, we'll simulate a response with dummy conversations
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Create simulated conversations
    const simulatedConversations = [
      {
        id: uuidv4(),
        session_id: uuidv4(),
        title: "WordPress Security Best Practices",
        conversation_type: "chat",
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 86400000 + 3600000).toISOString(), // 1 day ago + 1 hour
        last_message: {
          content: "To secure your WordPress site, consider these best practices...",
          role: "assistant",
          created_at: new Date(Date.now() - 86400000 + 3600000).toISOString()
        },
        message_count: 2
      },
      {
        id: uuidv4(),
        session_id: uuidv4(),
        title: "WordPress Plugin Development",
        conversation_type: "chat",
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 172800000 + 7200000).toISOString(), // 2 days ago + 2 hours
        last_message: {
          content: "Here are some tips for developing WordPress plugins...",
          role: "assistant",
          created_at: new Date(Date.now() - 172800000 + 7200000).toISOString()
        },
        message_count: 4
      }
    ].slice(0, limit);
    
    return NextResponse.json(simulatedConversations);
  } catch (error: any) {
    console.error('Recent conversations API error:', error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error fetching recent conversations',
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