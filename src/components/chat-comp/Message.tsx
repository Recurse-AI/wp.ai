import React from 'react'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'

type MessageType = {
  text: string;
  createdAt: Date;
  user: {
    _id: string;
    name: string;
    avatar: string;
  };
};

const defaultMessage: MessageType = {
  text: "No message available.",
  createdAt: new Date(),
  user: {
    _id: "unknown",
    name: "Anonymous",
    avatar: "/default-avatar.png",
  },
};

const Message = ({ message = defaultMessage }: { message?: MessageType }) => {
  const msg = message || defaultMessage;
  const isChatGpt = msg?.user?.name === "ChatGPT";

  return (
    <div className="py-5 text-white">
      <div className="flex space-x-2.5 md:space-x-5 md:px-10">
        <div
          className="border border-gray-600 w-9 h-9 rounded-full overhid"
        >
          <Image
            className="w-full h-full rounded-full object-cover"
            src={msg?.user?.avatar || defaultMessage.user.avatar}
            alt="UserImage"
            width={100}
            height={100}
          />
        </div>
        <div>
          <div className="chat-message">
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
              {msg?.text || defaultMessage.text}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Message;
