import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/chat/history - List all conversations
 * 
 * Query Parameters:
 * - page: number - Page number (default: 1)
 * - page_size: number - Number of items per page (default: 10)
 * 
 * Returns:
 * - count: number - Total number of conversations
 * - next: string | null - URL for next page
 * - previous: string | null - URL for previous page
 * - results: ChatConversation[] - List of conversations
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
    
    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '10');
    
    // In a real implementation, you would fetch conversations from your database
    // For now, we'll simulate a response with dummy conversations
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
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
    ];
    
    // Calculate pagination values
    const totalCount = simulatedConversations.length;
    const hasNextPage = page * pageSize < totalCount;
    const hasPreviousPage = page > 1;
    
    // Build next and previous URLs
    const baseUrl = new URL(request.url);
    let nextUrl = null;
    let previousUrl = null;
    
    if (hasNextPage) {
      const nextUrlObj = new URL(baseUrl);
      nextUrlObj.searchParams.set('page', (page + 1).toString());
      nextUrlObj.searchParams.set('page_size', pageSize.toString());
      nextUrl = nextUrlObj.toString();
    }
    
    if (hasPreviousPage) {
      const prevUrlObj = new URL(baseUrl);
      prevUrlObj.searchParams.set('page', (page - 1).toString());
      prevUrlObj.searchParams.set('page_size', pageSize.toString());
      previousUrl = prevUrlObj.toString();
    }
    
    return NextResponse.json({
      count: totalCount,
      next: nextUrl,
      previous: previousUrl,
      results: simulatedConversations
    });
  } catch (error: any) {
    console.error('Chat history API error:', error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error fetching conversations',
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