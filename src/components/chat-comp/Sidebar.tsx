"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import NewChat from "./newChat";
import ChatRow from "./chatRow";
import { getUser } from "@/utils/getUser";
import Link from "next/link";
import { IoHome } from "react-icons/io5";

const Sidebar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", image: "" });
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    getUser(setIsLoggedIn, setUser, router, pathname);
  }, []);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/get-group-message/`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) throw new Error("Failed to fetch chats");

        const data = await response.json();

        console.log("Fetched Chats:", data); // ✅ Debugging API response

        // ✅ Ensure correct data extraction
        setChats(Array.isArray(data.message) ? data.message : []);
      } catch (err) {
        console.error("Error fetching chats:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (isLoggedIn) {
      fetchChats();
    }
  }, [isLoggedIn]);

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

            {/* ✅ Fix: Show loading state first */}
            {loading ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">Loading chats...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-sm text-red-500">Failed to load chats.</p>
              </div>
            ) : chats.length > 0 ? (
              <div className="mt-4 overflow-y-scroll h-[80%]">
                {chats.map((chat) => (
                  <ChatRow
                    key={chat.group_id}
                    id={chat.group_id}
                    name={chat.title}
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No chats found.</p>
              </div>
            )}
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
