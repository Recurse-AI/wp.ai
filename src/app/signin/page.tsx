"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) throw new Error("Invalid email or password");

      window.location.href = "/dashboard";
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="bg-white/10 backdrop-blur-md shadow-lg p-8 rounded-2xl w-full max-w-md border border-white/20">
        <h2 className="text-2xl font-semibold text-center text-white">Welcome Back</h2>
        <p className="text-sm text-gray-300 text-center mb-6">Sign in to your account</p>

        {error && <p className="text-red-400 text-center">{error}</p>}

        <form onSubmit={handleSignIn} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-lg bg-gray-800 text-white focus:ring focus:ring-blue-500 focus:outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-lg bg-gray-800 text-white focus:ring focus:ring-blue-500 focus:outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-between items-center">
            <a href="/forgot-password" className="text-sm text-blue-400 hover:underline">
              Forgot Password?
            </a>
          </div>
          <button
            type="submit"
            className="w-full p-3 bg-blue-500 hover:bg-blue-600 transition-all text-white font-medium rounded-lg"
          >
            Sign In
          </button>
        </form>

        <div className="text-center text-gray-300 my-4">OR</div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center p-3 border border-white/20 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all"
          >
            <img src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000" alt="Google" className="w-5 h-5 mr-2" />
            Sign in with Google
          </button>
          <button
            onClick={() => signIn("github")}
            className="w-full flex items-center justify-center p-3 border border-white/20 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all"
          >
            <img src="https://img.icons8.com/?size=100&id=AZOZNnY73haj&format=png&color=000000" alt="GitHub" className="w-5 h-5 mr-2" />
            Sign in with GitHub
          </button>
          <button
            onClick={() => signIn("wordpress")}
            className="w-full flex items-center justify-center p-3 border border-white/20 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all"
          >
            <img src="https://img.icons8.com/?size=100&id=13664&format=png&color=000000" alt="WordPress" className="w-5 h-5 mr-2" />
            Sign in with WordPress
          </button>
        </div>

        <p className="text-sm text-gray-300 text-center mt-4">
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-400 hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}
