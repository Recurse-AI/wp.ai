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
    {
      id: "4",
      text: "Can I use API routes in Next.js?",
      createdAt: new Date(),
      user: { _id: "2", name: "User", avatar: "/user1.jpg" },
    },
    {
      id: "5",
      text: "Yes! API routes allow you to build backend functionality inside your Next.js app.",
      createdAt: new Date(),
      user: { _id: "1", name: "Support", avatar: "/wp.webp" },
    },
    {
      id: "6",
      text: "That's great! How do I deploy my Next.js app?",
      createdAt: new Date(),
      user: { _id: "2", name: "User", avatar: "/user1.jpg" },
    },
    {
      id: "7",
      text: "You can deploy it using Vercel, Netlify, or a custom server.",
      createdAt: new Date(),
      user: { _id: "1", name: "Support", avatar: "/wp.webp" },
    },
    {
      id: "8",
      text: "What are the advantages of using Next.js?",
      createdAt: new Date(),
      user: { _id: "2", name: "User", avatar: "/user1.jpg" },
    },
    {
      id: "9",
      text: "It offers fast performance, built-in SEO optimization, static site generation, and API routes.",
      createdAt: new Date(),
      user: { _id: "1", name: "Support", avatar: "/wp.webp" },
    },
    {
      id: "10",
      text: "Thank you for the information! ",
      createdAt: new Date(),
      user: { _id: "2", name: "User", avatar: "/user1.jpg" },
    },
    {
      id: "11",
      text: "You're welcome! Let me know if you have any other questions.",
      createdAt: new Date(),
      user: { _id: "1", name: "Support", avatar: "/wp.webp" },
    },
    {
      id: "12",
      text: "**Welcome to WP.AI!**\n\n- You can use **bold** text\n- Or `inline code`\n\n```javascript\nconsole.log('Hello, Markdown!');\n```",
      createdAt: new Date("2024-02-20T12:00:00Z"),
      user: {
        "_id": "2",
        "name": "Support",
        "avatar": "/user1.jpg"
      }
    }
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
