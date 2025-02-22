"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useRef } from "react";
import { FaCamera, FaCube } from "react-icons/fa";
import { ImArrowUpRight2 } from "react-icons/im";
import { IoGlobeOutline } from "react-icons/io5";
import { MdImage, MdSmartToy } from "react-icons/md";
import { TbPaperclip } from "react-icons/tb";
import { fetchMessages } from "@/utils/fetchMessages";
import toast from "react-hot-toast"; // ✅ For success & error messages
import ProcessingMessage from "./processingMessage";


const ChatInput = ({
  id,
  setMessages,
  fetchMessages,
}: {
  id: string;
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  fetchMessages: () => void;
}) => {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "anonymous";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showProcessing, setShowProcessing] = useState(false); 

  // ✅ Handle text input & auto-expand textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Maximum height for 5 lines
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  // ✅ Handle chat submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!prompt.trim()) return; // ✅ Avoid empty messages
  
    console.log("Prompt:", prompt);
    console.log("Chat ID:", id ? "id ase" : "id nai");

    // ✅ Show ProcessingMessage if it's a new chat
    if (!id) {
      setShowProcessing(true);
    }
  
    // ✅ Temporary Message Object (Shows Immediately)
    const tempMessage = {
      message_id: "temp_" + new Date().getTime(), // Unique ID for temp message
      group: id || "new_chat",
      owner_name: "You", // User who sent the prompt
      user_prompt: prompt,
      ai_response: "Loading...", // ✅ Show this until API responds
      created_at: new Date().toISOString(),
      parent_message: localStorage.getItem("lastMessageId") || null,
    };
  
    // ✅ Add Temporary Message to UI
    if(id){
      setMessages((prevMessages) => [...prevMessages, tempMessage]);
    }
  
    // ✅ Prepare Request Body
    const requestBody = id
      ? {
          prompt: prompt,
          group_id: id,
          parent_message_id: localStorage.getItem("lastMessageId") || null,
        }
      : { prompt: prompt };
  
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        credentials: "include",
      });
      console.log(res)
  
      const data = await res.json();
  
      if (res.ok) {
        // toast.success("Message sent!");
  
        const newChatId = data.chat_group.group_id;
  
        if(id){
          setMessages((prevMessages) => {
            // ✅ Remove Temporary Message
            const updatedMessages = prevMessages.filter((msg) => msg.message_id !== tempMessage.message_id);
            localStorage.setItem("set-to-flow",data.chat_message.message_id);
    
            console.log("🔹 Previous Messages Without Temp:", updatedMessages);
            console.log("🆕 New Message from API:", data.chat_message);
    
            // ✅ Add the real message from API response
            return [...updatedMessages, data.chat_message];
          });
          // fetchMessages(); // ✅ Ensure full refresh of messages
          setShowProcessing(false);
        }
        else{
          setShowProcessing(false);
          window.location.href = `/chat/${newChatId}`;
        }
  
        setPrompt(""); // ✅ Clear input field
      } else {
        toast.error(data.message || "Failed to send message.");
  
        // ✅ Remove Temporary Message on Error
        setMessages((prevMessages) => prevMessages.filter((msg) => msg.message_id !== tempMessage.message_id));
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.error("Something went wrong. Try again later.");
  
      // ✅ Remove Temporary Message on Error
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.message_id !== tempMessage.message_id));
    }
  };
  
  

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-3xl mx-auto pt-3 px-4">
      
      {/* ✅ Show Processing Message */}
      {showProcessing ? (
        <ProcessingMessage isOpen={showProcessing}/>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[#2A2A2A] rounded-2xl flex items-center px-5 py-4 w-full relative">
          {/* Input Field Wrapper */}
          <div className="relative w-full flex flex-col space-y-2">
            {/* Input Field (Expands up to 5 lines) */}
            <textarea
              ref={textareaRef}
              placeholder="How can I help you today?"
              onChange={handleInput}
              value={prompt}
              className="bg-transparent text-gray-300 placeholder:text-gray-500 px-3 outline-none 
                  w-full font-medium tracking-wide text-base resize-none overflow-y-auto"
              style={{
                minHeight: "40px", // Starts at 1 line height
                maxHeight: "120px", // Stops expanding after 5 lines
                height: "40px", // Initial height
                paddingBottom: "10px", // Prevent text from touching the bottom
                lineHeight: "24px", // Maintain proper line spacing
              }}
            />
  
            {/* Bottom Options (Always Below Input) */}
            <div className="flex justify-start px-3 gap-4 text-gray-500 text-xs">
              <div className="flex items-center gap-1 cursor-pointer hover:text-white">
                <FaCube className="text-sm" /> <span>Artifacts</span>
              </div>
              <div className="flex items-center gap-1 cursor-pointer hover:text-white">
                <IoGlobeOutline className="text-sm" /> <span>Web Search</span>
              </div>
              <div className="flex items-center gap-1 cursor-pointer hover:text-white">
                <MdImage className="text-sm" /> <span>Image Generation</span>
              </div>
              <div className="flex items-center gap-1 cursor-pointer hover:text-white">
                <MdSmartToy className="text-sm" /> <span>Video Generation</span>
              </div>
            </div>
          </div>
  
          {/* Right Side Icons */}
          <div className="flex items-center gap-3">
            <TbPaperclip className="text-lg text-gray-400 cursor-pointer hover:text-white" />
            <FaCamera className="text-lg text-gray-400 cursor-pointer hover:text-white" />
            <button
              type="submit"
              disabled={!prompt.trim()} // Disable if input is empty
              className="p-2.5 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-700 flex items-center justify-center transition-all"
            >
              <ImArrowUpRight2 className="text-white text-lg" />
            </button>
          </div>
        </form>
      )}
  
      {/* ✅ ChatGPT Info Footer */}
      <p className="text-xs mt-2 text-gray-500 font-medium tracking-wide">
        ChatGPT can make mistakes. Check important info.
      </p>
    </div>
  );
  
};

export default ChatInput;
