import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { BiSolidTrashAlt } from "react-icons/bi";
import { BsThreeDotsVertical } from "react-icons/bs";
import { FaEdit, FaCheck } from "react-icons/fa";
import { createPortal } from "react-dom";
import { useTheme } from "@/context/ThemeProvider";
import { toast } from "react-hot-toast";
import { getToastStyle } from "@/lib/toastConfig";
import { formatDistanceToNow } from "date-fns";
// import { useRouter } from "next/router";

const ChatRow = ({
  id,
  name,
  openDropdown,
  setOpenDropdown,
  refreshChats,
  onSelect,
  onDelete,
  lastMessage,
  timestamp,
}: {
  id: string;
  name: string;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  refreshChats: () => void;
  onSelect?: (id: string) => void;
  onDelete?: () => void;
  lastMessage?: string;
  timestamp?: string;
}) => {
  const { theme } = useTheme();
  const pathName = usePathname();
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const [isEditing, setIsEditing] = useState(false);
  const [newTitle, setNewTitle] = useState(name);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format the timestamp for display
  const formattedTime = timestamp 
    ? formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    : '';

  useEffect(() => {
    if (!pathName) return;
    setActive(pathName.includes(id));
  }, [pathName, id]);

  useEffect(() => {
    if (openDropdown === id && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const dropdownWidth = 160; // Width of the dropdown menu

      // Calculate position
      let left = rect.left + rect.width + 8;

      // Check if dropdown would go off screen
      if (left + dropdownWidth > windowWidth) {
        // Position dropdown to the left of the button if it would go off screen
        left = rect.left - dropdownWidth - 8;
      }

      setDropdownPosition({
        top: rect.top + window.scrollY,
        left: Math.max(8, left), // Ensure minimum left position of 8px
      });
    }
  }, [openDropdown, id]);

  useEffect(() => {
    setNewTitle(name); // Update new title when name changes
  }, [name]);

  // Add useEffect for handling outside clicks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openDropdown === id &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest(".dropdown-menu")
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown, id, setOpenDropdown]);

  // Add useEffect for handling outside clicks on the input
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isEditing &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        updateTitle();
      }
    };

    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditing]);

  const handleDropdownToggle = () => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  // Handle Title Update
  const updateTitle = async () => {
    if (!newTitle.trim() || loading) return;
    setLoading(true);

    try {
      // In a real implementation, you would call your API to update the title
      // For now, we'll just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success("Chat title updated!", getToastStyle(theme));
      setIsEditing(false);
      onSelect?.(id);
    } catch (error) {
      toast.error("Failed to update title", getToastStyle(theme));
      console.error("Error updating title:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle Chat Deletion
  const deleteChat = async () => {
    setDeleting(true);
    try {
      if (onDelete) {
        onDelete();
      } else {
        // Fallback to simulated deletion if onDelete is not provided
        await new Promise(resolve => setTimeout(resolve, 500));
        toast.success("Chat deleted!", getToastStyle(theme));
        refreshChats();
        router.push("/chat");
      }
    } catch (error) {
      toast.error("Failed to delete chat", getToastStyle(theme));
      console.error("Error deleting chat:", error);
    } finally {
      setDeleting(false);
      setOpenDropdown(null);
    }
  };

  return (
    <div className="relative w-full mb-2">
      <Link
        href={`/chat/${id}`}
        onClick={() => {
          if (onSelect) {
            onSelect(id);
          }
        }}
        className={`flex flex-col w-full px-3 py-2 rounded-lg transition-all duration-200 mb-1 ${
          active
            ? theme === "dark"
              ? "bg-gray-700/80 text-white"
              : "bg-gray-200 text-black"
            : theme === "dark"
            ? "hover:bg-gray-700/50 text-gray-300"
            : "hover:bg-gray-100 text-gray-700"
        }`}
      >
        {/* Chat Header with Title and Menu */}
        <div className="flex items-center justify-between w-full">
          {/* Editable Title with Loading Indicator */}
          <div className="flex items-center flex-1 whitespace-nowrap overflow-hidden">
            {isEditing ? (
              <div className="flex items-center w-full">
                <input
                  ref={inputRef}
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && updateTitle()}
                  className="bg-transparent text-lg font-medium outline-none w-full border-b border-gray-400"
                  autoFocus
                />
                {loading ? (
                  <div className="ml-2 animate-spin border-t-2 border-blue-500 border-solid rounded-full h-5 w-5" />
                ) : (
                  <FaCheck
                    onClick={updateTitle}
                    className="text-green-500 ml-2 cursor-pointer"
                  />
                )}
              </div>
            ) : (
              <Link
                href={`/chat/${id}`}
                className="flex-1 truncate text-lg font-medium tracking-wide"
                onClick={() => {
                  if (onSelect) {
                    onSelect(id);
                  }
                }}
              >
                {newTitle.length > 20 ? newTitle.slice(0, 20) + "..." : newTitle}
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
        
        {/* Last Message Preview and Timestamp */}
        {lastMessage && (
          <div className="mt-1 flex flex-col">
            <p className={`text-xs truncate ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
              {lastMessage.length > 60 ? lastMessage.slice(0, 60) + "..." : lastMessage}
            </p>
            {timestamp && (
              <p className={`text-xs mt-1 ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}>
                {formattedTime}
              </p>
            )}
          </div>
        )}
      </Link>

      {/* Dropdown Menu */}
      {openDropdown === id &&
        createPortal(
          <div
            className={`fixed shadow-lg rounded-md w-40 z-50 dropdown-menu ${
              theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-black"
            }`}
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              maxWidth: "calc(100vw - 16px)", // Ensure dropdown doesn't exceed screen width
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Edit Option */}
            <div
              className={`flex items-center px-4 py-2 cursor-pointer ${
                theme === "dark"
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => {
                setIsEditing(true);
                setOpenDropdown(null);
              }}
            >
              <FaEdit className="mr-2 text-blue-500" />
              <span>Edit Title</span>
            </div>

            {/* Delete Option */}
            <div
              className={`flex items-center px-4 py-2 cursor-pointer ${
                theme === "dark"
                  ? "hover:bg-gray-700 text-red-400"
                  : "hover:bg-gray-100 text-red-500"
              }`}
              onClick={deleteChat}
            >
              {deleting ? (
                <div className="mr-2 animate-spin border-t-2 border-red-500 border-solid rounded-full h-4 w-4" />
              ) : (
                <BiSolidTrashAlt className="mr-2" />
              )}
              <span>{deleting ? "Deleting..." : "Delete"}</span>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ChatRow;