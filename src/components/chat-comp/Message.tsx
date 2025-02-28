import React, { useEffect, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useTheme } from "@/context/ThemeProvider";

type MessageType = {
  message_id: string;
  group: number;
  owner_name: string;
  user_prompt: string;
  ai_response: string;
  created_at: Date;
};

const defaultMessage: MessageType = {
  message_id: "unknown",
  group: 0,
  owner_name: "Anonymous",
  user_prompt: "No message available.",
  ai_response: "No response available.",
  created_at: new Date(),
};

const defaultAvatars = {
  user: "/wp.webp",
  ai: "/wp.webp",
};

const Message = ({ message = defaultMessage }: { message?: MessageType }) => {
  const msg = message || defaultMessage;
  const [displayText, setDisplayText] = useState(""); 
  const [isStreaming, setIsStreaming] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    const storedFlowMessages = localStorage.getItem("set-to-flow") || "[]";

    if (storedFlowMessages.includes(msg.message_id)) {
      setIsStreaming(true);
      let index = 0;
      const length = msg.ai_response.length;
      const speed = length > 500 ? 10 : length > 200 ? 20 : length > 50 ? 30 : 50;

      const interval = setInterval(() => {
        setDisplayText(msg.ai_response.slice(0, index));
        index++;

        if (index > msg.ai_response.length) {
          clearInterval(interval);
          setIsStreaming(false);
          localStorage.removeItem("set-to-flow");
        }
      }, speed);

      return () => clearInterval(interval);
    } else {
      setDisplayText(msg.ai_response);
    }
  }, [msg.ai_response, msg.message_id]);

  return (
    <>
      {/* User Message */}
      <div className="flex justify-end px-4 mt-2 mr-2">
        <div
          className={`relative py-3 px-4 rounded-2xl shadow-md text-white ${
            theme === "dark" ? "bg-gray-900" : "bg-gray-300 text-slate-900"
          } max-w-[75%] sm:max-w-[60%] md:max-w-[50%] lg:max-w-[40%]`}
        >
          {/* ✅ Preserve new lines in user input */}
          <pre className="whitespace-pre-wrap break-words text-left">
            {msg?.user_prompt || defaultMessage.user_prompt}
          </pre>

          {/* User Avatar */}
          <Image
            className="absolute top-1/2 -translate-y-1/2 right-[-40px] border border-gray-600 w-9 h-9 rounded-full object-cover"
            src={defaultAvatars.user}
            alt="User Avatar"
            width={100}
            height={100}
          />
        </div>
      </div>

      {/* AI Response */}
      <div className="flex justify-start px-3 sm:px-4 mt-3">
        {/* ✅ Reduce left margin for AI avatar on small screens */}
        <Image
          className="border border-gray-600 w-9 h-9 rounded-full sm:mr-3 mr-1 object-cover"
          src={defaultAvatars.ai}
          alt="AI Avatar"
          width={100}
          height={100}
        />
        <div
          className={`py-3 px-3 sm:px-4 rounded-2xl shadow-md ${
            theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-200 text-black"
          } max-w-[85%] sm:max-w-[75%] md:max-w-[60%] lg:max-w-[50%] sm:ml-0 ml-1`}
        >
          {msg.ai_response === "Loading..." ? (
            <div className="flex items-center space-x-3 text-gray-400 text-lg font-semibold">
              <div className="w-5 h-5 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
              <span className="animate-bounce">Loading...</span>
            </div>
          ) : (
            <ReactMarkdown
              className="prose prose-invert"
              components={{
                code({ inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark as any}
                      language={match[1]}
                      PreTag="div"
                      {...(props as any)}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {isStreaming ? displayText : msg.ai_response || defaultMessage.ai_response}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </>
  );
};

export default Message;
