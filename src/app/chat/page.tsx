"use client"
import React from "react";
import Head from "next/head";
import ChatInput from "@/components/chat-comp/chatInput"
import { useTheme } from "@/context/ThemeProvider";

const Page = () => {
  const {theme} = useTheme()
  console.log(`Theme: ${theme}`)
  return (
    <>
      <div
        className={`min-h-screen flex flex-col items-center
   justify-center px-2`}
      >
        <div
          className="max-w-4xl mx-auto flex flex-col items-center
    gap-5 w-full"
        >
          <h2 className="text-xl md:text-3xl font-semibold">
            How can i help you?
          </h2>
        </div>
        <ChatInput id={""} />
      {/* <ChatHelp /> */}
      </div>
    </>
  );
};

export default Page;
