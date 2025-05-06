"use client";

import { useTheme } from "@/context/ThemeProvider";
import { getToastStyle } from "@/lib/toastConfig";
import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  const { theme } = useTheme();

  return (
    <>
      {/* Default toaster for regular toast notifications */}
      <Toaster
        position="top-right"
        gutter={12}
        containerStyle={{
          top: '20px',
          right: '20px',
        }}
        toastOptions={{
          duration: 5000,
          style: {
            background: theme === "dark" ? "#1F2937" : "#fff",
            color: theme === "dark" ? "#fff" : "#000",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            padding: "12px 16px",
            fontWeight: "500",
            maxWidth: '420px',
          }
        }}
      />
      {/* The custom toasts will use react-hot-toast.custom() and don't need additional configuration here */}
    </>
  );
}
