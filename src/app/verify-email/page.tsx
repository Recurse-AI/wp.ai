"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "verified" | "failed">(
    "loading"
  );

  useEffect(() => {
    const verifyEmail = async () => {
      console.log("Token:", token); // ✅ Debugging
  
      if (!token) {
        setStatus("failed");
        return;
      }
  
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/verify-email?token=${token}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // ✅ Ensures cookies are sent
        });
  
        console.log("Response Status:", res.status);
        console.log("Response Headers:", [...res.headers.entries()]); // ✅ Debugging Headers
  
        if (!res.ok) {
          throw new Error(`Verification failed: ${res.statusText}`);
        }
  
        const data = await res.json();
        console.log("API Response Data:", data); // ✅ Debugging Response Data
  
        if (res.status === 201) {
          setStatus("verified");
  
          // ✅ Auto-redirect after 3 seconds
          setTimeout(() => {
            router.push("/signin");
          }, 3000);
        } else {
          setStatus("failed");
        }
      } catch (error) {
        console.error("Verification Error:", error);
        setStatus("failed");
      }
    };
  
    verifyEmail();
  }, [token]); // ✅ Runs when token changes
  

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-6 ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <motion.div
        className={`shadow-lg p-8 rounded-2xl max-w-md w-full border text-center ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
        }`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {status === "loading" && (
          <>
            <p className="text-lg font-semibold">Verifying your email...</p>
            <motion.div
              className="mt-6 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          </>
        )}

        {status === "verified" && (
          <>
            <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
            <p className="text-lg font-semibold">Email Verified Successfully!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Redirecting to login page...
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <FaExclamationCircle className="text-red-500 text-6xl mx-auto mb-4" />
            <p className="text-lg font-semibold text-red-500">Verification Failed</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Invalid or expired token.
            </p>
            <button
              onClick={() => router.push("/signin")}
              className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-lg font-semibold transition-all"
            >
              Go to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
