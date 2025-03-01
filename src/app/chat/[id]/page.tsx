"use client";

import React, { useState, useCallback, use } from "react";
import ChatInput from "@/components/chat-comp/chatInput";
import Chat from "@/components/chat-comp/chats";
import { fetchMessages } from "@/utils/fetchMessages"; 
import { useTheme } from "@/context/ThemeProvider";

interface Props {
  params: Promise<{ id: string }>;
}

const ChatPage = ({ params }: Props) => {
  useTheme();

  const { id } = use(params);
  const [messages, setMessages] = useState<any[]>([]);
  const [, setError] = useState(false);

  const fetchChatMessages = useCallback(async () => {
    await fetchMessages(id, setMessages, setError);
  }, [id]);

  return (
    <div className="flex flex-col justify-center h-full w-full">
      <div className="flex-1 overflow-y-auto w-full">
        <Chat id={id} messages={messages} setMessages={setMessages} fetchMessages={fetchChatMessages} />
      </div>

      <ChatInput id={id} setMessages={setMessages} fetchMessages={fetchChatMessages} />
    </div>
  );
};

export default ChatPage;
