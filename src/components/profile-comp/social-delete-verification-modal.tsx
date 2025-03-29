"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface SocialDeleteVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: string;
  expiryMinutes: number;
}

export default function SocialDeleteVerificationModal({
  isOpen,
  onClose,
  provider,
  expiryMinutes
}: SocialDeleteVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleVerification = async () => {
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/verify-social-deletion/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          verification_code: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.status === "success") {
        toast.success(data.message);
        // Remove token and user data
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        // Close modal and redirect to home
        onClose();
        router.push("/");
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch (error) {
      toast.error("Failed to verify deletion code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
            Verify Account Deletion
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-gray-600 dark:text-gray-400">
            Please enter the 2-digit verification code sent to your {provider} email.
            This code will expire in {expiryMinutes} minutes.
          </p>
          <div className="flex flex-col space-y-2">
            <Input
              type="text"
              placeholder="Enter verification code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={2}
              className="text-center text-2xl"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleVerification}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify & Delete"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 