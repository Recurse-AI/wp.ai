import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '@/lib/types/chat';

/**
 * GET /api/chat/history/[id]/messages - Get messages for a specific conversation
 * 
 * Path Parameters:
 * - id: string - The conversation ID
 * 
 * Query Parameters:
 * - page: number - Page number (default: 1)
 * - page_size: number - Number of items per page (default: 20)
 * 
 * Returns:
 * - count: number - Total number of messages
 * - next: string | null - URL for next page
 * - previous: string | null - URL for previous page
 * - results: ChatMessage[] - List of messages
 */
export async function GET(
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
    
    const conversationId = params.id;
    
    // Get pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('page_size') || '20');
    
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
      },
      {
        id: uuidv4(),
        role: 'user',
        content: 'I need help with optimizing my WordPress site for speed.',
        created_at: new Date(Date.now() - 3500000).toISOString(),
        updated_at: new Date(Date.now() - 3500000).toISOString(),
        status: 'delivered',
        metadata: { client_timestamp: new Date(Date.now() - 3500000).toISOString() },
        versions: []
      },
      {
        id: uuidv4(),
        role: 'assistant',
        content: 'To optimize your WordPress site for speed, you can:\n\n1. Use a caching plugin like WP Rocket or W3 Total Cache\n2. Optimize your images using WebP format and lazy loading\n3. Minify CSS and JavaScript files\n4. Use a content delivery network (CDN)\n5. Choose a lightweight, optimized theme\n6. Limit the number of plugins\n7. Update to the latest PHP version\n8. Use a quality hosting provider\n\nWhich of these areas would you like me to elaborate on?',
        created_at: new Date(Date.now() - 3490000).toISOString(),
        updated_at: new Date(Date.now() - 3490000).toISOString(),
        status: 'delivered',
        metadata: { token_count: 220, processing_time_ms: 2800 },
        versions: []
      }
    ];
    
    // Calculate pagination values
    const totalCount = simulatedMessages.length;
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
      results: simulatedMessages
    });
  } catch (error: any) {
    console.error('Chat messages API error:', error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error fetching messages',
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
 * POST /api/chat/history/[id]/messages - Add a message to a conversation
 * 
 * Path Parameters:
 * - id: string - The conversation ID
 * 
 * Body:
 * - role: 'user' | 'assistant' | 'system' - The role of the message sender
 * - content: string - The message content
 * - metadata?: object - Optional metadata
 * 
 * Returns:
 * - The created message object
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
    
    const conversationId = params.id;
    
    // Parse request body
    const body = await request.json();
    const { role, content, metadata } = body as Partial<ChatMessage>;
    
    // Validate required fields
    if (!role || !content) {
      return NextResponse.json(
        { message: 'Role and content are required' },
        { status: 400 }
      );
    }
    
    // In a real implementation, you would save the message to your database
    // For now, we'll simulate a response
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Create a simulated message
    const createdMessage: ChatMessage = {
      id: uuidv4(),
      role: role as 'user' | 'assistant' | 'system',
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'delivered',
      metadata: metadata || {},
      versions: []
    };
    
    return NextResponse.json(createdMessage);
  } catch (error: any) {
    console.error('Add message API error:', error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error adding message',
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