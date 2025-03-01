/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState, useRef } from "react";
import { BsArrowDownCircle } from "react-icons/bs";
import Message from "./Message";
import { useTheme } from "@/context/ThemeProvider";

const Chat = ({
  id,
  messages,
  fetchMessages,
}: {
  id: string;
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  fetchMessages: () => void;
}) => {
  console.log("Chat ID:", id); // ✅ Debugging: Ensures ID is received
  const [loading, setLoading] = useState(true);
  const [error] = useState(false);

  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    console.log("✅ Messages updated:", messages);
    setLoading(false);
  }, [messages]);

  // Ensure the chat scrolls to the bottom when messages update
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={chatRef}
      className="flex flex-1 flex-col-reverse overflow-y-auto h-[100%] mx-auto w-full"
    >
      {/* ✅ Show loading before messages are fetched */}
      {loading && (
        <div className="flex flex-col items-center gap-2 py-5">
          <p>Loading messages...</p>
        </div>
      )}

      {/* ✅ Show error if API call fails */}
      {!loading && error && (
        <div className="flex flex-col items-center gap-2 py-5">
          <p className="text-red-500">
            Error loading messages. Using default messages.
          </p>
        </div>
      )}

      {/* ✅ Show "Type a prompt" if no messages are available */}
      {!loading && messages.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-5">
          <p>Type a prompt to get started!</p>
          <BsArrowDownCircle className="text-xl text-green-300 animate-bounce" />
        </div>
      )}

      {/* ✅ Display messages with latest first */}
      <div className="w-full">
        {!loading &&
          [...messages].map((message) => (
            <div key={message.message_id} className="w-full">
              <Message message={message} />
            </div>
          ))}
      </div>
    </div>
  );
};

export default Chat;
