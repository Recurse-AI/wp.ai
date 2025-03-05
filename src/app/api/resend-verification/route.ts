import { NextRequest, NextResponse } from 'next/server';

/**
 * API route for resending verification emails
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }
    
    console.log('Resending verification email to:', email);
    
    // Call the Django backend API
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/users/resend-verification/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      // Log the response for debugging
      console.log('Backend API response status:', response.status);
      
      // Read the response as text first for better debugging
      let responseText;
      try {
        responseText = await response.text();
        console.log('Raw response text:', responseText.substring(0, 200));
      } catch (textError) {
        console.error('Error reading response text:', textError);
        responseText = '';
      }
      
      // Try to parse the response as JSON if possible
      let responseData;
      try {
        if (responseText && responseText.trim() && 
            (responseText.trim().startsWith('{') || responseText.trim().startsWith('['))) {
          responseData = JSON.parse(responseText);
        } else {
          // Non-JSON response
          responseData = { 
            success: response.ok,
            message: response.ok ? 'Verification email sent' : 'Failed to send verification email' 
          };
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        responseData = { 
          success: response.ok,
          message: response.ok ? 'Verification email sent' : 'Failed to send verification email'
        };
      }
      
      if (response.ok) {
        return NextResponse.json({
          success: true,
          message: responseData.message || 'Verification email sent successfully'
        });
      } else {
        const errorMessage = 
          responseData.detail || 
          responseData.error || 
          responseData.message ||
          'Failed to send verification email';
          
        return NextResponse.json(
          { success: false, error: errorMessage },
          { status: response.status }
        );
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Error connecting to authentication service' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 