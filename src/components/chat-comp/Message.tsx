import React from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

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
  console.log(msg);

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
            <ReactMarkdown
              className="prose prose-invert"
              components={{
                code({ inline, className, children, ...props }: { inline?: boolean, className?: string, children?: React.ReactNode }) {
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
              {msg?.ai_response || defaultMessage.ai_response}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </>
  );
};

export default Message;
