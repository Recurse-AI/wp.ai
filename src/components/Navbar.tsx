/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { getUser } from "@/utils/getUser";
import {
  FaUser,
  FaSignOutAlt,
  FaCogs,
  FaHome,
  FaRocket,
  FaInfoCircle,
  FaCrown,
  FaSun,
  FaMoon,
  FaDesktop,
} from "react-icons/fa";
import { useTheme } from "@/context/ThemeProvider";
import SettingsDialog from "@/myUi/SettingsDialog";
import MySettings from "@/myUi/MySettings";
import { Menu } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  /** ✅ Always Declare Hooks at the Top */
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({
    name: "",
    image:
      "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=",
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // ✅ Moved to top

  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // ✅ Detect if page is scrolled
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      setShowDropdown(false);

      // ✅ Remove JWT token from localStorage
      localStorage.removeItem("authToken");

      // ✅ Call backend logout endpoint to clear JWT from cookies
      await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/logout/`, {
        method: "GET",
        credentials: "include", // Ensures cookies are sent and cleared
      });

      // ✅ Sign out from NextAuth (removes session)
      await signOut({ redirect: false });

      setIsLoggedIn(false);

      // ✅ Redirect to login page
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
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
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    getUser(setIsLoggedIn, setUser, router, pathname); // ✅ Pass router and pathname
  }, []);

  // if (!isLoggedIn) {
  //   return <p>Loading...</p>; // ✅ Show a loader while checking authentication
  // }

  if (
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/chat" ||
    pathname.startsWith("/verify-email")
  )
    return null;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 py-4 px-6 flex justify-between items-center z-50 transition-all duration-300
        ${
          isScrolled
            ? "bg-gray-100/10 dark:bg-gray-900/80 backdrop-blur-md shadow-md"
            : "bg-gray-100 dark:bg-gray-900"
        }`}
      >
        {/* Left: Website Name */}
        <Link href="/" className="flex items-center gap-2">
          <motion.span
            className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"
            style={{
              backgroundSize: "200% 200%",
            }}
          >
            WP.ai
          </motion.span>
        </Link>

        {/* Right: Theme & Authentication */}
        <div className="flex gap-4 items-center">
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
      </nav>

      {/* Ensure space below navbar to avoid content overlapping */}
      <div className="h-16"></div>
    </>
  );
}
