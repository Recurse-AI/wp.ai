"use client";

import { useSession } from "next-auth/react";
import React, { useEffect, useState, useRef } from "react";
import { BsArrowDownCircle } from "react-icons/bs";
import Message from "./Message";

const Chat = ({ id }: { id: string }) => {
  console.log("Chat ID:", id); // ✅ Debugging: Ensures ID is received

  const { data: session } = useSession();
  const userEmail = session?.user ? (session?.user?.email as string) : "anonymous";

  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const defaultMessages = [
    {
      id: "1",
      text: "Hello, how can I help you?",
      createdAt: new Date(),
      user: { _id: "1", name: "Support", avatar: "/wp.webp" },
    },
    {
      id: "2",
      text: "I need some information on Next.js.",
      createdAt: new Date(),
      user: { _id: "2", name: "User", avatar: "/user1.jpg" },
    },
    {
      id: "3",
      text: "Sure! Next.js is a React framework that enables server-side rendering and static site generation.",
      createdAt: new Date(),
      user: { _id: "1", name: "Support", avatar: "/wp.webp" },
    },
  ];

  useEffect(() => {
    const fetchMessages = async () => {
      console.log("🔹 Fetching messages...");
      if (!id) {
        console.warn("❌ No ID provided, skipping API call.");
        return;
      }

      setLoading(true); // ✅ Show loading before API call
      setError(false);  // ✅ Reset error before making the request

      try {
        console.log("🔹 Fetching messages for ID:", id);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AUTH_API_URL}/get-all-message?id=${id}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch messages");

        const data = await response.json();
        console.log("✅ Messages fetched:", data);

        setMessages(data.length ? data : defaultMessages);
      } catch (error) {
        console.error("❌ Error fetching messages:", error);
        setError(true);
        setMessages(defaultMessages);
      } finally {
        setLoading(false); // ✅ Hide loading after request completes
      }
    };

    fetchMessages();
  }, [id]); // ✅ Runs every time `id` changes

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
