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
// import { useRouter } from "next/router";

const ChatRow = ({
  id,
  name,
  openDropdown,
  setOpenDropdown,
  refreshChats, // ✅ Function to refresh chat list after delete
  onSelect, // Add this prop
}: {
  id: string;
  name: string;
  openDropdown: string | null;
  setOpenDropdown: (id: string | null) => void;
  refreshChats: () => void; // ✅ Refresh chat list after deletion
  onSelect?: () => void; // Add this type
}) => {
  const { theme } = useTheme();
  const pathName = usePathname();
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const [isEditing, setIsEditing] = useState(false); // ✅ Track editing state
  const [newTitle, setNewTitle] = useState(name); // ✅ Track new title
  const [loading, setLoading] = useState(false); // ✅ Loading state for title update
  const [deleting, setDeleting] = useState(false); // ✅ Loading state for delete action
  const inputRef = useRef<HTMLInputElement>(null); // Add this line

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
    setNewTitle(name); // ✅ Update new title when name changes
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

  // ✅ Handle Title Update API Call
  const updateTitle = async () => {
    if (!newTitle.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/edit-title/`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            "group-id": id,
            title: newTitle,
          }),
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to update title");

      toast.success("Chat title updated!"); // ✅ Show success toast
      setIsEditing(false); // ✅ Exit editing mode
      onSelect?.(); // Close sidebar after successful title update
    } catch (error) {
      toast.error("Failed to update title");
      console.error("Error updating title:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Chat Deletion API Call
  const deleteChat = async () => {
    setDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_CHAT_API_URL}/delete-group/`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ "group-id": id }),
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to delete chat");

      toast.success("Chat deleted!"); // ✅ Show success toast
      refreshChats(); // ✅ Refresh chat list after delete
      router.push("/chat");
    } catch (error) {
      toast.error("Failed to delete chat");
      console.error("Error deleting chat:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="relative w-full">
      <div
        className={`relative flex items-center justify-between w-full p-2.5 rounded-md ${
          active ? (theme === "dark" ? "bg-gray-600" : "bg-gray-300") : ""
        }`}
      >
        {/* ✅ Editable Title with Loading Indicator */}
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
                onSelect?.(); // Call onSelect when chat is clicked
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
            {/* ✅ Edit Title Button */}
            <button
              onClick={() => {
                setIsEditing(true);
                setOpenDropdown(null);
              }}
              className={`flex items-center gap-2 w-full px-4 py-2 text-sm ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-300"
              }`}
            >
              <FaEdit /> Edit Title
            </button>

            {/* ✅ Delete Chat Button with Confirmation */}
            <button
              onClick={() => {
                toast(
                  (t) => (
                    <div className="flex flex-col items-center space-y-3 p-4 bg-gray-800 text-white rounded-lg shadow-lg w-80">
                      <p className="text-sm font-medium">
                        Are you sure you want to delete this chat?
                      </p>
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => toast.dismiss(t.id)}
                          className="px-5 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            toast.dismiss(t.id);
                            deleteChat();
                          }}
                          className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ),
                  {
                    duration: Infinity, // ✅ Stays until dismissed
                    position: "top-center", // ✅ Appears in the center
                  }
                );
              }}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-gray-700"
            >
              <BiSolidTrashAlt /> Delete
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ChatRow;
