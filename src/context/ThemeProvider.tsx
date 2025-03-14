/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({ theme: "system", setTheme: (theme: string) => {} });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Start with "system" theme to avoid hydration mismatch
  const [theme, setTheme] = useState("system");
  const [mounted, setMounted] = useState(false);

  // Only run after component has mounted (client-side only)
  useEffect(() => {
    setMounted(true);
    try {
      const storedTheme = localStorage.getItem("theme") || "system";
      setTheme(storedTheme);
      document.documentElement.classList.toggle("dark", storedTheme === "dark");
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  const updateTheme = (newTheme: string) => {
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
      document.documentElement.classList.toggle("dark", newTheme === "dark");
    } catch (error) {
      console.error("Error updating theme in localStorage:", error);
    }
  };

  // To avoid hydration mismatch, use initial theme until client-side code runs
  // This will prevent useTheme() from returning different values on server vs client
  return (
    <ThemeContext.Provider value={{ 
      theme: mounted ? theme : "system", 
      setTheme: updateTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
