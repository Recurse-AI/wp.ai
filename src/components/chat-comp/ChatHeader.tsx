"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { Edit2, Check, X, LayoutGrid, MessageSquare, Settings, LogOut } from 'lucide-react';
import useAuth from "@/lib/useAuth";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaSun, FaMoon, FaDesktop } from "react-icons/fa";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface ChatHeaderProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  onToggleAgentMode: () => void;
  agentMode: boolean;
  chatId?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  title, 
  onTitleChange, 
  onToggleAgentMode,
  agentMode,
}) => {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLDivElement>(null);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedTitle(title);
  };

  const handleSaveClick = () => {
    onTitleChange(editedTitle);
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  // Handle click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current && 
        !userDropdownRef.current.contains(event.target as Node) &&
        userButtonRef.current &&
        !userButtonRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    // Redirect to home page
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  // Open settings modal
  const openSettings = () => {
    router.push("/settings");
  };

 

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-transparent">
      <div className="flex items-center pl-8 justify-start bg-transparent">
        {isEditing ? (
          <div className="flex items-center">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className={`border rounded px-2 py-1 mr-2 focus:outline-none ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
              autoFocus
            />
            <button 
              onClick={handleSaveClick}
              className="text-green-500 hover:text-green-600 mr-1"
            >
              <Check size={18} />
            </button>
            <button 
              onClick={handleCancelClick}
              className="text-red-500 hover:text-red-600"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <h2 className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {title || 'New Chat'}
            </h2>
            <button 
              onClick={handleEditClick}
              className={`ml-2 p-1 rounded-full hover:bg-opacity-10 ${
                theme === 'dark' ? 'hover:bg-gray-300' : 'hover:bg-gray-700'
              }`}
            >
              <Edit2 size={14} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
            </button>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-3 justify-end bg-transparent"> 
        {/* Agent Mode Toggle Button */}
        <button
          onClick={onToggleAgentMode}
          className={`flex items-center px-3 py-1 rounded-md transition-colors ${
            agentMode 
              ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-600') 
              : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')
          }`}
        >
          {agentMode ? (
            <>
              <LayoutGrid size={16} className="mr-1" />
              <span className="text-sm">Agent Mode</span>
            </>
          ) : (
            <>
              <MessageSquare size={16} className="mr-1" />
              <span className="text-sm">Chat Mode</span>
            </>
          )}
        </button>
        
        {/* User Profile Button */}
        {!isAuthenticated ? (
          <Link href="/signin">
            <motion.button
              className="px-4 py-2 text-blue-600 hover:text-blue-700 rounded-lg transition overflow-hidden text-sm font-medium"
              whileHover={{ scale: 1.03 }}
              onClick={() => localStorage.setItem("isChat", "true")}
            >
              Sign In
            </motion.button>
          </Link>
        ) : (
          <div className="relative" ref={userButtonRef}>
            <div 
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <Image
                src={user?.profile_picture || "/placeholder.svg"}
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full border-2 border-gray-200 dark:border-gray-700"
              />
            </div>
            
            {/* User Profile Dropdown */}
            {showUserDropdown && (
              <motion.div
                ref={userDropdownRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 z-50"
              >
                {/* User Info */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Image
                      src={user?.profile_picture || "/placeholder.svg"}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <p className="font-medium">{user?.username || 'User'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || ''}</p>
                    </div>
                  </div>
                </div>
                
                {/* Menu Items */}
                <div className="py-1">
                  {/* Settings Option */}
                  <button
                    onClick={openSettings}
                    className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Settings className="text-gray-500" size={16} />
                    <span>Settings</span>
                  </button>
                  
                  {/* Theme Options */}
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Theme</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTheme("light")}
                        className={`p-2 rounded-full ${theme === "light" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-700"}`}
                      >
                        <FaSun className="text-yellow-500 text-sm" />
                      </button>
                      <button
                        onClick={() => setTheme("dark")}
                        className={`p-2 rounded-full ${theme === "dark" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-700"}`}
                      >
                        <FaMoon className="text-blue-500 text-sm" />
                      </button>
                      <button
                        onClick={() => setTheme("system")}
                        className={`p-2 rounded-full ${theme === "system" ? "bg-blue-100 dark:bg-blue-900/30" : "bg-gray-100 dark:bg-gray-700"}`}
                      >
                        <FaDesktop className="text-purple-500 text-sm" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Logout Option */}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-200 dark:border-gray-700"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader; 