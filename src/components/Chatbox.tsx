"use client";

import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaImage, FaFilePdf } from "react-icons/fa";

export default function Chatbox() {
  const [messages, setMessages] = useState([
    { id: 1, sender: "bot", text: "Hello! How can I help you today?" },
    { id: 2, sender: "user", text: "I need help with WordPress plugins." },
  ]);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<
    { id: number; type: string; url: string }[]
  >([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 🔹 Scroll chat to bottom on new message
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, files]);

  // 🔹 Send Message
  const sendMessage = () => {
    if (!input.trim()) return;
    const newMessage = { id: messages.length + 1, sender: "user", text: input };
    setMessages([...messages, newMessage]);
    setInput("");

    // Simulate bot response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "bot",
          text: "Sure! What do you need help with?",
        },
      ]);
    }, 1000);
  };

  // 🔹 Handle File Upload
  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: string
  ) => {
    if (!event.target.files) return;
    const file = event.target.files[0];
    const fileUrl = URL.createObjectURL(file);

    setFiles((prev) => [...prev, { id: prev.length + 1, type, url: fileUrl }]);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-800">
      {/* 🔹 Chat Header (Fixed) */}
      <div className="p-4 bg-gray-900 text-center font-bold text-xl fixed top-15 left-20 w-full z-10">
        Chat with WP.ai
      </div>

      {/* 🔹 Chat Messages (Scrollable) */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mt-16 p-4 space-y-4 h-full"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-lg ${
                msg.sender === "user" ? "bg-blue-600 text-white" : "bg-gray-700"
              } max-w-xs sm:max-w-md`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* Uploaded Files Display */}
        {files.map((file) => (
          <div key={file.id} className="flex justify-end">
            {file.type === "image" ? (
              <img
                src={file.url}
                alt="Uploaded"
                className="rounded-lg max-w-[200px]"
              />
            ) : (
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                📄 View PDF
              </a>
            )}
          </div>
        ))}
      </div>

      {/* 🔹 Chat Input Box (Fixed at Bottom) */}
      <div className="p-4 bg-gray-900 flex items-center gap-2 sticky bottom-0 z-10">
        <input
          type="text"
          className="flex-1 p-3 rounded-md bg-gray-700 text-white outline-none"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="p-3 bg-blue-600 hover:bg-blue-700 rounded-md"
          onClick={sendMessage}
        >
          <FaPaperPlane />
        </button>

        {/* Image Upload */}
        <label className="p-3 bg-green-600 hover:bg-green-700 rounded-md cursor-pointer">
          <FaImage />
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "image")}
          />
        </label>

        {/* PDF Upload */}
        <label className="p-3 bg-red-600 hover:bg-red-700 rounded-md cursor-pointer">
          <FaFilePdf />
          <input
            type="file"
            className="hidden"
            accept="application/pdf"
            onChange={(e) => handleFileUpload(e, "pdf")}
          />
        </label>
      </div>
    </div>
  );
}
