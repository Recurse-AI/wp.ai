/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
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
import { useAuthContext } from "@/context/AuthProvider";
import SettingsDialog from "@/myUi/SettingsDialog";
import MySettings from "@/myUi/MySettings";
import useAuth from "@/lib/useAuth";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  // Get authentication state from useAuth hook
  const { isAuthenticated, user: authUser, logout } = useAuth();
  
  // Get authentication state from AuthContext
  const { isLoggedIn: contextIsLoggedIn, user: contextUser } = useAuthContext();

  // Determine user state combining both auth sources
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({
    name: "",
    image:
      "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=",
  });
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // Update local state from authUser when it changes
  useEffect(() => {
    if (authUser) {
      setIsLoggedIn(true);
      setUser({
        name: `${authUser.first_name} ${authUser.last_name}`.trim() || authUser.username,
        image: authUser.profile_picture || user.image,
      });
    }
  }, [authUser]);
  
  // Update local state from context when it changes
  useEffect(() => {
    if (contextIsLoggedIn && contextUser) {
      setIsLoggedIn(true);
      setUser({
        name: contextUser.name || user.name,
        image: contextUser.image || user.image,
      });
    }
  }, [contextIsLoggedIn, contextUser]);

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

  // ✅ Modified handleLogout to use useAuth's logout
  const handleLogout = async () => {
    try {
      setShowDropdown(false);
      await logout(); // Use the logout function from useAuth
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

  if (pathname === "/signin" || pathname === "/signup" || pathname === "/chat" || pathname.startsWith("/verify-email"))
    return null;

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
        className={`fixed top-0 left-0 w-full py-3 md:py-4 px-4 md:px-6 flex justify-between items-center z-50 transition-all duration-300
        ${
          isScrolled
            ? "bg-white/60 dark:bg-gray-900/60 backdrop-blur-md shadow-lg"
            : "bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm"
        }`}
      >
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg opacity-30 group-hover:opacity-100 blur transition-all duration-300" />
            <motion.span
              className="relative text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              WP.ai
            </motion.span>
          </motion.div>
        </Link>

        {/* Right: Theme & Authentication */}
        <div className="flex gap-2 md:gap-4 items-center relative">
          {/* Theme Dropdown */}
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={() => {
                setShowThemeDropdown(!showThemeDropdown);
                setShowDropdown(false);
              }}
              className="p-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-full hover:shadow-md transition-all duration-300 relative group backdrop-blur-sm"
              ref={buttonRef}
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-50 blur transition duration-300" />
              <div className="relative">
                {theme === "light" && <FaSun className="text-yellow-500 text-xl" />}
                {theme === "dark" && <FaMoon className="text-blue-500 text-xl" />}
                {theme === "system" && <FaDesktop className="text-purple-500 text-xl" />}
              </div>
            </button>

            {/* Theme Dropdown Menu */}
            {showThemeDropdown && (
              <motion.div
                ref={themeDropdownRef}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {[
                  { mode: "light", icon: FaSun, label: "Light Mode", color: "text-yellow-500" },
                  { mode: "dark", icon: FaMoon, label: "Dark Mode", color: "text-blue-500" },
                  { mode: "system", icon: FaDesktop, label: "System", color: "text-purple-500" }
                ].map((item) => (
                  <motion.button
                    key={item.mode}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      setTheme(item.mode);
                      setShowThemeDropdown(false);
                    }}
                  >
                    <item.icon className={`${item.color} text-lg`} />
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* Authentication */}
          {!isLoggedIn && !isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link href="/signin">
                <motion.button
                  className="relative px-3 md:px-4 py-2 text-sm md:text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                  <motion.div
                    className="absolute inset-0 bg-white opacity-20"
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
          ) : (
            <motion.div 
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <button
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  setShowThemeDropdown(false);
                }}
                className="flex items-center gap-2 group"
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-30 group-hover:opacity-100 blur transition-all duration-300" />
                  <Image
                    src={user.image}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="relative rounded-full border-2 border-transparent group-hover:border-white transition-all duration-300"
                  />
                </div>
                <span className="font-medium max-w-[80px] sm:max-w-[120px] truncate hidden sm:block">
                  {user.name}
                </span>
              </button>

              {/* Profile Dropdown */}
              {showDropdown && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                >
                  {[
                    { href: "/", icon: FaHome, label: "Home" },
                    { href: "/chat", icon: FaRocket, label: "WP.ai" },
                    { href: "/profile", icon: FaUser, label: "General" },
                    { href: "/about", icon: FaInfoCircle, label: "About" }
                  ].map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setShowDropdown(false)}>
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <item.icon className="text-lg text-gray-600 dark:text-gray-400" />
                        <span className="font-medium">{item.label}</span>
                      </motion.div>
                    </Link>
                  ))}
                  <motion.div
                    whileHover={{ x: 5 }}
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 cursor-pointer transition-colors"
                  >
                    <FaSignOutAlt className="text-lg" />
                    <span className="font-medium">Sign Out</span>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Spacer */}
      <div className="h-16 md:h-20"></div>
    </>
  );
}