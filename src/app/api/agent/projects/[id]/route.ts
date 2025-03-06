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
 * GET /api/agent/projects/[id] - Get a specific project
 * 
 * Path parameters:
 * - id: string - Project ID
 * 
 * Returns:
 * - Project object with files
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

    // Call external API for project data
    const apiUrl = `${process.env.EXTERNAL_AGENT_API_URL}/projects/${projectId}` || 
                   `https://api.example.com/agent/projects/${projectId}`;
    const userId = session.user.id || session.user.email;
    
    const response = await axios.get(apiUrl, {
      params: { user_id: userId }
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`Project API error for project ${context.params.id}:`, error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error fetching project',
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
 * DELETE /api/agent/projects/[id] - Delete a specific project
 * 
 * Path parameters:
 * - id: string - Project ID to delete
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

    const projectId = context.params.id;
    
    if (!projectId) {
      return NextResponse.json(
        { message: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Call external API to delete project
    const apiUrl = `${process.env.EXTERNAL_AGENT_API_URL}/projects/${projectId}` || 
                   `https://api.example.com/agent/projects/${projectId}`;
    const userId = session.user.id || session.user.email;
    
    await axios.delete(apiUrl, {
      params: { user_id: userId }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Project deletion API error for project ${context.params.id}:`, error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error deleting project',
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
 * PATCH /api/agent/projects/[id] - Update a specific project
 * 
 * Path parameters:
 * - id: string - Project ID to update
 * 
 * Body:
 * - name?: string - New project name
 * - description?: string - New project description
 * 
 * Returns:
 * - Updated project object
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

    const projectId = context.params.id;
    
    if (!projectId) {
      return NextResponse.json(
        { message: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, description } = body;

    // Call external API to update project
    const apiUrl = `${process.env.EXTERNAL_AGENT_API_URL}/projects/${projectId}` || 
                   `https://api.example.com/agent/projects/${projectId}`;
    const userId = session.user.id || session.user.email;
    
    const response = await axios.patch(apiUrl, {
      name,
      description,
      user_id: userId
    });
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error(`Project update API error for project ${context.params.id}:`, error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error updating project',
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