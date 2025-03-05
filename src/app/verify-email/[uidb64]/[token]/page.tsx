"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeProvider";
import { toast } from "react-hot-toast";
import { getToastStyle } from "@/lib/toastConfig";

export default function VerifyEmailWithParams() {
  const router = useRouter();
  const params = useParams();
  const { theme } = useTheme();
  const [isVerifying, setIsVerifying] = useState(true);
  
  const uidb64 = params.uidb64 as string;
  const token = params.token as string;

  useEffect(() => {
    // Simple redirect to the main verify-email page with parameters
    // This avoids CORS issues and lets the server handle everything
    router.push(`/verify-email?uidb64=${encodeURIComponent(uidb64)}&token=${encodeURIComponent(token)}`);
  }, [uidb64, token, router]);

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
        <p className="text-lg font-semibold">Verifying your email...</p>
        <motion.div
          className="mt-6 w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
    </div>
  );
} 