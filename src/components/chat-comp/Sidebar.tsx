"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import NewChat from "./newChat";
import ChatRow from "./chatRow";
import { getUser } from "@/utils/getUser";
import Link from "next/link";
import { useTheme } from "@/context/ThemeProvider";

const Sidebar = () => {
  const { theme } = useTheme();
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
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AUTH_API_URL}/get-group-message/`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) throw new Error("Failed to fetch chats");

        const data = await response.json();

        console.log("Fetched Chats:", data);

        setChats(Array.isArray(data.message) ? data.message.reverse() : []);
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
    <div
      className={`h-screen shadow-lg p-6 w-full max-w-md transition-all duration-300
      ${
        theme === "dark"
          ? "bg-gray-900/80 backdrop-blur-md shadow-md"
          : "bg-gray-200 border-r "
      }`}
    >
      {/* New Chat Button */}
      <div
        className={`flex items-center justify-center w-full tracking-wide text-3xl px-2 font-semibold`}
      >
        <NewChat />
      </div>

      {/* Sidebar Content */}
      <div className="mt-6">
        {isLoggedIn ? (
          <>
            <p
              className={`text-base font-semibold ${
                theme === "dark" ? "text-gray-300" : "text-gray-800"
              }`}
            >
              Chat History
            </p>

            {loading ? (
              <div className="py-6 text-center">
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Loading chats...
                </p>
              </div>
            ) : error ? (
              <div className="py-6 text-center">
                <p className="text-sm text-red-500">Failed to load chats.</p>
              </div>
            ) : chats.length > 0 ? (
              <div
                className="mt-4 overflow-y-scroll h-[75vh] scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent
                scrollbar-thumb-rounded-lg gap-2"
              >
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
              <div className="py-6 text-center">
                <p
                  className={`text-sm ${
                    theme === "dark" ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  No chats found.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-sm font-semibold text-center mt-10">
            <p className={`${theme === "dark" ? "text-white" : "text-black"}`}>
              Please Sign in to view History.
            </p>
            <Link
              href="/signin"
              className={`text-xl font-medium ${
                theme === "dark"
                  ? "text-blue-400 hover:text-white"
                  : "text-blue-500 hover:text-gray-700"
              } duration-300 mt-2 underline`}
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
