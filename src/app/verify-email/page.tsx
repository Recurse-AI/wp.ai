"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 as Spinner } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getToastStyle } from '@/lib/toastConfig';
import { useTheme } from "@/context/ThemeProvider";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  
  // Extract params
  const token = searchParams.get('token');
  const uidb64 = searchParams.get('uidb64');
  const status = searchParams.get('status');
  const message = searchParams.get('message');
  
  // States
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>(
    status ? (status === 'success' ? 'success' : 'error') : 'verifying'
  );
  const [errorMessage, setErrorMessage] = useState<string>(message || '');
  const [email, setEmail] = useState<string>('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    // If status is already provided in URL, use it
    if (status) {
      setVerificationStatus(status === 'success' ? 'success' : 'error');
      if (message) {
        setErrorMessage(message);
      }
      // If success, redirect to sign-in page after 3 seconds
      if (status === 'success') {
        const timer = setTimeout(() => {
          router.push('/signin');
        }, 3000);
        return () => clearTimeout(timer);
      }
      return;
    }
    
    // If token and uidb64 are provided, verify the email
    if (token && uidb64) {
      verifyEmail(uidb64, token);
    } else if (verificationStatus === 'verifying') {
      // If no token/uidb64 and still in verifying state, show error
      setVerificationStatus('error');
      setErrorMessage('Invalid verification link. Please check your email for the correct link.');
    }
  }, [status, message, token, uidb64]);

  async function verifyEmail(uidb64: string, token: string) {
    try {
      setVerificationStatus('verifying');
      
      // Call our API route to verify the email
      const apiUrl = `/api/verify-email?uidb64=${encodeURIComponent(uidb64)}&token=${encodeURIComponent(token)}`;
      console.log('Calling verification API:', apiUrl);
      
      const response = await fetch(apiUrl);
      
      console.log('Verification response status:', response.status);
      
      // Try to safely parse the response as JSON with error handling
      let data;
      try {
        // First get the text response to debug
        const responseText = await response.text();
        console.log('Raw response:', responseText.substring(0, 200)); // Log first 200 chars to avoid huge logs
        
        // Only try to parse if it looks like JSON
        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
          data = JSON.parse(responseText);
        } else {
          // Not JSON, likely HTML error page
          console.error('Response is not JSON. Received HTML or other content instead.');
          throw new Error('Invalid response format from server');
        }
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Could not parse server response');
      }
      
      console.log('Verification response data:', data);
      
      if (data && data.success) {
        setVerificationStatus('success');
        // Auto redirect after success
        setTimeout(() => {
          router.push('/signin');
        }, 3000);
      } else {
        setVerificationStatus('error');
        setErrorMessage(data?.error || 'Verification failed. Please try again or contact support.');
      }
    } catch (error) {
      console.error('Error during verification:', error);
      setVerificationStatus('error');
      setErrorMessage('An error occurred during verification. Please try again or contact support.');
    }
  }

  async function handleResendVerification() {
    try {
      setIsResending(true);
      if (!email.trim()) {
        toast.error('Please enter your email address', getToastStyle(theme));
        setIsResending(false);
        return;
      }

      // Call resend verification API
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Verification email sent! Please check your inbox.', getToastStyle(theme));
      } else {
        toast.error(data.error || 'Failed to resend verification email', getToastStyle(theme));
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      toast.error('An error occurred. Please try again.', getToastStyle(theme));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {verificationStatus === 'verifying'
              ? 'We are verifying your email address...'
              : verificationStatus === 'success'
              ? 'Your email has been verified!'
              : 'Email verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {verificationStatus === 'verifying' ? (
            <div className="flex flex-col items-center space-y-4 py-4">
              <Spinner className="w-12 h-12" />
              <p className="text-center text-muted-foreground">
                Please wait while we verify your email address...
              </p>
            </div>
          ) : verificationStatus === 'success' ? (
            <div className="flex flex-col items-center space-y-4 py-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <p className="text-center">
                Your email has been successfully verified. You will be redirected to the sign-in page shortly.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 py-4">
              <XCircle className="w-16 h-16 text-red-500" />
              <p className="text-center text-red-500">{errorMessage}</p>
              <div className="w-full space-y-4 mt-4">
                <h3 className="text-lg font-medium">Resend verification email?</h3>
                <div className="flex flex-col space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full p-2 border rounded-md"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full"
                  >
                    {isResending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Verification Email
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="mt-2"
          >
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
