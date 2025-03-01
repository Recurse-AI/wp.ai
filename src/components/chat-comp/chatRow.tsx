import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { BiSolidTrashAlt } from "react-icons/bi";
import { IoChatboxOutline } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaEdit, FaCheck } from "react-icons/fa";
import { createPortal } from "react-dom";
import { useTheme } from "@/context/ThemeProvider";

const ChatRow = ({
  id,
  name,
  openDropdown,
  setOpenDropdown,
}: {
  id: string;
  name: string;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
}) => {
  const { theme } = useTheme();
  const pathName = usePathname();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const [isEditing, setIsEditing] = useState(false); // ✅ Track editing state
  const [newTitle, setNewTitle] = useState(name); // ✅ Track new title
  const [loading, setLoading] = useState(false); // ✅ Loading state for API call

  useEffect(() => {
    if (!pathName) return;
    setActive(pathName.includes(id));
  }, [pathName, id]);

  useEffect(() => {
    if (openDropdown === id && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top + window.scrollY,
        left: rect.left + rect.width + 8,
      });
    }
  }, [openDropdown, id]);

  // useEffect(() => {
  //   const handleClickOutside = (event: MouseEvent) => {
  //     if (
  //       buttonRef.current &&
  //       !buttonRef.current.contains(event.target as Node)
  //     ) {
  //       setOpenDropdown(null);
  //     }
  //   };

  //   if (openDropdown === id) {
  //     document.addEventListener("mousedown", handleClickOutside);
  //   } else {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   }

  //   return () => document.removeEventListener("mousedown", handleClickOutside);
  // }, [openDropdown, id, setOpenDropdown]);

  // ✅ Update newTitle when name changes
  useEffect(() => {
    setNewTitle(name);
  }, [name]);

  const handleDropdownToggle = () => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  // ✅ Handle Title Update API Call
  const updateTitle = async () => {
    if (!newTitle.trim() || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_CHAT_API_URL}/edit-title/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "group-id": id,
          title: newTitle,
        }),
        credentials: "include"
      });

      if (!res.ok) throw new Error("Failed to update title");

      setIsEditing(false); // ✅ Exit editing mode
      setOpenDropdown(null); // ✅ Close dropdown
    } catch (error) {
      console.error("Error updating title:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full">
      <div
        className={`relative flex items-center justify-between w-full p-2.5 rounded-md ${
          active ? (theme === "dark" ? "bg-gray-600" : "bg-gray-300") : ""
        }`}
      >
        {/* ✅ Editable Title */}
        <div className="flex items-center flex-1 whitespace-nowrap overflow-hidden">
          {isEditing ? (
            <div className="flex items-center w-full">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && updateTitle()}
                className="bg-transparent text-lg font-medium outline-none w-full border-b border-gray-400"
                autoFocus
              />
              <FaCheck
                onClick={updateTitle}
                className="text-green-500 ml-2 cursor-pointer"
              />
            </div>
          ) : (
            <Link href={`/chat/${id}`} className="flex-1 truncate text-lg font-medium tracking-wide">
              {name.length > 20 ? name.slice(0, 20) + "..." : name}
            </Link>
          )}
        </div>

        {/* Three-Dot Button */}
        <div
          ref={buttonRef}
          className="flex items-center px-2 cursor-pointer"
          onClick={handleDropdownToggle}
        >
          <BsThreeDotsVertical
            className={`text-base ease-in-out ${
              theme === "dark"
                ? active
                  ? "text-white"
                  : "text-white/50 hover:text-gray-300"
                : active
                ? "text-black"
                : "text-black/50 hover:text-gray-600"
            }`}
          />
        </div>
      </div>

      {/* Dropdown Menu */}
      {openDropdown === id &&
        createPortal(
          <div
            className={`fixed shadow-lg rounded-md w-40 z-50 ${
              theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"
            }`}
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
            onClick={(e) => e.stopPropagation()} // ✅ Prevent dropdown from closing immediately
          >
            {/* ✅ Edit Title Button */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // ✅ Prevent event bubbling
                console.log("Clicked Edit Title"); // ✅ Debugging log

                // ✅ Delay closing dropdown slightly to ensure state updates
                setTimeout(() => {
                  setIsEditing(true);
                  console.log("Editing title mode:", isEditing);
                }, 50);

                setOpenDropdown(null); // ✅ Close dropdown after a slight delay
              }}
              className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-300"
              }`}
            >
              <FaEdit /> Edit Title
            </button>

            {/* ✅ Delete Button */}
            <button className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-700">
              <BiSolidTrashAlt /> Delete
            </button>
          </div>,
          document.body
        )}

    </div>
  );
};

export default ChatRow;
