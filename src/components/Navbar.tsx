/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FaUser,
  FaSignOutAlt,
  FaCogs,
  FaInfoCircle,
  FaCrown,
  FaSun,
  FaMoon,
  FaDesktop,
} from "react-icons/fa";
import { useTheme } from "@/context/ThemeProvider";
import SettingsDialog from "@/myUi/SettingsDialog";
import MySettings from "@/myUi/MySettings";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  /** ✅ Always Declare Hooks at the Top */
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({
    name: "Unayes Khan",
    image: "https://avatars.githubusercontent.com/u/106924262?v=4",
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // ✅ Moved to top

  /** ✅ useEffect should be called unconditionally */
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token && session) {
      setIsLoggedIn(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/get-user`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((data) => {
          setUser({ name: data.name, image: data.image });
        })
        .catch(() => console.error("Error fetching user data"));
    } else {
      setIsLoggedIn(false);
    }
  }, [pathname, session]);

  const handleLogout = async () => {
    setShowDropdown(false);
    localStorage.removeItem("authToken");
    await signOut({ redirect: false });
    setIsLoggedIn(false);
    router.push("/");
  };

  if (pathname === "/signin" || pathname === "/signup") return null;

  return (
    <>
      <nav className="fixed top-0 left-0 w-full bg-white dark:bg-gray-900 text-black dark:text-white py-4 px-6 flex justify-between items-center shadow-lg z-50">
        {/* Left: Website Name */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            WP.ai
          </span>
        </Link>

        {/* Right: Theme & Authentication */}
        <div className="flex gap-4 items-center relative">
          {/* 🔹 Theme Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:scale-105 transition-all"
            >
              {theme === "light" && <FaSun className="text-yellow-400" />}
              {theme === "dark" && <FaMoon className="text-gray-900" />}
              {theme === "system" && <FaDesktop className="text-gray-500" />}
            </button>

            {/* 🔹 Theme Selection Dropdown (Properly Positioned Below Button) */}
            {showThemeDropdown && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
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
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                  Sign In
                </button>
              </Link>
              <Link href="/signup">
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
                  Sign Up
                </button>
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2"
              >
                <Image
                  src={user.image}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-gray-600"
                />
                <span className="font-semibold">{user.name}</span>
              </button>

              {/* 🔹 Profile Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-50">
                  <Link href="/profile">
                    <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                      <FaUser /> General
                    </div>
                  </Link>
                  <Link href="/pricing">
                    <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                      <FaCrown /> Pricing
                    </div>
                  </Link>

                  <Link href="/about">
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
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
      <div className="pt-16"></div>
    </>
  );
}
