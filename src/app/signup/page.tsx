/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "react-hot-toast";
import { useTheme } from "@/context/ThemeProvider";
import { motion } from "framer-motion";
import { getUser } from "@/utils/getUser";

export default function SignUp() {
  const { theme } = useTheme(); // ✅ Get Current Theme
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", image: "" });
  
  const router = useRouter(); // ✅ Get router instance
  const pathname = usePathname(); // ✅ Get current pathname
  // 🔹 Store Token in localStorage

  useEffect(() => {
    getUser(setIsLoggedIn, setUser, router, pathname); // ✅ Pass router and pathname
  }, []);

  useEffect(() => {
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
            if(localStorage.getItem("isChat")){
              localStorage.removeItem("isChat");
              router.push("/chat");
            }
            else router.push("/");
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
      console.log(res);
      const signup_data = await res.json();

      if (res.status !== 201) {
        throw new Error(`Sign-up failed.  ${signup_data.email}`);
      }
      
      toast.success("Account created! Please Check your email...");
      setTimeout(() => router.push("/signin"), 2000);
    } catch (err) {
      // setLoading(false);
      toast.error(`${err.message}`);
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className={`flex relative min-h-screen bg-transparent items-center justify-center ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* ✅ Fixed Background Circles */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* 🔵 Large Circles */}
        <div className="absolute top-10 left-20 w-96 h-96 bg-blue-400 opacity-100 rounded-full blur-3xl animate-pulse" />
        {/* <div className="absolute top-60 right-20 w-96 h-96 bg-purple-800 opacity-100 rounded-full blur-3xl animate-pulse delay-1000" /> */}
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 opacity-100 rounded-full blur-3xl animate-pulse delay-1000" />
        {/* <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-pink-500 opacity-100 rounded-full blur-3xl animate-pulse delay-2000" /> */}
        {/* <div className="absolute top-2/4 right-1/4 w-80 h-80 bg-yellow-500 opacity-100 rounded-full blur-3xl animate-pulse delay-1000" /> */}
      </div>
      
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
          Create an Account
        </motion.h2>
        <p className={`text-sm text-center mb-6 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          Sign up with email or use a social account
        </p>

        <form onSubmit={handleSignUp} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-black"} focus:ring focus:ring-blue-500 focus:outline-none`}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
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
          <input
            type="password"
            placeholder="Confirm Password"
            className={`w-full p-3 rounded-lg ${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100 text-black"} focus:ring focus:ring-blue-500 focus:outline-none`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {/* ✅ Animated Sign-Up Button */}
          <motion.button
            type="submit"
            className="w-full p-3 bg-blue-500 hover:bg-blue-600 transition-all text-white font-medium rounded-lg relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
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
            { provider: "google", text: "Sign up with Google", img: "https://img.icons8.com/?size=100&id=17949&format=png&color=000000" },
            { provider: "github", text: "Sign up with GitHub", img: "https://img.icons8.com/?size=100&id=AZOZNnY73haj&format=png&color=000000" },
            { provider: "wordpress", text: "Sign up with WordPress", img: "https://img.icons8.com/?size=100&id=13664&format=png&color=000000" },
          ].map((btn, index) => (
            <motion.button
              key={btn.provider}
              onClick={() => signIn(btn.provider)}
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
          Already have an account?{" "}
          <a href="/signin" className="text-blue-500 hover:underline">
            Sign In
          </a>
        </p>
      </motion.div>
    </div>

  );
}
