"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useTheme } from "@/context/ThemeProvider";

export default function SignIn() {
  const { theme } = useTheme(); // ✅ Get Current Theme
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  // 🔹 Store Token in localStorage
  useEffect(() => {
    if (session?.user?.backendToken) {
      localStorage.setItem("authToken", session.user.backendToken);
    }
    const token = localStorage.getItem("authToken");
    if (token) {
      toast.success("You are logged in now!");
      router.push("/");
    }
  }, [session, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Invalid email or password");

      const data = await res.json();
      const token = data.token || "sample-debug-token"; // 🔹 Use sample token if missing
      localStorage.setItem("authToken", token);

      toast.success("Login successful! Redirecting...");
      router.push("/");
    } catch (err) {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}>
      <div className={`shadow-lg p-8 rounded-2xl w-full max-w-md border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}>
        <h2 className={`text-2xl font-semibold text-center ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          Welcome Back
        </h2>
        <p className={`text-sm text-center mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Sign in to your account
        </p>

        <form onSubmit={handleSignIn} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-black"} focus:ring focus:ring-blue-500 focus:outline-none`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-black"} focus:ring focus:ring-blue-500 focus:outline-none`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-between items-center">
            <a href="/forgot-password" className="text-sm text-blue-500 hover:underline">
              Forgot Password?
            </a>
          </div>
          <button
            type="submit"
            className="w-full p-3 bg-blue-500 hover:bg-blue-600 transition-all text-white font-medium rounded-lg"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className={`text-center my-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>OR</div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => signIn("google", { prompt: "select_account" })}
            className={`w-full flex items-center justify-center p-3 border rounded-lg transition-all ${theme === "dark" ? "border-gray-500 bg-gray-700 hover:bg-gray-600 text-white" : "border-gray-300 bg-white hover:bg-gray-200 text-black"}`}
          >
            <img src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000" alt="Google" className="w-5 h-5 mr-2" />
            Sign in with Google
          </button>
          <button
            onClick={() => signIn("github", { prompt: "select_account" })}
            className={`w-full flex items-center justify-center p-3 border rounded-lg transition-all ${theme === "dark" ? "border-gray-500 bg-gray-700 hover:bg-gray-600 text-white" : "border-gray-300 bg-white hover:bg-gray-200 text-black"}`}
          >
            <img src="https://img.icons8.com/?size=100&id=AZOZNnY73haj&format=png&color=000000" alt="GitHub" className="w-5 h-5 mr-2" />
            Sign in with GitHub
          </button>
          <button
            onClick={() => signIn("wordpress", { prompt: "select_account" })}
            className={`w-full flex items-center justify-center p-3 border rounded-lg transition-all ${theme === "dark" ? "border-gray-500 bg-gray-700 hover:bg-gray-600 text-white" : "border-gray-300 bg-white hover:bg-gray-200 text-black"}`}
          >
            <img src="https://img.icons8.com/?size=100&id=13664&format=png&color=000000" alt="WordPress" className="w-5 h-5 mr-2" />
            Sign in with WordPress
          </button>
        </div>
        <div>
          <p className={`text-sm text-center mt-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
            Don't have an account?{" "}
            <a href="/signup" className="text-blue-500 hover:underline">
              Sign Up
            </a>
          </p>
      </div>
      </div>
    </div>
  );
}
