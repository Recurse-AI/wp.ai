import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { BiSolidTrashAlt } from "react-icons/bi";
import { IoChatboxOutline } from "react-icons/io5";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaEdit, FaShareAlt } from "react-icons/fa";
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
        left: rect.left + rect.width + 8,
      });
    }
  }, [openDropdown, id]);

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

  return (
    <div className="relative w-full">
      <div
        className={`relative flex items-center justify-between w-full p-2.5 rounded-md ${
          active ? (theme === "dark" ? "bg-gray-600" : "bg-gray-300") : ""
        }`}
      >
        {/* Ensure Link Takes Full Width */}
        <Link
          href={`/chat/${id}`}
          className="flex items-center flex-1 whitespace-nowrap overflow-hidden"
        >
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <p
              className="truncate text-lg font-medium tracking-wide"
              title={name}
            >
              {name.length > 20 ? name.slice(0, 20) + "..." : name}
            </p>
          </div>
        </Link>

        {/* Ensure Three-Dot Button Aligns Properly */}
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
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-black"
            }`}
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
            }}
            onClick={() => setOpenDropdown(null)}
          >
            <button
              className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-300"
              }`}
            >
              <FaEdit /> Edit Title
            </button>
            <button
              className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-300"
              }`}
            >
              <FaShareAlt /> Share
            </button>
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
