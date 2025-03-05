"use client";

import { useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useTheme } from '@/context/ThemeProvider';
import { getToastStyle } from '@/lib/toastConfig';

interface EmailVerificationStatusProps {
  isVerified: boolean;
  email: string;
  className?: string;
}

export default function EmailVerificationStatus({
  isVerified,
  email,
  className = '',
}: EmailVerificationStatusProps) {
  const { theme } = useTheme();
  const [isResending, setIsResending] = useState(false);

  const handleResendVerification = async () => {
    if (isResending || !email) return;
    
    setIsResending(true);
    
    try {
      console.log(`Requesting verification email for: ${email}`);
      
      const res = await fetch('/api/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      // Try to get the response
      let data;
      try {
        // First try to get the response as text
        const textResponse = await res.text();
        console.log("Raw Text Response:", textResponse);
        
        // Try to parse it as JSON if possible
        if (textResponse && textResponse.trim()) {
          try {
            data = JSON.parse(textResponse);
            console.log("Parsed JSON Response:", data);
          } catch (e) {
            console.log("Response is not JSON, using as text");
            data = { message: textResponse };
          }
        } else {
          data = { message: "Empty response from server" };
        }
      } catch (e) {
        console.error("Error reading response:", e);
        data = { error: "Could not read server response" };
      }
      
      if (res.ok) {
        toast.success("Verification email sent! Please check your inbox.", getToastStyle(theme));
      } else {
        // Handle different types of error responses
        let errorMsg = "Failed to send verification email";
        
        if (data) {
          if (data.error) errorMsg = data.error;
          else if (data.detail) errorMsg = data.detail;
          else if (data.message) errorMsg = data.message;
          else if (typeof data === 'string') errorMsg = data;
        }
        
        if (res.status === 404) {
          errorMsg = "Email not found";
        } else if (res.status === 429) {
          errorMsg = "Too many requests. Please try again later.";
        }
        
        toast.error(errorMsg, getToastStyle(theme));
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast.error("An unexpected error occurred. Please try again later.", getToastStyle(theme));
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {isVerified ? (
        <>
          <FaCheckCircle className="text-green-500 text-lg" />
          <span className="text-sm font-medium">
            Email verified
          </span>
        </>
      ) : (
        <>
          <FaExclamationCircle className="text-amber-500 text-lg" />
          <span className="text-sm font-medium">
            Email not verified
          </span>
          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className={`text-sm text-blue-500 hover:text-blue-600 font-medium ml-2 ${
              isResending ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            aria-label="Resend verification email"
          >
            {isResending ? (
              <span className="flex items-center">
                <FaSpinner className="animate-spin mr-1" />
                Sending...
              </span>
            ) : (
              'Resend verification email'
            )}
          </button>
        </>
      )}
    </div>
  );
} 