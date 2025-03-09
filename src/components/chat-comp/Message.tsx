/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, vs } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useTheme } from "@/context/ThemeProvider";
import { UserMessageActions, AIResponseActions } from "./MessageActions";
import "@fontsource/inter";
import { ChatMessage } from "@/lib/types/chat";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import { getToastStyle } from "@/lib/toastConfig";

// Custom CSS for the component
const styles = {
  codeBlock: {
    background: 'transparent',
    border: 'none',
    padding: '1rem',
    margin: '1rem 0',
    fontFamily: '"Consolas", "Monaco", "Andale Mono", monospace',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    overflow: 'auto',
    whiteSpace: 'pre',
    wordBreak: 'normal',
    color: 'inherit'
  },
  codeWrapper: {
    position: 'relative' as const,
    margin: '1rem 0',
    borderRadius: '0.5rem',
    overflow: 'hidden'
  },
  inlineCode: {
    fontFamily: '"Consolas", "Monaco", "Andale Mono", monospace',
    fontSize: '0.9em',
    padding: '0.2em 0.4em',
    borderRadius: '3px',
    background: 'transparent',
    color: 'inherit'
  },
  aiResponseContainer: {
    boxShadow: '0 0 0 rgba(0,0,0,0.01)',
    border: '1px solid rgba(0,0,0,0.02)',
    borderRadius: '0.75rem',
    padding: '1rem',
    width: '100%',
    transition: 'all 0.2s ease'
  },
  loader: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTopColor: '#3498db',
    borderBottomColor: '#3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0.5rem 0 0.5rem 0.5rem'
  }
};

// Use the ChatMessage type from our types
const defaultMessage: ChatMessage = {
  id: "unknown",
  role: 'user',
  content: "No message available.",
  created_at: new Date().toISOString(),
  status: 'delivered',
};

const defaultAvatars = {
  user: "/wp.webp",
  ai: "/wp.webp",
};

interface MessageProps {
  message?: ChatMessage;
  onRegenerateMessage?: () => Promise<any>;
  isLatestMessage?: boolean;
}

