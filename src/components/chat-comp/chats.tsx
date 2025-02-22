"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState, useRef } from "react";
import { BsArrowDownCircle } from "react-icons/bs";
import Message from "./Message";
import { fetchMessages } from "@/utils/fetchMessages"; // ✅ Import from utils
import router from "next/router";

const Chat = ({ id, messages, setMessages, fetchMessages }: { 
  id: string;
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  fetchMessages: () => void;
}) => {
  console.log("Chat ID:", id); // ✅ Debugging: Ensures ID is received

  const { data: session } = useSession();
  // const userEmail = session?.user ? (session?.user?.email as string) : "anonymous";

  // const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ✅ This effect runs when `messages` updates
  useEffect(() => {
      console.log("✅ Messages updated:", messages);
      setLoading(false);
  }, [messages]); // ✅ Logs after messages are fetched


  const chatRef = useRef<HTMLDivElement | null>(null);

  // Scroll to the latest message
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={chatRef}>
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

      {/* ✅ Display messages when available */}
      {!loading &&
        messages.map((message) => (
          <div key={message.message_id}>
            <Message message={message} />
          </div>
        ))}
    </div>
  );
};

export default Chat;
