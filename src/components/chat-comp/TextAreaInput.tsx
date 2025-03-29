import React, { useRef, useEffect } from "react";
import { useTheme } from "@/context/ThemeProvider";
import styles from "./TextAreaInput.module.css";

interface TextAreaInputProps {
  prompt: string;
  handleInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({
  prompt,
  handleInput,
  handleKeyDown,
  placeholder = "Ask about WordPress themes, plugins, development, or any WP questions...",
  disabled = false
}) => {
  const { theme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize effect
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Maximum height for 5 lines
      textareaRef.current.style.height = `${Math.min(
        scrollHeight,
        maxHeight
      )}px`;
    }
  }, [prompt]);

  return (
    <textarea
      ref={textareaRef}
      placeholder={placeholder}
      onChange={handleInput}
      onKeyDown={handleKeyDown}
      value={prompt}
      disabled={disabled}
      className={`${styles.scrollbarHide} bg-transparent w-full outline-none 
        font-medium tracking-wide text-base resize-none overflow-y-auto px-3
        ${theme === "dark" 
          ? "text-gray-200 placeholder:text-gray-400" 
          : "text-gray-800 placeholder:text-gray-500"
        }
        ${disabled ? "opacity-70 cursor-not-allowed" : ""}
        font-sans placeholder:font-medium placeholder:tracking-wide`}
      style={{
        minHeight: "40px", // Starts at 1 line height
        maxHeight: "120px", // Stops expanding after 5 lines
        height: "40px", // Initial height
        paddingBottom: "10px", // Prevent text from touching the bottom
        lineHeight: "24px", // Maintain proper line spacing
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    />
  );
};

export default TextAreaInput; 