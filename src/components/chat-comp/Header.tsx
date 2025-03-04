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
  FaSun,
  FaMoon,
  FaDesktop,
  FaCrown,
  FaInfoCircle,
} from "react-icons/fa";
import { useTheme } from "@/context/ThemeProvider";
import { Menu } from "lucide-react";
import { Tooltip } from "react-tooltip";

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
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showWPAIDropdown, setShowWPAIDropdown] = useState(false);
  const wpAIButtonRef = useRef<HTMLButtonElement>(null);
  const wpAIDropdownRef = useRef<HTMLDivElement>(null);

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
      router.push("/chat");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleDefaultMode = () => {
    setShowWPAIDropdown(false);
    window.location.reload(); // This will refresh the current page
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close Profile Dropdown if clicked outside
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowDropdown(false), 100);
      }

      // Close Theme Dropdown if clicked outside
      if (
        themeDropdownRef.current &&
        !themeDropdownRef.current.contains(event.target as Node) &&
        themeButtonRef.current &&
        !themeButtonRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowThemeDropdown(false), 100);
      }

      // Close WP.AI Dropdown if clicked outside
      if (
        wpAIDropdownRef.current &&
        !wpAIDropdownRef.current.contains(event.target as Node) &&
        wpAIButtonRef.current &&
        !wpAIButtonRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowWPAIDropdown(false), 100);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    getUser(setIsLoggedIn, setUser, router, pathname);
  }, []);

  return (
    <div
      className={`flex flex-wrap items-center justify-between px-4 py-3 w-full
      ${theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"}
  `}
    >
      {/* Left: WP.AI Dropdown Button */}
      <div className="relative">
        <button
          ref={wpAIButtonRef}
          onClick={() => {
            setShowWPAIDropdown(!showWPAIDropdown);
            setShowDropdown(false);
            setShowThemeDropdown(false);
          }}
          className={`flex items-center gap-1 font-semibold tracking-wide px-3 py-2 rounded-lg duration-300
            ${
              theme === "dark"
                ? "bg-black border-gray-900 text-white hover:bg-black/30"
                : "bg-gray-300 border-gray-200 text-black"
            }`}
        >
          <div className="flex gap-1">
            WP.AI <FiChevronDown />
          </div>
        </button>

        {/* WP.AI Dropdown Menu */}
        {showWPAIDropdown && (
          <motion.div
            ref={wpAIDropdownRef}
            className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              onClick={handleDefaultMode}
              className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer"
            >
              <FaRocket /> Default Mode
            </div>
            <div
              data-tooltip-id="agent-mode-tooltip"
              data-tooltip-content="Coming Soon!"
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50"
            >
              <FaRocket /> Agent Mode
            </div>
            <Tooltip id="agent-mode-tooltip" place="right" />
          </motion.div>
        )}
      </div>

      {/* Right: Theme & Authentication */}
      <div className="flex gap-4 items-center relative">
        {/* 🔹 Theme Dropdown Button */}
        <div className="relative">
          <button
            ref={themeButtonRef} // ✅ Use a separate ref for theme button
            onClick={(e) => {
              e.stopPropagation(); // ✅ Prevents immediate closing
              setShowThemeDropdown((prev) => !prev);
              setShowDropdown(false);
            }}
            className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:scale-105 transition-all"
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
          <div className="relative">
            {/* Desktop View: Buttons */}
            <div className="hidden md:flex space-x-4">
              <Link href="/signin">
                <motion.button
                  className="relative px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition overflow-hidden text-sm md:text-base"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => localStorage.setItem("isChat", "true")}
                >
                  Sign In
                  {/* Flowing Light Effect */}
                  <motion.div
                    className="absolute inset-0 bg-white opacity-10"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "linear",
                    }}
                  />
                </motion.button>
              </Link>

              <Link href="/signup">
                <motion.button
                  className="relative px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition overflow-hidden text-sm md:text-base"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => localStorage.setItem("isChat", "true")}
                >
                  Sign Up
                  {/* Flowing Light Effect */}
                  <motion.div
                    className="absolute inset-0 bg-white opacity-10"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "linear",
                    }}
                  />
                </motion.button>
              </Link>
            </div>

            {/* Mobile View: Dropdown Menu */}
            <div className="md:hidden relative">
              <button
                className="p-2 bg-gray-700 text-white"
                onClick={() => setIsOpen(!isOpen)}
              >
                <Menu size={24} />
              </button>

              {isOpen && (
                <motion.div
                  className="fixed top-16 right-4 w-32 bg-white shadow-lg overflow-hidden z-50"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Link href="/signin">
                    <motion.button
                      className="relative px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white transition overflow-hidden text-sm md:text-base w-full text-left"
                      whileHover={{ scale: 1.05 }}
                      onClick={() => localStorage.setItem("isChat", "true")}
                    >
                      Sign In
                      {/* Flowing Light Effect */}
                      <motion.div
                        className="absolute inset-0 bg-white opacity-10"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          ease: "linear",
                        }}
                      />
                    </motion.button>
                  </Link>
                  <Link href="/signup">
                    <motion.button
                      className="relative px-4 py-2 bg-green-600 hover:bg-green-700 text-white transition overflow-hidden text-sm md:text-base w-full text-left"
                      whileHover={{ scale: 1.05 }}
                      onClick={() => localStorage.setItem("isChat", "true")}
                    >
                      Sign Up
                      {/* Flowing Light Effect */}
                      <motion.div
                        className="absolute inset-0 bg-white opacity-10"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                          ease: "linear",
                        }}
                      />
                    </motion.button>
                  </Link>
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            <button
              ref={buttonRef} // ✅ Separate ref for profile button
              onClick={(e) => {
                e.stopPropagation(); // ✅ Prevents immediate closing
                setShowDropdown((prev) => !prev);
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
                {/* <Link href="/pricing" onClick={() => setShowDropdown(false)}>
                    <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                      <FaCrown /> Pricing
                    </div>
                </Link> */}
                <Link href="/about" onClick={() => setShowDropdown(false)}>
                  <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                    <FaInfoCircle /> About
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
