"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeProvider";
import { toast } from "react-hot-toast";
import { getUser } from "@/utils/getUser"; // ✅ Import getUser

export default function ForgotPassword() {
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", image: "" });
  const [themeLoaded, setThemeLoaded] = useState(false);

  // ✅ Check if user is logged in (Redirect to homepage)
  useEffect(() => {
    setThemeLoaded(false);
    getUser(setIsLoggedIn, setUser, router, pathname).then(() => {
      setThemeLoaded(true);
    });
  }, []);

  // ✅ Redirect to home if logged in
  useEffect(() => {
    if (isLoggedIn) {
      console.log("🔹 User is already logged in. Redirecting to home...");
      router.push("/");
    }
  }, [isLoggedIn, router]);

  // ✅ Handle forgot password request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      console.log("🔹 API Response:", res);

      if (!res.ok) throw new Error("Email not found! Please check and try again.");

      setMessage("A password reset link has been sent to your email.");
      toast.success("Check your email for the reset link!");
    } catch (error) {
      toast.error("Failed to send reset link. Please try again.");
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
          Password Recovery
        </h2>
        <p className={`text-sm text-center mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Enter your email and we’ll send you a link to reset your password.
        </p>

        {message && <p className="text-green-400 text-center">{message}</p>}

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-black"} focus:ring focus:ring-blue-500 focus:outline-none`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-500 hover:bg-blue-600 transition-all text-white font-medium rounded-lg"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className={`text-sm text-center mt-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Remembered your password?{" "}
          <a href="/signin" className="text-blue-500 hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
