"use client";

import { useTheme } from "@/context/ThemeProvider";
import { getToastStyle } from "@/lib/toastConfig";
import { Toaster } from "react-hot-toast";

export default function ToasterProvider() {
  const { theme } = useTheme();

  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={getToastStyle(theme)}
    />
  );
}
