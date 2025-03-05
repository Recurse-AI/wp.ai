/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useTheme } from "@/context/ThemeProvider";
import "@fontsource/inter";

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
      const speed =
        length > 500 ? 10 : length > 200 ? 20 : length > 50 ? 30 : 50;

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
    <div className="flex flex-col items-center w-full font-inter">
      {/* User Message */}
      <div className="flex justify-end w-full max-w-3xl px-4 mt-2">
        <div
          className={`relative py-3 px-4 rounded-3xl ml-20 w-auto
          ${
            theme === "dark"
              ? "bg-[#343541] text-white"
              : "bg-[#ECECF1] text-gray-900"
          }`}
        >
          <pre className="whitespace-pre-wrap break-words text-left">
            {msg?.user_prompt || defaultMessage.user_prompt}
          </pre>

          {/* <Image
            className="absolute top-1/2 -translate-y-1/2 right-[-40px] border border-gray-600 w-9 h-9 rounded-full object-cover"
            src={defaultAvatars.user}
            alt="User Avatar"
            width={100}
            height={100}
          /> */}
        </div>
      </div>

      {/* AI Response */}
      <div className="flex justify-start w-full max-w-3xl px-4 mt-3 font-inter">
        {/* <Image
          className="border border-gray-600 w-9 h-9 rounded-full object-cover"
          src={defaultAvatars.ai}
          alt="AI Avatar"
          width={100}
          height={100}
        /> */}
        <div
          className={`py-3 px-4 rounded-2xl 
          w-full`}
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
              {isStreaming
                ? displayText
                : msg.ai_response || defaultMessage.ai_response}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