const Message = ({ message = defaultMessage, onRegenerateMessage, isLatestMessage = false }: MessageProps) => {
  const msg = message || defaultMessage;
  const [displayText, setDisplayText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(msg.status === 'pending');
  const [streamComplete, setStreamComplete] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    // Update loading state based on message status
    setIsLoading(msg.status === 'pending');
    
    // Reset streaming state when message changes and it's the latest message
    if (msg.status === 'delivered' && msg.role === 'assistant' && !streamComplete && isLatestMessage) {
      // Only start streaming for new messages, not for loaded old session messages
      const isOldSessionMessage = msg.created_at && new Date(msg.created_at).getTime() < Date.now() - 5000;
      
      if (!isOldSessionMessage) {
        setIsStreaming(true);
        setStreamComplete(false);
        setDisplayText("");
      } else {
        // For old session messages, don't stream - just show the full content
        setIsStreaming(false);
        setStreamComplete(true);
        setDisplayText(msg.content || "");
      }
    } else if (msg.status === 'delivered' && msg.role === 'assistant' && !isLatestMessage) {
      // For old messages, don't stream - just show the full content
      setIsStreaming(false);
      setStreamComplete(true);
      setDisplayText(msg.content || "");
    }
  }, [msg.status, msg.role, msg.created_at, streamComplete, isLatestMessage]);

  // Stream the text for assistant messages
  useEffect(() => {
    if (isStreaming && msg.role === 'assistant' && msg.status === 'delivered' && isLatestMessage) {
      let index = 0;
      const content = msg.content || "";
      const length = content.length;

      
      // Consistent speed regardless of message length to prevent slowdown
      const speed = 1;
      const process_length = length > 500 ? 10 : length > 200 ? 20 : length > 50 ? 30 : 50;

      const interval = setInterval(() => {
        setDisplayText(content.slice(0, index));
        index += process_length; // Process 5 characters at a time for faster streaming

        if (index > content.length) {
          clearInterval(interval);
          setStreamComplete(true);
          setIsStreaming(false);
        }
      }, speed);

      return () => clearInterval(interval);
    }
  }, [isStreaming, msg.content, msg.role, msg.status, isLatestMessage]);

  
  const handleEdit = () => {
    setIsEditing(true);
    setEditedMessage(msg.role === 'user' ? msg.content : "");
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        adjustTextareaHeight();
      }
    }, 50);
  };

  const handleSaveEdit = () => {
    // In a real implementation, this would update the message in the backend
    // For now, we'll just exit editing mode
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    if (onRegenerateMessage && !isRegenerating) {
      setIsRegenerating(true);
      try {
        await onRegenerateMessage();
      } catch (error) {
        console.error("Error regenerating response:", error);
      } finally {
        setIsRegenerating(false);
      }
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedMessage(e.target.value);
    adjustTextareaHeight();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(
      'Code copied to clipboard!',
      { style: getToastStyle(theme) as React.CSSProperties }
    );
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  // Determine if this is a user or assistant message
  const isUserMessage = msg.role === 'user';
  const isAssistantMessage = msg.role === 'assistant';

  return (
    <div className="flex flex-col items-center w-full font-inter overflow-x-hidden">
      {/* User Message */}
      {isUserMessage && (
        <div className="flex justify-end w-full max-w-3xl px-4 mt-2 overflow-x-hidden">
          <div
            className={`relative py-3 px-4 rounded-xl ml-20 ${isEditing ? 'w-[80%] max-w-3xl' : 'w-auto'} group
            ${
              theme === "dark"
                ? "bg-[#343541] text-white"
                : "bg-[#ECECF1] text-gray-900"
            }`}
          >
            {isEditing ? (
              <div className="w-full min-w-[350px]">
                <textarea
                  ref={textareaRef}
                  value={editedMessage}
                  onChange={handleTextareaChange}
                  className="w-full bg-transparent outline-none resize-none overflow-hidden border-none p-1 focus:ring-0 font-inherit"
                  style={{
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 'inherit',
                    color: 'inherit',
                    minHeight: '40px',
                    width: '100%',
                    minWidth: '100%',
                    overflow: 'hidden'
                  }}
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 mr-2 text-sm rounded-md hover:bg-opacity-80 transition-colors bg-gray-300 dark:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 text-sm text-white rounded-md hover:bg-opacity-80 transition-colors bg-blue-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <pre className="whitespace-pre-wrap break-words text-left">
                  {msg.content}
                </pre>
                <UserMessageActions 
                  content={msg.content} 
                  onEdit={handleEdit}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* AI Response */}
      {isAssistantMessage && (
        <div className="flex justify-start w-full max-w-3xl px-4 mt-3 mb-4 font-inter overflow-x-hidden">
          <div
            className={`py-4 px-5 rounded-xl group w-full ${
              theme === "dark" 
                ? "bg-gray-800/60 text-gray-100" 
                : "bg-white/95 text-gray-800"
            }`}
            style={styles.aiResponseContainer}
          >
            {isLoading ? (
              <div className="flex items-start">
                <div style={styles.loader}></div>
              </div>
            ) : (
              <>
                <style jsx global>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                  
                  /* Hide scrollbars */
                  .code-block-wrapper::-webkit-scrollbar {
                    display: none;
                  }
                  .code-block-wrapper {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                  }
                  
                  /* Code styling */
                  .code-block-wrapper pre {
                    background: transparent !important;
                    margin: 0 !important;
                    padding: 1rem !important;
                    overflow: hidden !important;
                  }
                  
                  .code-block-wrapper code {
                    font-family: Consolas, Monaco, 'Andale Mono', monospace !important;
                    text-shadow: none !important;
                  }
                  
                  /* VS Code-like line numbers */
                  .code-block-wrapper .linenumber {
                    color: #858585 !important;
                    min-width: 2.5em !important;
                    padding-right: 1em !important;
                    text-align: right !important;
                    user-select: none !important;
                    border-right: 1px solid #404040 !important;
                    margin-right: 1em !important;
                  }
                  
                  /* Code block language label */
                  .code-language-label {
                    position: absolute;
                    top: 0;
                    left: 0;
                    background: rgba(0, 0, 0, 0.6);
                    color: #fff;
                    font-size: 0.75rem;
                    padding: 2px 8px;
                    border-bottom-right-radius: 4px;
                    font-family: sans-serif;
                    z-index: 5;
                  }
                  
                  /* Horizontal scrolling for code blocks */
                  .code-block-content {
                    overflow-x: auto !important;
                    max-width: 100% !important;
                    white-space: pre !important;
                    display: block !important;
                  }
                  
                  /* Make sure code doesn't wrap */
                  .code-block-content pre {
                    white-space: pre !important;
                    word-wrap: normal !important;
                    overflow-x: auto !important;
                  }
                  
                  .code-block-content code {
                    white-space: pre !important;
                    word-wrap: normal !important;
                    display: inline-block !important;
                    min-width: 100% !important;
                  }
                  
                  /* Override any wrapping styles */
                  .react-syntax-highlighter-line-number, 
                  .react-syntax-highlighter-line {
                    white-space: pre !important;
                    word-wrap: normal !important;
                  }
                  
                  /* Custom scrollbar for horizontal code scrolling */
                  .code-block-content::-webkit-scrollbar {
                    height: 6px !important;
                  }
                  
                  .code-block-content::-webkit-scrollbar-track {
                    background: transparent !important;
                  }
                  
                  .code-block-content::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.5) !important;
                    border-radius: 20px !important;
                  }
                  
                  .dark .code-block-content::-webkit-scrollbar-thumb {
                    background-color: rgba(75, 85, 99, 0.5) !important;
                  }
                  
                  /* For Firefox */
                  .code-block-content {
                    scrollbar-width: thin !important;
                    scrollbar-color: rgba(156, 163, 175, 0.5) transparent !important;
                  }
                  
                  .dark .code-block-content {
                    scrollbar-color: rgba(75, 85, 99, 0.5) transparent !important;
                  }
                  
                  /* Dark mode syntax highlighting overrides for better visibility */
                  .dark-syntax-theme .token.comment { color: #6A9955 !important; }
                  .dark-syntax-theme .token.string { color: #ce9178 !important; }
                  .dark-syntax-theme .token.keyword { color: #569cd6 !important; }
                  .dark-syntax-theme .token.function { color: #dcdcaa !important; }
                  .dark-syntax-theme .token.number { color: #b5cea8 !important; }
                  .dark-syntax-theme .token.operator { color: #d4d4d4 !important; }
                  .dark-syntax-theme .token.class-name { color: #4ec9b0 !important; }
                  .dark-syntax-theme .token.property { color: #9cdcfe !important; }
                  .dark-syntax-theme .token.punctuation { color: #d4d4d4 !important; }
                  .dark-syntax-theme .token.tag { color: #569cd6 !important; }
                  .dark-syntax-theme .token.attr-name { color: #9cdcfe !important; }
                  .dark-syntax-theme .token.attr-value { color: #ce9178 !important; }
                  .dark-syntax-theme .token.variable { color: #9cdcfe !important; }
                  .dark-syntax-theme .token.constant { color: #4fc1ff !important; }
                  .dark-syntax-theme .token.boolean { color: #569cd6 !important; }
                  .dark-syntax-theme .token.regex { color: #d16969 !important; }
                  
                  /* Light mode syntax highlighting overrides for better visibility */
                  .light-syntax-theme .token.comment { color: #008000 !important; }
                  .light-syntax-theme .token.string { color: #a31515 !important; }
                  .light-syntax-theme .token.keyword { color: #0000ff !important; }
                  .light-syntax-theme .token.function { color: #795e26 !important; }
                  .light-syntax-theme .token.number { color: #098658 !important; }
                  .light-syntax-theme .token.operator { color: #000000 !important; }
                  .light-syntax-theme .token.class-name { color: #267f99 !important; }
                  .light-syntax-theme .token.property { color: #0070c1 !important; }
                  .light-syntax-theme .token.punctuation { color: #000000 !important; }
                  .light-syntax-theme .token.tag { color: #800000 !important; }
                  .light-syntax-theme .token.attr-name { color: #ff0000 !important; }
                  .light-syntax-theme .token.attr-value { color: #0000ff !important; }
                  .light-syntax-theme .linenumber { color: #237893 !important; border-right: 1px solid #d4d4d4 !important; }
                  
                  /* Inline code */
                  p code {
                    background: rgba(0, 0, 0, 0.05) !important;
                    color: #0000ff !important;
                    padding: 0.2em 0.4em !important;
                    border-radius: 3px !important;
                    font-family: Consolas, Monaco, 'Andale Mono', monospace !important;
                    font-size: 0.9em !important;
                  }
                  
                  /* Dark mode inline code */
                  .prose-invert p code {
                    background: rgba(255, 255, 255, 0.1) !important;
                    color: #569cd6 !important;
                  }
                `}</style>
                <ReactMarkdown
                  className={`prose ${theme === "dark" ? "prose-invert" : ""} max-w-none`}
                  components={{
                    p: ({node, ...props}) => <p className="text-base leading-relaxed mb-4" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-4" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-4" {...props} />,
                    li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    a: ({node, ...props}) => <a className="text-blue-500 hover:underline" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4" {...props} />,
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const codeString = String(children).replace(/\n$/, "");
                      const isCopied = copiedCode === codeString;
                      
                      return match ? (
                        <div className="relative group/code">
                          <button 
                            onClick={() => handleCopyCode(codeString)}
                            className="absolute right-2 top-2 p-1.5 rounded-md bg-gray-700/80 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors z-10"
                            aria-label="Copy code"
                          >
                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                          
                          {/* Language label - moved to top-left */}
                          <div className="code-language-label">
                            {match[1].toUpperCase()}
                          </div>
                          
                          <div className="code-block-wrapper" style={{
                            ...styles.codeWrapper,
                            border: theme === "dark" ? "1px solid #1e1e1e" : "1px solid #d4d4d4",
                            background: theme === "dark" ? "#1e1e1e" : "#ffffff",
                            boxShadow: theme === "dark" ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "0 2px 4px rgba(0, 0, 0, 0.05)"
                          }}>
                            <div className="code-block-content" style={{ overflowX: 'auto', maxWidth: '100%' }}>
                              <SyntaxHighlighter
                                // @ts-ignore - Type issues with the SyntaxHighlighter component
                                style={theme === "dark" ? vscDarkPlus : vs}
                                language={match[1]}
                                PreTag="div"
                                showLineNumbers={true}
                                lineNumberStyle={{ 
                                  color: theme === "dark" ? '#858585' : '#237893',
                                  borderRight: theme === "dark" ? '1px solid #404040' : '1px solid #d4d4d4',
                                  paddingRight: '1em',
                                  marginRight: '1em'
                                }}
                                className={theme === "dark" ? "dark-syntax-theme" : "light-syntax-theme"}
                                customStyle={{
                                  ...styles.codeBlock,
                                  background: theme === "dark" ? "#1e1e1e" : "#ffffff",
                                  overflow: 'auto',
                                  whiteSpace: 'pre',
                                  wordWrap: 'normal',
                                  wordBreak: 'normal',
                                  minWidth: '100%'
                                }}
                                wrapLines={false}
                                wrapLongLines={false}
                                useInlineStyles={true}
                              >
                                {codeString}
                              </SyntaxHighlighter>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <code style={styles.inlineCode} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {isStreaming && isLatestMessage ? displayText : msg.content}
                </ReactMarkdown>
                
                {/* Only show actions when not streaming */}
                {(!isStreaming || !isLatestMessage) && (
                  <AIResponseActions 
                    content={msg.content}
                    onRegenerate={onRegenerateMessage ? handleRegenerate : undefined}
                    metadata={msg.metadata}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Message;