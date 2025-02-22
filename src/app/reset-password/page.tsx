"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useTheme } from "@/context/ThemeProvider";
import { getUser } from "@/utils/getUser"; // ✅ Import getUser

export default function ResetPassword() {
  const { theme } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", image: "" });
  const [themeLoaded, setThemeLoaded] = useState(false);

  // ✅ Extract token from URL
  useEffect(() => {
    const resetToken = searchParams.get("token");
    if (!resetToken) {
      toast.error("Invalid or missing token.");
      router.push("/signin"); // Redirect if token is missing
    }
    setToken(resetToken);
  }, [searchParams, router]);

  // ✅ Check if user is logged in (Redirect if logged in)
  useEffect(() => {
    setThemeLoaded(false);
    getUser(setIsLoggedIn, setUser, router).then(() => {
      setThemeLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      console.log("🔹 User is already logged in. Redirecting to home...");
      router.push("/");
    }
  }, [isLoggedIn, router]);

  // ✅ Password Strength Validation
  const isPasswordStrong = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
  };

  // ✅ Handle Reset Password Submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!token) {
      toast.error("Invalid token.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match!");
      setLoading(false);
      return;
    }

    if (!isPasswordStrong(newPassword)) {
      toast.error("Password must be at least 8 characters, include 1 uppercase, 1 lowercase, and 1 number.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: newPassword }),
      });

      console.log("🔹 API Response:", res);

      if (!res.ok) throw new Error("Token expired or invalid request.");

      setMessage("Password reset successfully! Redirecting to Sign In...");
      toast.success("Password updated!");

      // ✅ Redirect after success
      setTimeout(() => router.push("/signin"), 2000);
    } catch (error) {
      toast.error("Failed to reset password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Prevent rendering until theme is loaded
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
            className="w-full p-3 bg-blue-500 hover:bg-blue-600 transition-all text-white font-medium rounded-lg"
          >
            {loading ? "Updating..." : "Reset Password"}
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
