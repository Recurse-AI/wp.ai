"use client"
import React from "react";
import ChatInput from "@/components/chat-comp/chatInput"
import { useTheme } from "@/context/ThemeProvider";

const Page = () => {
  const { theme } = useTheme();
  console.log(`Theme: ${theme}`);

  return (
    <div className="h-full flex flex-col items-center justify-center px-2 overflow-hidden">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-5 w-full">
        <h2 className="text-xl md:text-3xl font-semibold">
          How can I help you?
        </h2>
      </div>
      <ChatInput id={""} />
    </div>
  );
};

export default Page;
