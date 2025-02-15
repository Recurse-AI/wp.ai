"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useTheme } from "@/context/ThemeProvider";

export default function SignUp() {
  const { theme } = useTheme(); // ✅ Get Current Theme
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

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

  // 🔹 Password Validation
  const isPasswordStrong = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (!isPasswordStrong(password)) {
      toast.error("Password must be at least 8 characters, include 1 uppercase, 1 lowercase, and 1 number.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName, email, password, provider: "manual" }),
      });

      if (res.status !== 201) {
        throw new Error("Sign-up failed");
      }
      
      toast.success("Account created! Redirecting to Sign In...");
      setTimeout(() => router.push("/signin"), 2000);
    } catch (err) {
      // setLoading(false);
      toast.error("Sign-up failed. Please try again.");
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className={`flex min-h-screen items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}>
      <div className={`shadow-lg p-8 rounded-2xl w-full max-w-md border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}>
        <h2 className={`text-2xl font-semibold text-center ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
          Create an Account
        </h2>
        <p className={`text-sm text-center mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Sign up with email or use a social account
        </p>

        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-black"} focus:ring focus:ring-blue-500 focus:outline-none`}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
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
          <input
            type="password"
            placeholder="Confirm Password"
            className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-black"} focus:ring focus:ring-blue-500 focus:outline-none`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full p-3 bg-blue-500 hover:bg-blue-600 transition-all text-white font-medium rounded-lg"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <div className={`text-center my-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>OR</div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => signIn("google")}
            className={`w-full flex items-center justify-center p-3 border rounded-lg transition-all ${theme === "dark" ? "border-gray-500 bg-gray-700 hover:bg-gray-600 text-white" : "border-gray-300 bg-white hover:bg-gray-200 text-black"}`}
          >
            <img src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000" alt="Google" className="w-5 h-5 mr-2" />
            Sign up with Google
          </button>
          <button
            onClick={() => signIn("github")}
            className={`w-full flex items-center justify-center p-3 border rounded-lg transition-all ${theme === "dark" ? "border-gray-500 bg-gray-700 hover:bg-gray-600 text-white" : "border-gray-300 bg-white hover:bg-gray-200 text-black"}`}
          >
            <img src="https://img.icons8.com/?size=100&id=AZOZNnY73haj&format=png&color=000000" alt="GitHub" className="w-5 h-5 mr-2" />
            Sign up with GitHub
          </button>
          <button
            onClick={() => signIn("wordpress")}
            className={`w-full flex items-center justify-center p-3 border rounded-lg transition-all ${theme === "dark" ? "border-gray-500 bg-gray-700 hover:bg-gray-600 text-white" : "border-gray-300 bg-white hover:bg-gray-200 text-black"}`}
          >
            <img src="https://img.icons8.com/?size=100&id=13664&format=png&color=000000" alt="WordPress" className="w-5 h-5 mr-2" />
            Sign up with WordPress
          </button>
        </div>

        <p className={`text-sm text-center mt-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Already have an account?{" "}
          <a href="/signin" className="text-blue-500 hover:underline">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
