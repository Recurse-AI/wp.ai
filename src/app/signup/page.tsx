"use client";

import { signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Password validation: At least 8 characters, 1 uppercase, 1 lowercase, and 1 number
  const isPasswordStrong = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!isPasswordStrong(password)) {
      setError("Password must be at least 8 characters, include 1 uppercase, 1 lowercase, and 1 number.");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      if (!res.ok) throw new Error("Sign-up failed");

      setSuccess("Account created! Redirecting to Sign In...");
      setTimeout(() => (window.location.href = "/signin"), 2000);
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
        <h2 className="text-2xl font-semibold text-center text-white">Create an Account</h2>
        <p className="text-sm text-gray-300 text-center mb-6">Sign up with email or use a social account</p>

        {error && <p className="text-red-400 text-center">{error}</p>}
        {success && <p className="text-green-400 text-center">{success}</p>}

        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full p-3 rounded-lg bg-gray-800 text-white focus:ring focus:ring-blue-500 focus:outline-none"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
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
          <input
            type="password"
            placeholder="Confirm Password"
            className="w-full p-3 rounded-lg bg-gray-800 text-white focus:ring focus:ring-blue-500 focus:outline-none"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full p-3 bg-blue-500 hover:bg-blue-600 transition-all text-white font-medium rounded-lg"
          >
            Sign Up
          </button>
        </form>

        <div className="text-center text-gray-300 my-4">OR</div>

        <div className="flex flex-col space-y-3">
          <button
            // onClick={() => signIn("google")}
            onClick={() => signOut()}
            className="w-full flex items-center justify-center p-3 border border-white/20 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all"
          >
            <img src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000" alt="Google" className="w-5 h-5 mr-2" />
            Sign up with Google
          </button>
          <button
            onClick={() => signIn("github")}
            className="w-full flex items-center justify-center p-3 border border-white/20 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all"
          >
            <img src="https://img.icons8.com/?size=100&id=AZOZNnY73haj&format=png&color=000000" alt="GitHub" className="w-5 h-5 mr-2" />
            Sign up with GitHub
          </button>
          <button
            onClick={() => signIn("wordpress")}
            className="w-full flex items-center justify-center p-3 border border-white/20 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-all"
          >
            <img src="https://img.icons8.com/?size=100&id=13664&format=png&color=000000" alt="WordPress" className="w-5 h-5 mr-2" />
            Sign up with WordPress
          </button>
        </div>

        <p className="text-sm text-gray-300 text-center mt-4">
          Already have an account?{" "}
          <a href="/signin" className="text-blue-400 hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
