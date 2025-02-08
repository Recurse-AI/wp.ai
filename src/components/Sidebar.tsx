'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Sidebar = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const router = useRouter();

  // Fetch chat history (currently static but can be replaced with API call)
  useEffect(() => {
    async function fetchChatHistory() {
      try {
        // Replace this URL with your actual API endpoint
        const response = await fetch('/api/chat-history');
        const data = await response.json();
        setChatHistory(data);
      } catch (error) {
        console.error('Failed to fetch chat history', error);
        setChatHistory([
          { id: 1, title: 'Chat with GPT-4' },
          { id: 2, title: 'WordPress Plugin Ideas' },
          { id: 3, title: 'Debugging WP Theme' },
        ]); // Dummy data fallback
      }
    }

    fetchChatHistory();
  }, []);

  return (
    <nav className="flex h-screen w-64 bg-gray-900 text-white flex-col p-4 transition-all duration-300 ease-in-out"
         style={{ width: isSidebarCollapsed ? '4rem' : '16rem' }}>
      
      {/* Logo & Toggle Button */}
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/logo.png" alt="wp.ai Logo" className="h-8 w-8" />
          {!isSidebarCollapsed && <span className="text-xl font-bold">wp.ai</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="text-white"
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        >
          {isSidebarCollapsed ? <Menu className="h-6 w-6" /> : <X className="h-6 w-6" />}
        </Button>
      </div>

      {/* Chat History */}
      <div className="mt-6">
        <h2 className={`text-sm font-semibold uppercase ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
          Chat History
        </h2>
        <ul className="mt-2">
          {chatHistory.map(chat => (
            <li key={chat.id} className="mt-2">
              <Link href={`/chat/${chat.id}`} className="block p-2 hover:bg-gray-700 rounded">
                {isSidebarCollapsed ? '💬' : chat.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;
