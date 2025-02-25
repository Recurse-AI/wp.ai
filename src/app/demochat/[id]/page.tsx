"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import ChatInput from "@/components/chat-comp/chatInput";
import { fetchMessages } from "@/utils/fetchMessages"; // ✅ Import fetch function
import Image from 'next/image';
import { useTheme } from "@/context/ThemeProvider";
import { BsArrowDownCircle } from "react-icons/bs";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"; // ✅ Import style

const defaultMessage = {
    message_id: "unknown",
    group: 0,
    owner_name: "Anonymous",
    user_prompt: "No message available.",
    ai_response: "No response available.",
    created_at: new Date(),
};

const defaultAvatars = {
    user: "/path/to/user/avatar.png",
    ai: "/path/to/ai/avatar.png",
};

interface Props {
    params: { id: string };
}

const ChatPage = ({ params }: Props) => {
    const chatRef = useRef<HTMLDivElement | null>(null);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();
    const { id } = params;

    const [messages, setMessages] = useState<any[]>([]);
    const [error, setError] = useState(false);
    const [displayText, setDisplayText] = useState(""); // ✅ State for streaming effect
    const [isStreaming, setIsStreaming] = useState(false);

    // ✅ Fetch messages from API
    const fetchChatMessages = useCallback(async () => {
        setLoading(true);
        try {
            await fetchMessages(id, setMessages, setError);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchChatMessages();
    }, [fetchChatMessages]);

    useEffect(() => {
        console.log("✅ Messages updated:", messages);
    }, [messages]);

    // ✅ Ensure chat scrolls to the bottom when messages update
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [messages]);

    // ✅ Handle message streaming effect
    useEffect(() => {
        if (messages.length === 0) return;

        const msg = messages[messages.length - 1] || defaultMessage;

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
    }, [messages]);

    return (
        <div
            className={`flex flex-col justify-center h-[100%] p-5 overflow-hidden ${
                theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"
            }`}
        >
            <div className="flex-1 overflow-y-auto pt-10">
                <div ref={chatRef} className="flex flex-1 flex-col-reverse overflow-y-auto h-[100%] p-4">
                    {loading && (
                        <div className="flex flex-col items-center gap-2 py-5">
                            <p>Loading messages...</p>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex flex-col items-center gap-2 py-5">
                            <p className="text-red-500">Error loading messages. Using default messages.</p>
                        </div>
                    )}

                    {!loading && messages.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-5">
                            <p>Type a prompt to get started!</p>
                            <BsArrowDownCircle className="text-xl text-green-300 animate-bounce" />
                        </div>
                    )}

                    {!loading &&
                        [...messages].reverse().map((msg) => (
                            <div key={msg.message_id}>
                                {/* User Prompt */}
                                <div className="py-5 text-white mx-20 flex justify-end">
                                    <div className="flex space-x-2.5 md:space-x-5 md:px-10 items-center">
                                        <div className="chat-message text-lg text-right">
                                            <ReactMarkdown className="prose prose-invert">
                                                {msg?.user_prompt || defaultMessage.user_prompt}
                                            </ReactMarkdown>
                                        </div>
                                        <Image
                                            className="border border-gray-600 w-9 h-9 rounded-full object-cover"
                                            src={defaultAvatars.user}
                                            alt="User Avatar"
                                            width={100}
                                            height={100}
                                        />
                                    </div>
                                </div>

                                {/* AI Response */}
                                <div className="py-5 text-white mx-20 flex justify-start">
                                    <div className="flex space-x-2.5 md:space-x-5 md:px-10 items-center">
                                        <Image
                                            className="border border-gray-600 w-9 h-9 rounded-full object-cover"
                                            src={defaultAvatars.ai}
                                            alt="AI Avatar"
                                            width={100}
                                            height={100}
                                        />
                                        <div className="chat-message text-lg text-left">
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
                            </div>
                        ))}
                </div>
            </div>

            <ChatInput id={id} setMessages={setMessages} fetchMessages={fetchChatMessages} />
        </div>
    );
};

export default ChatPage;
