import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check server status
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    
    try {
      // Try to reach the backend
      const response = await fetch(`${backendUrl}/api/health-check`, { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        return NextResponse.json({ 
          status: 'ok',
          message: 'API server is running',
          backendStatus: 'connected'
        }, { status: 200 });
      } else {
        return NextResponse.json({ 
          status: 'warning',
          message: 'API server returned an error',
          backendStatus: 'error',
          statusCode: response.status
        }, { status: 200 });
      }
    } catch (error) {
      console.error('Error connecting to backend:', error);
      return NextResponse.json({ 
        status: 'warning',
        message: 'Cannot connect to backend API',
        backendStatus: 'disconnected',
        error: error.message
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Error checking health',
      error: error.message
    }, { status: 500 });
  }
} 