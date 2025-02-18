"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import NewChat from "./newChat";
import ChatRow from "./chatRow";
import { getUser } from "@/utils/getUser";
import Link from "next/link"; // ✅ Fix: Use Next.js Link
import { IoHome } from "react-icons/io5";

const Sidebar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", image: "" });

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    getUser(setIsLoggedIn, setUser, router, pathname);
  }, []);

  // Static chat data instead of Firestore
  const staticChats = [
    { id: "1", name: "Chat with GPT", lastMessage: "Hello! How can I help?" },
    { id: "2", name: "Work Discussion", lastMessage: "Let's schedule a meeting." },
    { id: "3", name: "Random Thoughts", lastMessage: "Did you know about AI?" },
  ];
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <div className="text-3xl text-indigo-600 m-2">
      {/* New Chat Button */}
      <div className="flex items-center justify-center w-full tracking-wide text-3xl px-2">
        <NewChat />
      </div>

      {/* Sidebar Content */}
      <div>
        {isLoggedIn ? (
          <>
            <p className="text-base font-semibold mt-4">Chat History</p>
            <div className="mt-4 overflow-y-scroll h-[80%]">
              {staticChats.length ? (
                staticChats.map((chat) => (
                  <ChatRow
                    key={chat.id}
                    id={chat.id}
                    name={chat.name}
                    lastMessage={chat.lastMessage}
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                  />
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">No chats found.</p>
                </div>
              )}
            </div>
          </>
        ) : (
          // Sign In Prompt if not logged in
          <div className="text-sm font-semibold text-center mt-10">
            <p>Please Sign in to view History.</p>
            <Link
              href="/signin"
              className="text-xl text-blue-500 hover:text-white duration-300 mt-2 underline"
            >
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
