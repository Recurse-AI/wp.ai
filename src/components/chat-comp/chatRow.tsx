import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { BiSolidTrashAlt } from "react-icons/bi";
import { IoChatboxOutline } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaEdit, FaShareAlt } from "react-icons/fa";
import { createPortal } from "react-dom";

const ChatRow = ({ id, name, openDropdown, setOpenDropdown }: { 
  id: string; 
  name: string;
  openDropdown: string | null; 
  setOpenDropdown: (id: string | null) => void; 
}) => {
  const pathName = usePathname();
  const router = useRouter();
  const [active, setActive] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!pathName) return;
    setActive(pathName.includes(id));
  }, [pathName, id]);

  useEffect(() => {
    if (openDropdown === id && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width + 8, // Place dropdown outside to the right
      });
    }
  }, [openDropdown, id]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown === id) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown, id, setOpenDropdown]);

  const handleDropdownToggle = () => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleRemoveChat = () => {
    console.log(`Chat ${id} removed`);
    router.push(`/`);
  };

  const handleEditTitle = () => {
    const newTitle = prompt("Enter new chat title:", name);
    if (newTitle) {
      console.log(`Chat title changed to: ${newTitle}`);
    }
  };

  const handleShareChat = () => {
    const chatUrl = `${window.location.origin}/chat/${id}`;
    navigator.clipboard.writeText(chatUrl);
    alert("Chat link copied to clipboard!");
  };

  return (
    <div className="relative flex items-center">
      <Link
        href={`/chat/${id}`}
        className={`flex items-center justify-between flex-1 p-2.5 rounded-md text-base
          hover:bg-white/10 ease-in ${
            active ? "bg-white/30" : "bg-transparent"
          }`}
      >
        <div className="flex items-center gap-2">
          <IoChatboxOutline />
          {/* ✅ Truncate long titles */}
          <div className="hidden md:inline-flex flex-1">
            <p className="truncate text-sm font-medium tracking-wide">
              {name.length > 20 ? name.slice(0, 17) + "..." : name}
            </p>
          </div>
        </div>
      </Link>

      {/* Button for Dropdown */}
      <div ref={buttonRef} className="relative" onClick={handleDropdownToggle}>
        <BsThreeDotsVertical
          className="text-white/50 hover:text-gray-300 duration-300 text-base ease-in-out cursor-pointer"
        />

        {/* Render Dropdown Outside of Sidebar */}
        {openDropdown === id &&
          createPortal(
            <div
              className="fixed bg-gray-800 text-white shadow-lg rounded-md w-40 z-50"
              style={{
                top: dropdownPosition.top,
                left: dropdownPosition.left,
              }}
              onClick={() => setOpenDropdown(null)}
            >
              <button
                onClick={handleEditTitle}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-700"
              >
                <FaEdit /> Edit Title
              </button>
              <button
                onClick={handleShareChat}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-700"
              >
                <FaShareAlt /> Share
              </button>
              <button
                onClick={handleRemoveChat}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-700"
              >
                <BiSolidTrashAlt /> Delete
              </button>
            </div>,
            document.body // Ensures the dropdown renders outside the sidebar
          )}
      </div>
    </div>
  );
};

export default ChatRow;
