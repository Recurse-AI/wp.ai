"use client";

import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useTheme } from "@/context/ThemeProvider";
import { motion } from "framer-motion";

export default function SignIn() {
  const { theme } = useTheme(); // ✅ Get Current Theme
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      toast.success("You are logged in now!");
      router.push("/");
      setIsLoggedIn(true);
    }
    else{
      const authenticateUser = async () => {
        if (session?.user?.name) {
          try {
            console.log("🔹 Calling Backend API /authLogin...");
            const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/login-auth/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: session.user.email,
                name: session.user.name,
                image: session.user.image,
                provider: session.user.provider,
              }),
              credentials: "include",
            });
  
            if (response.ok) {
              console.log("🔹 Backend API responded successfully.");
              const data = await response.json();
              // console.log(data.jwt)
              localStorage.setItem("authToken", data.jwt); // Save backend token
              toast.success("You are logged in now!");
              router.push("/");
              setIsLoggedIn(true);
            } else {
              console.error("❌ Backend /authLogin API failed");
            }
          } catch (err) {
            console.error("❌ Error calling /authLogin:", err);
          }
        }
      };
  
      authenticateUser();
    }
  }, [session, router]);


  // 🔹 Store Token in localStorage
  // useEffect(() => {
    
  // }, [session, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Invalid email or password");

      const data = await res.json();
      console.log(data.jwt)
      const token = data.jwt || "sample-debug-token"; // 🔹 Use sample token if missing
      localStorage.setItem("authToken", token);

      toast.success("Login successful! Redirecting...");
      router.push("/");
    } catch (err) {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   if (isLoggedIn) {
  //     toast.success("You are logged in now!");
  //     router.push("/");
  //   }
  // }, [session, router]);


  return (
    <div className={`flex min-h-screen items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <motion.div
        className={`shadow-lg p-8 rounded-2xl w-full max-w-md border
          ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} transition-all`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2
          className={`text-2xl font-semibold text-center ${theme === "dark" ? "text-white" : "text-gray-900"}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Welcome Back
        </motion.h2>
        <p className={`text-sm text-center mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Sign in to your account
        </p>

        <form onSubmit={handleSignIn} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-black"} focus:ring focus:ring-blue-500 focus:outline-none`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-black"} focus:ring focus:ring-blue-500 focus:outline-none`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex justify-between items-center">
            <a href="/forgot-password" className="text-sm text-blue-500 hover:underline">
              Forgot Password?
            </a>
          </div>

          {/* ✅ Animated Sign-In Button */}
          <motion.button
            type="submit"
            className="w-full p-3 bg-blue-500 hover:bg-blue-600 transition-all text-white font-medium rounded-lg relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
            {/* Flowing Light Effect */}
            <motion.div
              className="absolute inset-0 bg-white opacity-10"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
          </motion.button>
        </form>

        <div className={`text-center my-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>OR</div>

        <div className="flex flex-col space-y-3">
          {/* ✅ Animated OAuth Buttons */}
          {[
            { provider: "google", text: "Sign in with Google", img: "https://img.icons8.com/?size=100&id=17949&format=png&color=000000" },
            { provider: "github", text: "Sign in with GitHub", img: "https://img.icons8.com/?size=100&id=AZOZNnY73haj&format=png&color=000000" },
            { provider: "wordpress", text: "Sign in with WordPress", img: "https://img.icons8.com/?size=100&id=13664&format=png&color=000000" },
          ].map((btn, index) => (
            <motion.button
              key={btn.provider}
              onClick={() => signIn(btn.provider, { prompt: "select_account" })}
              className={`w-full flex items-center justify-center p-3 border rounded-lg transition-all relative overflow-hidden
                ${theme === "dark" ? "border-gray-500 bg-gray-700 hover:bg-gray-600 text-white" : "border-gray-300 bg-white hover:bg-gray-200 text-black"}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src={btn.img} alt={btn.provider} className="w-5 h-5 mr-2" />
              {btn.text}
              {/* Flowing Light Effect */}
              <motion.div
                className="absolute inset-0 bg-white opacity-10"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
            </motion.button>
          ))}
        </div>

        <p className={`text-sm text-center mt-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Don't have an account?{" "}
          <a href="/signup" className="text-blue-500 hover:underline">
            Sign Up
          </a>
        </p>
      </motion.div>
    </div>

  );
}
