/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useCallback } from "react";
import ChatInput from "@/components/chat-comp/chatInput";
import Chat from "@/components/chat-comp/chats";
import { fetchMessages } from "@/utils/fetchMessages"; // ✅ Import fetch function

interface Props {
  params: { id: string };
}

const ChatPage = ({ params }: Props) => {
  const { id } = params; // ✅ Await is not needed

  // ✅ Store messages in ChatPage.tsx
  const [messages, setMessages] = useState<any[]>([]);
  const [error, setError] = useState(false);

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
