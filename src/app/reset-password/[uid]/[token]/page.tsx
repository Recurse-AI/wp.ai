"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useTheme } from "@/context/ThemeProvider";
import { getUser } from "@/utils/getUser";

interface ResetPasswordError {
  token?: string[];
  new_password?: string[];
  message?: string;
}

export default function ResetPassword() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [themeLoaded, setThemeLoaded] = useState(false);

  // Get token from URL parameters
  const uid = params?.uid as string;
  const token = params?.token as string;

  // Check if user is logged in
  useEffect(() => {
    setThemeLoaded(false);
    getUser(setIsLoggedIn, () => {}, router, `/reset-password/${uid}/${token}`).then(() => {
      setThemeLoaded(true);
    });
  }, [uid, token, router]);

  useEffect(() => {
    if (isLoggedIn) {
      console.log("🔹 User is already logged in. Redirecting to home...");
      router.push("/");
    }
  }, [isLoggedIn, router]);

  // Password Strength Validation
  const isPasswordStrong = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
  };

  // Handle Reset Password Submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    if (!uid || !token) {
      toast.error("Invalid reset password URL");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match!");
      setLoading(false);
      return;
    }

    if (!isPasswordStrong(newPassword)) {
      setErrorMessage("Password must be at least 8 characters, include 1 uppercase, 1 lowercase, and 1 number.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/users/reset-password/${uid}/${token}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token, new_password: newPassword }),
      });

      console.log("🔹 API Response:", res);

      if (!res.ok) {
        const errorData = await res.json() as ResetPasswordError;
        console.log("Error data:", errorData);
        
        // Create error message from all error fields
        const errorMessages: string[] = [];
        if (errorData.token) {
          errorMessages.push(...errorData.token);
        }
        if (errorData.new_password) {
          errorMessages.push(...errorData.new_password);
        }
        if (errorData.message) {
          errorMessages.push(errorData.message);
        }
        
        if (errorMessages.length > 0) {
          throw new Error(errorMessages.join("\n"));
        } else {
          throw new Error("Token expired or invalid request.");
        }
      }

      setMessage("✅ Password reset successfully! Redirecting to Sign In...");
      toast.success("Password updated!");

      setTimeout(() => router.push("/signin"), 3000);
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message || "Failed to reset password. Try again.");
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  // Prevent rendering until theme is loaded
  if (!themeLoaded) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className={`flex min-h-screen items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-gray-100"}`}>
      <div className={`shadow-lg p-8 rounded-2xl w-full max-w-md border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}>
        <h2 className={`text-2xl font-semibold text-center ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          Reset Password
        </h2>
        <p className={`text-sm text-center mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Enter your new password to reset your account.
        </p>

        {message && <p className="text-green-400 text-center">{message}</p>}
        {errorMessage && errorMessage.split("\n").map((error, index) => (
          <p key={index} className="text-red-400 text-center">{error}</p>
        ))}

        <form onSubmit={handleResetPassword} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-black"} focus:ring focus:ring-blue-500 focus:outline-none`}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-black"} focus:ring focus:ring-blue-500 focus:outline-none`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-500 hover:bg-blue-600 transition-all text-white font-medium rounded-lg flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                Updating...
              </>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>

        <p className={`text-sm text-center mt-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Changed your mind?{" "}
          <a href="/signin" className="text-blue-500 hover:underline">
            Go Back to Sign In
          </a>
        </p>
      </div>
    </div>
  );
} 