/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Create context with default values to prevent undefined errors
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Start with "light" theme to avoid hydration mismatch
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Only run after component has mounted (client-side only)
  useEffect(() => {
    setMounted(true);
    try {
      const storedTheme = localStorage.getItem("theme") || "system";
      setTheme(storedTheme as Theme);
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    } catch (error) {
      console.error("Error updating theme in localStorage:", error);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme: mounted ? theme : "light", 
      setTheme: handleThemeChange 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}