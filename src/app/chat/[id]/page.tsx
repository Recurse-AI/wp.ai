"use client";

import React, { useState, useCallback, use } from "react";
import ChatInput from "@/components/chat-comp/chatInput";
import Chat from "@/components/chat-comp/chats";
import { fetchMessages } from "@/utils/fetchMessages"; // ✅ Import fetch function
import { useTheme } from "@/context/ThemeProvider";

interface Props {
  params: Promise<{ id: string }>; // ✅ params is a Promise
}

const ChatPage = ({ params }: Props) => {
  useTheme();

  // ✅ Unwrap params using `use()`
  const { id } = use(params);

  // ✅ Store messages in ChatPage.tsx
  const [messages, setMessages] = useState<any[]>([]);
  const [, setError] = useState(false);

  // ✅ Define fetchMessages function here
  const fetchChatMessages = useCallback(async () => {
    await fetchMessages(id, setMessages, setError);
  }, [id]);

  return (
    <div className="flex flex-col justify-center h-[100%] p-5 overflow-hidden">
      <div className="flex-1 overflow-y-auto pt-10">
        {/* ✅ Pass `messages` and `setMessages` to `Chat.tsx` */}
        <Chat id={id} messages={messages} setMessages={setMessages} fetchMessages={fetchChatMessages} />
      </div>

      {/* ✅ Pass `setMessages` to ChatInput */}
      <ChatInput id={id} setMessages={setMessages} fetchMessages={fetchChatMessages} />
    </div>
  );
};

export default ChatPage;
