/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

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
  const [displayText, setDisplayText] = useState(""); // ✅ State for streaming effect
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    // ✅ Check if message ID is in localStorage "set-to-flow"
    const storedFlowMessages = localStorage.getItem("set-to-flow") || "[]";

    if (storedFlowMessages.includes(msg.message_id)) {
      setIsStreaming(true);
      let index = 0;

      // ✅ Determine the speed dynamically based on message length
      const length = msg.ai_response.length;
      const speed = length > 500 ? 10 : length > 200 ? 20 : length > 50 ? 30 : 50; // ✅ Speed Ratio

      const interval = setInterval(() => {
        setDisplayText(msg.ai_response.slice(0, index));
        index++;

        if (index > msg.ai_response.length) {
          clearInterval(interval);
          setIsStreaming(false);
          localStorage.removeItem("set-to-flow"); // ✅ Remove after streaming
        }
      }, speed); // ✅ Dynamic speed applied here

      return () => clearInterval(interval);
    } else {
      setDisplayText(msg.ai_response);
    }
  }, [msg.ai_response, msg.message_id]);


  return (
    <>
      {/* User Prompt (User Message) */}
      <div className="py-5 text-white mx-20 flex justify-end">
        <div className="flex space-x-2.5 md:space-x-5 md:px-10 items-center">
          {/* User Message Content */}
          <div className="chat-message text-lg text-right">
            <ReactMarkdown className="prose prose-invert">
              {msg?.user_prompt || defaultMessage.user_prompt}
            </ReactMarkdown>
          </div>
  
          {/* User Avatar */}
          <Image
            className="border border-gray-600 w-9 h-9 rounded-full object-cover"
            src={defaultAvatars.user}
            alt="User Avatar"
            width={100}
            height={100}
          />
        </div>
      </div>
  
      {/* AI Response (GPT Message) */}
      <div className="py-5 text-white mx-20 flex justify-start">
        <div className="flex space-x-2.5 md:space-x-5 md:px-10 items-center">
          {/* AI Avatar */}
          <Image
            className="border border-gray-600 w-9 h-9 rounded-full object-cover"
            src={defaultAvatars.ai}
            alt="AI Avatar"
            width={100}
            height={100}
          />
  
          {/* AI Message Content */}
          <div className="chat-message text-lg text-left">
            {msg.ai_response === "Loading..." ? (
              <div className="flex items-center space-x-3 text-gray-400 text-lg font-semibold">
                {/* Spinning Circle Loader */}
                <div className="w-5 h-5 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                {/* Floating Text Effect */}
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
      </div>
    </>
  );
  
};

export default Message;
