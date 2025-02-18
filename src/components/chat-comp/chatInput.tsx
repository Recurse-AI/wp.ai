"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState, useRef } from "react";
import { FaCamera, FaCube } from "react-icons/fa";
import { ImArrowUpRight2 } from "react-icons/im";
import { IoGlobeOutline } from "react-icons/io5";
import { MdImage, MdSmartToy } from "react-icons/md";
import { TbPaperclip } from "react-icons/tb";

const ChatInput = ({ id }: { id: string }) => {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "anonymous";
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  let chatId = id;

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = "40px"; // Reset height
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Maximum height for 5 lines
      textareaRef.current.style.height = `${Math.min(
        scrollHeight,
        maxHeight
      )}px`;
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center max-w-3xl mx-auto pt-3 px-4">
      <form className="bg-[#2A2A2A] rounded-2xl flex items-center px-5 py-4 w-full relative">
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
            disabled={!prompt}
            className="p-2.5 rounded-full bg-gray-600 disabled:bg-gray-700 flex items-center justify-center"
          >
            <ImArrowUpRight2 className="text-white text-lg" />
          </button>
        </div>
      </form>

      {/* ChatGPT Info Footer */}
      <p className="text-xs mt-2 text-gray-500 font-medium tracking-wide">
        ChatGPT can make mistakes. Check important info.
      </p>
    </div>
  );
};

export default ChatInput;

// "use client";
// import { useSession } from "next-auth/react";
// import { useRouter } from "next/navigation";
// import React, { useState, useRef, useEffect } from "react";
// import { FaCamera, FaCube } from "react-icons/fa";
// import { ImArrowUpRight2 } from "react-icons/im";
// import { IoGlobeOutline } from "react-icons/io5";
// import { MdImage, MdSmartToy } from "react-icons/md";
// import { TbPaperclip } from "react-icons/tb";

// const ChatInput = ({ id }: { id: string }) => {
//   const router = useRouter();
//   const [prompt, setPrompt] = useState("");
//   const { data: session } = useSession();
//   const userEmail = session?.user?.email || "anonymous";
//   const textareaRef = useRef<HTMLTextAreaElement>(null);
//   let chatId = id;

//   useEffect(() => {
//     if (textareaRef.current) {
//       textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
//     }
//   }, [prompt]);

//   const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     setPrompt(e.target.value);

//     if (textareaRef.current) {
//       textareaRef.current.scrollTop = textareaRef.current.scrollHeight; // Keep input at last typed line
//     }
//   };

//   return (
//     <div className="w-full flex flex-col items-center justify-center max-w-3xl mx-auto pt-3 px-4">
//       <form className="bg-[#2A2A2A] rounded-2xl flex items-center px-5 py-4 w-full relative">
//         {/* Input Field Wrapper */}
//         <div className="relative w-full flex flex-col">
//           {/* Input Field (Cursor Fixed at First Typed Line) */}
//           <textarea
//             ref={textareaRef}
//             placeholder="How can I help you today?"
//             onChange={handleInput}
//             value={prompt}
//             rows={5} // Max 5 lines
//             className="bg-transparent text-gray-300 placeholder:text-gray-500 px-3 outline-none w-full font-medium tracking-wide text-base resize-none overflow-y-auto max-h-[120px] leading-[24px]"
//             style={{
//               minHeight: "40px",
//               maxHeight: "120px", // Prevents growing beyond 5 lines
//               overflowY: "auto", // Allows scrolling inside
//               paddingBottom: "15px", // Space for bottom options
//             }}
//           />

//           {/* Bottom Options (Always Fixed at Bottom) */}
//           <div className="absolute bottom-1 left-0 right-0 flex justify-start px-3 gap-4 text-gray-500 text-xs">
//             <div className="flex items-center gap-1 cursor-pointer hover:text-white">
//               <FaCube className="text-sm" /> <span>Artifacts</span>
//             </div>
//             <div className="flex items-center gap-1 cursor-pointer hover:text-white">
//               <IoGlobeOutline className="text-sm" /> <span>Web Search</span>
//             </div>
//             <div className="flex items-center gap-1 cursor-pointer hover:text-white">
//               <MdImage className="text-sm" /> <span>Image Generation</span>
//             </div>
//             <div className="flex items-center gap-1 cursor-pointer hover:text-white">
//               <MdSmartToy className="text-sm" /> <span>Video Generation</span>
//             </div>
//           </div>
//         </div>

//         {/* Right Side Icons */}
//         <div className="flex items-center gap-3">
//           <TbPaperclip className="text-lg text-gray-400 cursor-pointer hover:text-white" />
//           <FaCamera className="text-lg text-gray-400 cursor-pointer hover:text-white" />
//           <button
//             type="submit"
//             disabled={!prompt}
//             className="p-2.5 rounded-full bg-gray-600 disabled:bg-gray-700 flex items-center justify-center"
//           >
//             <ImArrowUpRight2 className="text-white text-lg" />
//           </button>
//         </div>
//       </form>

//       {/* ChatGPT Info Footer */}
//       <p className="text-xs mt-2 text-gray-500 font-medium tracking-wide">
//         ChatGPT can make mistakes. Check important info.
//       </p>
//     </div>
//   );
// };

// export default ChatInput;

//   const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!prompt.trim()) return;

//     const input = prompt.trim();
//     const message = {
//       text: input,
//       createdAt: Date.now(),
//       user: {
//         _id: userEmail,
//         name: session?.user?.name || "Anonymous",
//         avatar:
//           session?.user?.image || "https://i.ibb.co.com/XC0YX8v/avatar.png",
//       },
//     };

//     try {
//       setPrompt("");

//       // If chat ID is not available, create a new one
//       if (!id) {
//         const docRef = await addDoc(
//           collection(db, "users", userEmail, "chats"),
//           {
//             userId: userEmail,
//             createdAt: serverTimestamp(),
//           }
//         );
//         chatId = docRef.id;
//         router.push(`/chat/${chatId}`);
//       }

//       await addDoc(
//         collection(db, "users", userEmail, "chats", chatId, "messages"),
//         message
//       );

//       const notification = toast.loading("ChatGPT is thinking...");

//       await fetch("/api/askChat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           model,
//           prompt: input,
//           id: chatId,
//           sessionId: userEmail,
//         }),
//       }).then(async (res) => {
//         const data = await res.json();
//         if (data?.success) {
//           toast.success(data?.message, { id: notification });
//         } else {
//           toast.error(data?.message, { id: notification });
//         }
//       });
//     } catch (error) {
//       console.error(`Error sending message: ${error}`);
//       toast.error("Failed to send message, try again");
//     }
//   };
