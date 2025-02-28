"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState, useRef } from "react";
import { BsArrowDownCircle } from "react-icons/bs";
import Message from "./Message";

const Chat = ({ id, messages, fetchMessages }: { 
  id: string;
  messages: any[];
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
    <div className="flex-1 overflow-y-auto p-4" ref={chatRef}>
      {/* ✅ Show loading before messages are fetched */}
      {loading && (
        <div className="flex flex-col items-center gap-2 py-5">
          <p>Loading messages...</p>
        </div>
      )}

      {/* ✅ Show error if API call fails */}
      {!loading && error && (
        <div className="flex flex-col items-center gap-2 py-5">
          <p className="text-red-500">Error loading messages. Using default messages.</p>
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
      {!loading &&
        [...messages].reverse().map((message) => (
          <div key={message.message_id}>
            <Message message={message} />
          </div>
        ))}
    </div>
  );
};

export default Chat;
