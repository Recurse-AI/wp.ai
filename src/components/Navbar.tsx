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

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);

  // Get authentication state from AuthContext
  const {
    user,
    isAuthenticated,
    logout,
    loading
  } = useAuthContext();

  const defaultAvatar = "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=";
  const userAvatar = user?.profile_picture || defaultAvatar;
  const userName = user?.username || 
                  `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 
                  (user?.email ? user.email.split('@')[0] : '');

  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle clicking outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDropdown && !target.closest('#user-dropdown-button') && !target.closest('#user-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  if (
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/chat" ||
    pathname.startsWith("/verify-email")
  )
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
            ? "bg-white/80 dark:bg-gray-900/90 backdrop-blur-xl shadow-lg border-b border-gray-200 dark:border-gray-800"
            : "bg-white/40 dark:bg-gray-900/40 backdrop-blur-md"
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
        <div className="flex gap-3 md:gap-5 items-center relative">
          {/* Authentication */}
          {!isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* Theme Button */}
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
                  className="p-2.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-full hover:shadow-md transition-all duration-300 relative group backdrop-blur-sm"
                  aria-label="Theme settings"
                  ref={themeButtonRef}
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
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-800/80"
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
              
              <Link href="/signin">
                <motion.button
                  className="relative px-4 md:px-5 py-2 text-sm md:text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition overflow-hidden shadow-md hover:shadow-lg"
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
            <div className="flex items-center gap-3">
              {/* Theme Button */}
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
                  className="p-2.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-full hover:shadow-md transition-all duration-300 relative group backdrop-blur-sm"
                  aria-label="Theme settings"
                  ref={themeButtonRef}
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
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-800/80"
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
              
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <Image
                    src={userAvatar}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="hidden md:inline">{userName}</span>
                </button>

                {showDropdown && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
                  >
                    {/* User Info Section */}
                    <div className="p-4 bg-gray-50/80 dark:bg-gray-700/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden shadow-inner">
                          <Image
                            src={userAvatar || "/placeholder.svg"}
                            alt={userName || "User"}
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                        </div>
                        <div>
                          <div className="font-semibold">{userName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            WordPress Developer
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-1">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 group"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                          <FaUser className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Profile</span>
                      </Link>

                      {/* About and Pricing section */}
                      <Link
                        href="/about"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 group"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200">
                          <FaInfoCircle className="w-4 h-4" />
                        </div>
                        <span className="font-medium">About</span>
                      </Link>

                      <Link
                        href="/pricing"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 group"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white transition-all duration-200">
                          <FaCrown className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Pricing</span>
                      </Link>

                      <button
                        onClick={() => {
                          setIsSettingsOpen(true);
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 group"
                      >
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200">
                          <FaCogs className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Settings</span>
                      </button>

                      <div className="h-px bg-gray-200 dark:bg-gray-700/70 my-1 mx-3"></div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 group"
                      >
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 group-hover:bg-red-600 group-hover:text-white transition-all duration-200">
                          <FaSignOutAlt className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300">Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.nav>

      {/* Spacer */}
      <div className="h-16 md:h-20"></div>

      {/* Settings Dialog */}
      {isSettingsOpen && (
        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          content={<MySettings />}
        />
      )}
    </>
  );
}
