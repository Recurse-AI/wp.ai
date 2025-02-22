import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { FiChevronDown } from "react-icons/fi";
import { useRouter, usePathname } from "next/navigation";
import { getUser } from "@/utils/getUser";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FaUser,
  FaSignOutAlt,
  FaHome,
  FaRocket,
  FaInfoCircle,
  FaCrown,
  FaSun,
  FaMoon,
  FaDesktop,
} from "react-icons/fa";
import { useTheme } from "@/context/ThemeProvider";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", image: "" });

  const router = useRouter();
  const pathname = usePathname();

  const { theme, setTheme } = useTheme();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      setShowDropdown(false);
      localStorage.removeItem("authToken");
      await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/logout/`, {
        method: "GET",
        credentials: "include",
      });
      await signOut({ redirect: false });
      setIsLoggedIn(false);
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }

      if (
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowThemeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    getUser(setIsLoggedIn, setUser, router, pathname);
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-gray-900 w-full border-b border-gray-700">
      {/* Left: WP.AI Dropdown Button */}
      <button className="flex items-center gap-1 bg-[#212121] hover:bg-black font-semibold tracking-wide px-3 py-2 rounded-lg duration-300">
        <div className="flex gap-1">
          WP.AI <FiChevronDown />
        </div>
      </button>

      {/* Right: Theme & Authentication */}
      <div className="flex gap-4 items-center relative">
        {/* 🔹 Theme Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowThemeDropdown(!showThemeDropdown);
              setShowDropdown(false);
            }}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:scale-105 transition-all"
            ref={buttonRef}
          >
            {theme === "light" && <FaSun className="text-yellow-400" />}
            {theme === "dark" && <FaMoon className="text-gray-900" />}
            {theme === "system" && <FaDesktop className="text-gray-500" />}
          </button>

          {/* 🔹 Theme Selection Dropdown */}
          {showThemeDropdown && (
            <div
              ref={themeDropdownRef}
              className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50"
            >
              <button
                className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 w-full"
                onClick={() => {
                  setTheme("light");
                  setShowThemeDropdown(false);
                }}
              >
                <FaSun className="text-yellow-400" /> Light Mode
              </button>
              <button
                className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 w-full"
                onClick={() => {
                  setTheme("dark");
                  setShowThemeDropdown(false);
                }}
              >
                <FaMoon className="text-gray-900" /> Dark Mode
              </button>
              <button
                className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 w-full"
                onClick={() => {
                  setTheme("system");
                  setShowThemeDropdown(false);
                }}
              >
                <FaDesktop className="text-gray-500" /> System Default
              </button>
            </div>
          )}
        </div>

        {/* 🔹 Authentication */}
        {!isLoggedIn ? (
          <>
            <Link href="/signin">
              <motion.button
                className="relative px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition overflow-hidden text-sm md:text-base"
                whileHover={{ scale: 1.05 }}
              >
                Sign In
              </motion.button>
            </Link>

            <Link href="/signup">
              <motion.button
                className="relative px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition overflow-hidden text-sm md:text-base"
                whileHover={{ scale: 1.05 }}
              >
                Sign Up
              </motion.button>
            </Link>
          </>
        ) : (
          <div className="relative">
            <button
              onClick={() => {
                setShowDropdown(!showDropdown);
                setShowThemeDropdown(false);
              }}
              className="flex items-center gap-2"
            >
              <Image
                src={user.image}
                alt="Profile"
                width={40}
                height={40}
                className="rounded-full border-2 border-gray-600"
              />
              {/* 🔹 Responsive Username */}
              <div className="font-semibold hidden md:block truncate max-w-[120px]">
                {user.name}
              </div>
            </button>

            {/* 🔹 Profile Dropdown */}
            {showDropdown && (
              <motion.div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Link href="/" onClick={() => setShowDropdown(false)}>
                  <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                    <FaHome /> Home
                  </div>
                </Link>
                <Link href="/chat" onClick={() => setShowDropdown(false)}>
                  <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                    <FaRocket /> WP.ai
                  </div>
                </Link>
                <Link href="/profile" onClick={() => setShowDropdown(false)}>
                  <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                    <FaUser /> General
                  </div>
                </Link>
                <div
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-3 hover:bg-red-600 cursor-pointer text-red-400"
                >
                  <FaSignOutAlt /> Sign Out
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
