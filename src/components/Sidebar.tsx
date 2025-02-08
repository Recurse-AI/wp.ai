"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { FaCommentDots } from "react-icons/fa";

const Sidebar = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  interface Chat {
    id: number;
    title: string;
  }

  const [chatHistory, setChatHistory] = useState<Chat[]>([]);

  // Fetch chat history (currently static but can be replaced with API call)
  useEffect(() => {
    async function fetchChatHistory() {
      try {
        // Replace this URL with your actual API endpoint '/api/chat-history'
        const response = await fetch('/chatHistory.json');
        const data = await response.json();
        setChatHistory(data);
      } catch (error) {
        console.error('Failed to fetch chat history', error);
      }
    }

    fetchChatHistory();
  }, []);

  return (
    <nav
      className="flex h-screen w-64 bg-gray-900 text-white flex-col p-4 transition-all duration-300 ease-in-out"
      style={{ width: isSidebarCollapsed ? "4rem" : "16rem" }}
    >
      {/* Logo & Toggle Button */}
      <div className="flex items-center justify-between">
        
        <button className="text-white" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
          {isSidebarCollapsed ? <Menu className="h-6 w-6" /> : <X className="h-6 w-6" />}
        </button>
      </div>

      {/* Chat History */}
      <div className="mt-6">
        <h2 className={`text-sm font-semibold uppercase ${isSidebarCollapsed ? "hidden" : "block"}`}>
          Chat History
        </h2>
        <ul className="mt-2">
          {chatHistory.map((chat) => (
            <li key={chat.id} className="mt-2">
              <Link href={`/chat/${chat.id}`} className="flex items-center p-2 hover:bg-gray-700 rounded">
                <FaCommentDots className="mr-2" />
                {!isSidebarCollapsed && chat.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
