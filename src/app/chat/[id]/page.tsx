import ChatInput from "@/components/chat-comp/chatInput";
import React from "react";
import Chat from "@/components/chat-comp/chats";

interface Props {
  params: { id: string };
}

const ChatPage = async ({ params }: Props) => {
  const { id } = await params; // Awaiting is not necessary here

  console.log(id); // ✅ Now `id` is safely accessed

  return (
    <div className="flex flex-col justify-center h-[100%] p-5 overflow-hidden">
      <div className="flex-1 overflow-y-auto pt-10">
        <Chat id={id}/>
        {/* chat */}
      </div>
      <ChatInput id={id} />
    </div>
  );
};

export default ChatPage;
