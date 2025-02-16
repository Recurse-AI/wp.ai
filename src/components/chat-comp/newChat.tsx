"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaPlus } from "react-icons/fa";
import React from "react";

const NewChat = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const createNewChat = async () => {
    // ✅ Generate a dummy chat ID
    const dummyChatId = Math.random().toString(36).substring(2, 12);

    // ✅ Redirect to the new chat page with the dummy ID
    router.push(`/chat/${dummyChatId}`);
  };

  return (
    <button
      className="flex items-center justify-center gap-2 border border-white/20
        text-xs md:text-base px-2 py-1 rounded-md text-white/50 hover:border-white/10
        hover:text-white duration-300 tracking-wide w-full mx-1"
      onClick={createNewChat}
    >
      <FaPlus /> New Chat
    </button>
  );
};

export default NewChat;
