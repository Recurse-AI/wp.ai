import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';

interface RouteContext {
  params: {
    id: string;
    fileId: string;
  };
}

/**
 * GET /api/agent/projects/[id]/files/[fileId] - Get a specific file
 * 
 * Path parameters:
 * - id: string - Project ID
 * - fileId: string - File ID
 * 
 * Returns:
 * - File object with content
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

    const { id: projectId, fileId } = context.params;
    
    if (!projectId || !fileId) {
      return NextResponse.json(
        { message: 'Project ID and File ID are required' },
        { status: 400 }
      );
    }

    // Call external API for file data
    const apiUrl = `${process.env.EXTERNAL_AGENT_API_URL}/projects/${projectId}/files/${fileId}` || 
                   `https://api.example.com/agent/projects/${projectId}/files/${fileId}`;
    const userId = session.user.id || session.user.email;
    
    const response = await axios.get(apiUrl, {
      params: { user_id: userId }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`File API error for project ${context.params.id}, file ${context.params.fileId}:`, error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error fetching file',
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
 * PATCH /api/agent/projects/[id]/files/[fileId] - Update a specific file
 * 
 * Path parameters:
 * - id: string - Project ID
 * - fileId: string - File ID
 * 
 * Body:
 * - content: string - New file content
 * - name?: string - New file name
 * - path?: string - New file path
 * - language?: string - New language
 * 
 * Returns:
 * - Updated file object
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: projectId, fileId } = context.params;
    
    if (!projectId || !fileId) {
      return NextResponse.json(
        { message: 'Project ID and File ID are required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { content, name, path, language } = body;

    // Validate required fields
    if (content === undefined) {
      return NextResponse.json(
        { message: 'File content is required' },
        { status: 400 }
      );
    }

    // Call external API to update file
    const apiUrl = `${process.env.EXTERNAL_AGENT_API_URL}/projects/${projectId}/files/${fileId}` || 
                   `https://api.example.com/agent/projects/${projectId}/files/${fileId}`;
    const userId = session.user.id || session.user.email;
    
    const requestBody = {
      content,
      ...(name && { name }),
      ...(path && { path }),
      ...(language && { language }),
      user_id: userId
    };
    
    const response = await axios.patch(apiUrl, requestBody);
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`File update API error for project ${context.params.id}, file ${context.params.fileId}:`, error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error updating file',
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
 * DELETE /api/agent/projects/[id]/files/[fileId] - Delete a specific file
 * 
 * Path parameters:
 * - id: string - Project ID
 * - fileId: string - File ID
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

    const { id: projectId, fileId } = context.params;
    
    if (!projectId || !fileId) {
      return NextResponse.json(
        { message: 'Project ID and File ID are required' },
        { status: 400 }
      );
    }

    // Call external API to delete file
    const apiUrl = `${process.env.EXTERNAL_AGENT_API_URL}/projects/${projectId}/files/${fileId}` || 
                   `https://api.example.com/agent/projects/${projectId}/files/${fileId}`;
    const userId = session.user.id || session.user.email;
    
    await axios.delete(apiUrl, {
      params: { user_id: userId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`File deletion API error for project ${context.params.id}, file ${context.params.fileId}:`, error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error deleting file',
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