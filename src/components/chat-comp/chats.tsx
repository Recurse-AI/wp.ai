"use client";
import { useSession } from "next-auth/react";
import React from "react";
import { BsArrowDownCircle } from "react-icons/bs";
import Message from "./Message";

const chat = ({ id }: { id: string }) => {
  const { data: session } = useSession();
  const userEmail = session?.user
    ? (session?.user?.email as string)
    : "anonymous";

  // Static messages for testing
  const messages = [
    { id: "1", text: "Hello, how can I help you?", createdAt: new Date(), user: { _id: "1", name: "Support", avatar: "support-avatar.png" } },
    { id: "2", text: "I need some information on Next.js.", createdAt: new Date(), user: { _id: "2", name: "User", avatar: "user-avatar.png" } },
    { id: "3", text: "Sure! Next.js is a React framework for production.", createdAt: new Date(), user: { _id: "1", name: "Support", avatar: "support-avatar.png" } },
  ];

  return (
    <div>
      {messages.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-5">
          <p>Type a prompt to get started!</p>
          <BsArrowDownCircle className="text-xl text-green-300 animate-bounce" />
        </div>
      )}
      {messages.map((message) => (
        <div key={message.id}>
          <Message message={message} />
        </div>
      ))}
    </div>
  );
};

export default chat;
