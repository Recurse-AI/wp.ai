import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import axios from 'axios';
import { CodeFile } from '@/lib/services/agentService';

/**
 * GET /api/agent/projects - List all projects
 * 
 * Returns:
 * - Array of project objects
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

    // Call projects API
    const apiUrl = process.env.EXTERNAL_AGENT_API_URL || 'https://api.example.com/agent/projects';
    const userId = session.user.id || session.user.email;
    
    // In a real implementation, this would call an external API
    const response = await axios.get(apiUrl, {
      params: { user_id: userId }
    });
    
    // Mock data for testing - would be replaced with actual API call
    /* 
    const mockProjects = [
      {
        id: 'project-1',
        name: 'Sample Project',
        description: 'A sample project',
        files: [
          {
            id: 'file-1',
            name: 'index.html',
            path: '',
            content: '<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>',
            language: 'html',
            lastModified: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    */
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Project list API error:', error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error fetching projects',
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
 * POST /api/agent/projects - Create a new project
 * 
 * Body:
 * - name: string - Project name
 * - description: string - Project description
 * - files?: Omit<CodeFile, 'id' | 'lastModified'>[] - Initial files
 * 
 * Returns:
 * - Created project object
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
    const { name, description, files = [] } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { message: 'Project name is required' },
        { status: 400 }
      );
    }

    // Call projects API
    const apiUrl = process.env.EXTERNAL_AGENT_API_URL || 'https://api.example.com/agent/projects';
    const userId = session.user.id || session.user.email;
    
    const requestBody = {
      name,
      description,
      files,
      user_id: userId
    };
    
    // In a real implementation, this would call an external API
    const response = await axios.post(apiUrl, requestBody);
    
    // Mock data for testing - would be replaced with actual API call
    /*
    const mockProject = {
      id: `project-${Date.now()}`,
      name,
      description,
      files: files.map((file, index) => ({
        ...file,
        id: `file-${Date.now()}-${index}`,
        lastModified: new Date()
      })),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    */
    
    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Project creation API error:', error);
    
    if (error.response) {
      return NextResponse.json(
        { 
          message: error.response.data?.message || 'Error creating project',
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