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
 * POST /api/agent/projects/[id]/files - Create a file in the project
 * 
 * Path parameters:
 * - id: string - Project ID
 * 
 * Body:
 * - name: string - File name
 * - path: string - File path
 * - content: string - File content
 * - language: string - Programming language
 * 
 * Returns:
 * - Created file object
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const projectId = context.params.id;
    
    if (!projectId) {
      return NextResponse.json(
        { message: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, path, content, language } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { message: 'File name is required' },
        { status: 400 }
      );
    }

    // Call external API to create file
    const apiUrl = `${process.env.EXTERNAL_AGENT_API_URL}/projects/${projectId}/files` || 
                   `https://api.example.com/agent/projects/${projectId}/files`;
    const userId = session.user.id || session.user.email;
    
    const requestBody = {
      name,
      path,
      content,
      language,
      user_id: userId
    };
    
    const response = await axios.post(apiUrl, requestBody);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`File creation API error for project ${context.params.id}:`, error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error creating file',
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
 * GET /api/agent/projects/[id]/files - List all files in the project
 * 
 * Path parameters:
 * - id: string - Project ID
 * 
 * Returns:
 * - Array of file objects
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

    const projectId = context.params.id;
    
    if (!projectId) {
      return NextResponse.json(
        { message: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Call external API to list files
    const apiUrl = `${process.env.EXTERNAL_AGENT_API_URL}/projects/${projectId}/files` || 
                   `https://api.example.com/agent/projects/${projectId}/files`;
    const userId = session.user.id || session.user.email;
    
    const response = await axios.get(apiUrl, {
      params: { user_id: userId }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`File list API error for project ${context.params.id}:`, error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error listing files',
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