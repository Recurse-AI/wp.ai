"use client";
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import { getToastStyle } from "@/lib/toastConfig";
import { detectLanguage } from "@/lib/utils/codeHighlightUtils";
import { useSyntaxHighlighting } from "@/lib/init";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useStreaming } from "@/context/MessageStateContext";
import { User2 } from "lucide-react";
import { PiRobotFill } from "react-icons/pi";
import dynamic from "next/dynamic";

// Load syntax highlighting styles from our custom component
import "@/lib/utils/syntaxRegistration";

// Dynamically import CodeSyntaxHighlighter with no SSR to prevent hydration issues
const CodeSyntaxHighlighter = dynamic(
  () => import("@/components/ui/code-syntax-highlighter"),
  { ssr: false }
);

interface AgentMessageProps {
  content: string;
  isUser?: boolean;
  isLatestMessage?: boolean;
  streamingActive?: boolean;
}

const AgentMessage: React.FC<AgentMessageProps> = ({
  content,
  isUser = false,
  isLatestMessage = false,
  streamingActive = false,
}) => {
  const { theme } = useTheme();
  const [displayedText, setDisplayedText] = useState("");
  const [isClient, setIsClient] = useState(false);
  const { isStreaming } = useStreaming();
  const messageRef = useRef<HTMLDivElement>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Apply syntax highlighting styles
  useSyntaxHighlighting();

  // Effect to mark component as client-side rendered
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Effect for streaming text animation
  useEffect(() => {
    if (!isStreaming || !isLatestMessage || isUser) {
      setDisplayedText(content);
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      if (index <= content.length) {
        setDisplayedText(content.slice(0, index));
        index += 5; // Increase by multiple characters for faster effect
      } else {
        clearInterval(timer);
      }
    }, 5);

    return () => clearInterval(timer);
  }, [content, isStreaming, isLatestMessage, isUser]);

  // Scroll into view when streaming new content
  useEffect(() => {
    if (messageRef.current && isLatestMessage && isStreaming) {
      const scrollOptions: ScrollIntoViewOptions = {
        behavior: "smooth",
        block: "end",
      };
      messageRef.current.scrollIntoView(scrollOptions);
    }
  }, [displayedText, isLatestMessage, isStreaming]);

  // Function to check if code is React/JSX
  const isReactCode = (code: string): boolean => {
    // Check for React imports
    if (
      code.includes("import React") ||
      code.includes('from "react"') ||
      code.includes("from 'react'") ||
      code.includes("extends React.Component") ||
      code.includes("extends Component")
    ) {
      return true;
    }

    // Check for JSX syntax
    if (
      code.includes("<") &&
      code.includes(">") &&
      (code.includes("</") || code.includes("/>")) &&
      (code.includes("className=") ||
        code.includes("onClick=") ||
        code.includes("props") ||
        code.includes("style=") ||
        code.includes("children"))
    ) {
      return true;
    }

    // Check for React component patterns
    if (
      /function\s+[A-Z][a-zA-Z]*\s*\(/g.test(code) ||
      /const\s+[A-Z][a-zA-Z]*\s*=\s*(\(\)|React\.memo|\(props)/g.test(code)
    ) {
      return true;
    }

    return false;
  };

  const renderContentWithCodeBlocks = (text: string) => {
    // Regex to find code blocks (text between triple backticks with optional language identifier and optional file name)
    const codeBlockRegex =
      /```(\w+)?\s*(?:\(\s*([^)]+)\s*\))?\s*([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Extract language (if specified), file name (if specified), and code content
      const specifiedLang = match[1]?.toLowerCase();
      const fileName = match[2]; // Optional file name within parentheses
      const codeContent = match[3].trim();

      // Detect language from file name if provided
      const fileNameLang = fileName
        ? detectLanguageFromFileName(fileName)
        : null;

      // Detect if this looks like JSX even if not explicitly marked
      const isJsxCode = isReactCode(codeContent);

      // Check if the content is JSON by trying to parse it
      const isJsonContent =
        !isJsxCode &&
        (() => {
          try {
            // Check if it starts with { or [ and try parsing it
            if (
              (codeContent.trim().startsWith("{") ||
                codeContent.trim().startsWith("[")) &&
              (codeContent.trim().endsWith("}") ||
                codeContent.trim().endsWith("]"))
            ) {
              JSON.parse(codeContent);
              return true;
            }
            return false;
          } catch (e) {
            return false;
          }
        })();

      // Determine language with better detection
      let detectedLang;

      if (fileNameLang) {
        // If we have a file name with a recognized extension, prioritize that
        detectedLang = fileNameLang;
      } else if (isJsxCode) {
        // If it looks like JSX/React code
        detectedLang =
          specifiedLang === "tsx" || specifiedLang === "typescript"
            ? "tsx"
            : "jsx";
      } else if (isJsonContent) {
        // If it's valid JSON
        detectedLang = "json";
      } else {
        // Otherwise use our generic detection or the specified language
        detectedLang = detectLanguage(codeContent, specifiedLang);
      }

      // Force extension-based detection for common file types
      if (fileName) {
        if (fileName.endsWith(".jsx")) detectedLang = "jsx";
        if (fileName.endsWith(".tsx")) detectedLang = "tsx";
        if (fileName.endsWith(".json")) detectedLang = "json";
      }

      const isCopied = copiedCode === codeContent;

      // Prepare the language display name
      const displayLang = fileName || detectedLang.toUpperCase();

      // Add code block with VS Code-like styling
      parts.push(
        <div
          key={`code-${match.index}`}
          className="relative my-3 rounded-md overflow-hidden code-block-wrapper"
        >
          {/* Language/File name indicator */}
          <div
            className="absolute text-xs font-medium px-2 py-1 rounded-sm z-10"
            style={{
              top: "8px",
              left: "8px",
              background:
                theme === "dark"
                  ? "rgba(40, 40, 40, 0.9)"
                  : "rgba(240, 240, 240, 0.9)",
              color: theme === "dark" ? "#e0e0e0" : "#333",
              boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
              fontWeight: "bold",
              zIndex: 30,
            }}
          >
            {displayLang}
          </div>

          {/* Copy button */}
          <button
            onClick={() => handleCopyCode(codeContent)}
            className="absolute p-1.5 rounded-md transition-colors z-20 shadow-sm"
            aria-label="Copy code"
            style={{
              top: "8px",
              right: "8px",
              opacity: "0.9",
              background:
                theme === "dark"
                  ? "rgba(40, 40, 40, 0.9)"
                  : "rgba(240, 240, 240, 0.9)",
              color: theme === "dark" ? "#e0e0e0" : "#333",
              zIndex: 30,
            }}
          >
            {isCopied ? <Check size={16} /> : <Copy size={16} />}
          </button>

          {/* Use our custom wrapper component with proper language class */}
          <div
            className={`pt-6 ${
              isJsxCode
                ? "jsx-code-block"
                : detectedLang === "json"
                ? "json-code-block"
                : ""
            }`}
          >
            <CodeSyntaxHighlighter
              code={codeContent}
              language={detectedLang}
              showLineNumbers={true}
              className={`w-full vscode-theme ${
                isJsxCode
                  ? "syntax-jsx"
                  : detectedLang === "json"
                  ? "syntax-json"
                  : ""
              } ${theme === "dark" ? "dark-theme" : "light-theme"}`}
            />
          </div>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after the last code block
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`} className="whitespace-pre-wrap">
          {text.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };
  // Process content to extract code blocks when on client
  const processedContent = isClient
    ? renderContentWithCodeBlocks(displayedText || "")
    : [];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Code copied to clipboard!", {
      style: getToastStyle(theme) as React.CSSProperties,
    });

    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // Improved file extension detection
  const detectLanguageFromFileName = (fileName: string): string | null => {
    if (!fileName) return null;

    const lowerFileName = fileName.toLowerCase();
    const fileExtensions: Record<string, string> = {
      ".js": "javascript",
      ".jsx": "jsx",
      ".ts": "typescript",
      ".tsx": "tsx",
      ".py": "python",
      ".html": "html",
      ".css": "css",
      ".json": "json",
      ".md": "markdown",
      ".php": "php",
      ".rb": "ruby",
      ".java": "java",
      ".go": "go",
      ".c": "c",
      ".cpp": "cpp",
      ".cs": "csharp",
      ".rs": "rust",
      ".sh": "bash",
      ".yml": "yaml",
      ".yaml": "yaml",
      ".sql": "sql",
      ".swift": "swift",
      ".kt": "kotlin",
    };

    // First check for exact file extension match
    for (const ext in fileExtensions) {
      if (lowerFileName.endsWith(ext)) {
        return fileExtensions[ext];
      }
    }

    // Special handling for React component files that might not have explicit extensions
    if (
      /[A-Z][a-zA-Z]*\.jsx?$/.test(fileName) ||
      /[A-Z][a-zA-Z]*Component\.(js|ts)$/.test(fileName) ||
      /[A-Z][a-zA-Z]*(View|Page|Card|Button|Container)\.(js|ts)$/.test(fileName)
    ) {
      return "jsx";
    }

    return null;
  };

  // Function to render code blocks with VS Code-like syntax highlighting

  return (
    <div
      ref={messageRef}
      className={`flex mb-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex items-start gap-3 ${
          isUser ? "max-w-[90%] md:max-w-[80%]" : "w-full"
        } ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        <Avatar
          className={`rounded-full overflow-hidden w-8 h-8 mt-1 flex-shrink-0 ${
            isUser ? "bg-blue-500" : "bg-purple-600"
          }`}
        >
          {/* <AvatarFallback className="text-white flex items-center justify-center">
            {isUser ? <User2 size={14} /> : <PiRobotFill size={16} />}
          </AvatarFallback> */}
        </Avatar>

        <div
          className={`rounded-lg p-3 text-sm flex-1 ${
            isUser
              ? "bg-blue-500 text-white"
              : theme === "dark"
              ? "bg-gray-800 text-gray-100 border border-gray-700"
              : "bg-gray-100 text-gray-800 border border-gray-200"
          }`}
          style={{
            maxHeight: "calc(100vh - 200px)",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {isClient ? (
            processedContent
          ) : (
            <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
              {content}
            </div>
          )}
        </div>
      </div>

      {/* Add additional syntax highlighting styles for messages */}
      <style jsx global>{`
        .code-block-wrapper {
          margin-top: 1rem;
          margin-bottom: 1rem;
          overflow: hidden;
          position: relative;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        /* VS Code-like styling for code blocks */
        .code-block-wrapper pre {
          font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          background: ${theme === "dark"
            ? "#1e1e1e !important"
            : "#ffffff !important"};
          border-radius: 4px !important;
          margin: 0 !important;
          padding-top: 2.5rem !important;
        }

        /* VS Code line numbers */
        .code-block-wrapper .linenumber,
        .code-block-wrapper .react-syntax-highlighter-line-number {
          color: ${theme === "dark"
            ? "#858585 !important"
            : "#a0a0a0 !important"};
          background: ${theme === "dark"
            ? "#1e1e1e !important"
            : "#ffffff !important"};
          border-right: 1px solid
            ${theme === "dark" ? "#333333 !important" : "#e4e4e4 !important"};
          font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace !important;
          font-size: 13px !important;
          min-width: 2.5em !important;
          padding-right: 1em !important;
          text-align: right !important;
          user-select: none !important;
        }

        /* VS Code scrollbars for code blocks */
        .code-block-wrapper pre::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }

        .code-block-wrapper pre::-webkit-scrollbar-track {
          background: ${theme === "dark" ? "#1e1e1e" : "#f3f3f3"};
        }

        .code-block-wrapper pre::-webkit-scrollbar-thumb {
          background: ${theme === "dark" ? "#424242" : "#c1c1c1"};
          border-radius: 3px;
          border: 4px solid transparent;
          background-clip: padding-box;
        }

        .code-block-wrapper pre::-webkit-scrollbar-thumb:hover {
          background: ${theme === "dark" ? "#4f4f4f" : "#a9a9a9"};
        }

        /* Make sure JSX syntax gets proper coloring */
        .jsx-code-block .token.tag {
          color: ${theme === "dark" ? "#569CD6" : "#0000FF"} !important;
        }

        .jsx-code-block .token.attr-name {
          color: ${theme === "dark" ? "#9CDCFE" : "#FF0000"} !important;
        }

        .jsx-code-block .token.attr-value,
        .jsx-code-block .token.string {
          color: ${theme === "dark" ? "#CE9178" : "#A31515"} !important;
        }

        .jsx-code-block .token.punctuation {
          color: ${theme === "dark" ? "#D4D4D4" : "#000000"} !important;
        }

        .jsx-code-block .token.operator {
          color: ${theme === "dark" ? "#D4D4D4" : "#000000"} !important;
        }

        .jsx-code-block .token.keyword {
          color: ${theme === "dark" ? "#C586C0" : "#0000FF"} !important;
        }

        .jsx-code-block .token.function {
          color: ${theme === "dark" ? "#DCDCAA" : "#795E26"} !important;
        }

        .jsx-code-block .token.comment {
          color: ${theme === "dark" ? "#6A9955" : "#008000"} !important;
        }

        /* JSON syntax highlighting */
        .json-code-block .token.property {
          color: ${theme === "dark" ? "#9CDCFE" : "#0451A5"} !important;
        }

        .json-code-block .token.string {
          color: ${theme === "dark" ? "#CE9178" : "#A31515"} !important;
        }

        .json-code-block .token.number {
          color: ${theme === "dark" ? "#B5CEA8" : "#098658"} !important;
        }

        .json-code-block .token.punctuation {
          color: ${theme === "dark" ? "#D4D4D4" : "#000000"} !important;
        }

        .json-code-block .token.boolean {
          color: ${theme === "dark" ? "#569CD6" : "#0000FF"} !important;
        }

        .json-code-block .token.null {
          color: ${theme === "dark" ? "#569CD6" : "#0000FF"} !important;
        }

        /* Add custom scrollbar styles for the message container */
        .rounded-lg::-webkit-scrollbar {
          width: 8px;
        }

        .rounded-lg::-webkit-scrollbar-track {
          background: ${theme === "dark"
            ? "rgba(40, 40, 40, 0.5)"
            : "rgba(240, 240, 240, 0.5)"};
          border-radius: 4px;
        }

        .rounded-lg::-webkit-scrollbar-thumb {
          background: ${theme === "dark"
            ? "rgba(255, 255, 255, 0.2)"
            : "rgba(0, 0, 0, 0.2)"};
          border-radius: 4px;
        }

        .rounded-lg::-webkit-scrollbar-thumb:hover {
          background: ${theme === "dark"
            ? "rgba(255, 255, 255, 0.3)"
            : "rgba(0, 0, 0, 0.3)"};
        }
      `}</style>
    </div>
  );
};

export default AgentMessage;
