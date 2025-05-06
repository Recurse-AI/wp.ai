import { NextRequest, NextResponse } from 'next/server';

// API endpoint to get workspace history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the workspace ID from the URL
    const workspaceId = await params.id;
    
    // Validate the workspace ID
    if (!workspaceId || workspaceId === 'undefined') {
      return NextResponse.json(
        { message: 'Invalid workspace ID' },
        { status: 400 }
      );
    }
      
    // Get token from authorization header
    const authHeader = request.headers.get('authorization');
    let token: string | null = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // If no token in header, try to get from cookies
    if (!token) {
      // Get the token from cookies (synchronous in Next.js App Router)
      const cookieToken = request.cookies.get('token')?.value;
      token = cookieToken || null;
    }
    
    // If still no token, return unauthorized
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized - No valid token found' },
        { status: 401 }
      );
    }
    
    // Forward the request to the Django backend
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(
      `${backendUrl}/api/workspace/workspaces/${workspaceId}/history/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies to backend
      }
    );
    
    // Check if the backend returned an error
    if (!response.ok) {
      console.error(`Backend API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      
      return NextResponse.json(
        { message: `Backend error: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    // Get the response data
    const data = await response.json();
    
    // Return response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Error fetching workspace history:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch workspace history' },
      { status: 500 }
    );
  }
} 