"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeProvider";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, Menu, X, User, ChevronDown, Sparkles } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useAuthContext } from "@/context/AuthProvider";
import SettingsDialog from "@/myUi/SettingsDialog";
import MySettings from "@/myUi/MySettings";

interface HeaderProps {
  excludedPaths?: string[];
}

const Header: React.FC<HeaderProps> = ({
  excludedPaths = [
    "/signin",
    "/login",
    "/signup",
    "/register",
    "/reset-password",
    "/forgot-password",
  ],
}) => {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthContext();
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Animation values for hover effects
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-10, 10], [2, -2]);
  const rotateY = useTransform(x, [-10, 10], [-2, 2]);

  // Handle scroll effect and progress
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Calculate scroll progress
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const progress = Math.min(offset / height, 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobileMenuOpen || isUserMenuOpen) {
        // Check if click is outside the menu
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen, isUserMenuOpen]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleMobileMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Check if a nav link is active
  const isActiveLink = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / 5);
    y.set((e.clientY - centerY) / 5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Helper function to get display name from user object
  const getDisplayName = () => {
    if (!user) return "";
    return (
      user.username ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.email.split("@")[0] ||
      ""
    );
  };

  // Handle sign out
  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    try {
      await logout();
      // The router navigation will be handled by the logout function
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback navigation if needed
      router.push("/signin");
    }
  };

  // Check if current path should hide header
  if (excludedPaths.some((path) => pathname?.startsWith(path))) {
    return null;
  }

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg"
          : "bg-white dark:bg-gray-900"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <motion.div
              style={{ rotateX, rotateY, transformPerspective: "500px" }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="flex-shrink-0"
            >
              <Link href="/" className="flex items-center relative group">
                {/* Enhanced Logo with animated gradient and effects */}
                <div className="relative flex items-center py-2.5 px-3">
                  {/* Background glow effect */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-fuchsia-500/20 to-blue-500/20 rounded-xl blur-xl group-hover:blur-2xl opacity-70 group-hover:opacity-100 transition-all duration-700"
                    style={{
                      transform: "translateZ(0)",
                      backfaceVisibility: "hidden",
                    }}
                  ></div>

                  {/* Animated background shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-600/40 via-fuchsia-500/40 to-blue-600/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      repeatType: "reverse",
                      ease: "linear",
                    }}
                    style={{
                      backgroundSize: "200% 200%",
                      transform: "translateZ(0)",
                    }}
                  ></motion.div>

                  {/* Floating particles effect */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg opacity-70">
                    <div className="absolute top-1 right-6 w-0.5 h-0.5 bg-cyan-400 rounded-full animate-pulse"></div>
                    <div
                      className="absolute top-3 left-1 w-0.5 h-0.5 bg-fuchsia-400 rounded-full animate-ping"
                      style={{
                        animationDuration: "3s",
                        animationDelay: "0.2s",
                      }}
                    ></div>
                    <div
                      className="absolute bottom-2 right-2 w-1 h-1 bg-blue-400 rounded-full animate-ping"
                      style={{
                        animationDuration: "2.5s",
                        animationDelay: "0.5s",
                      }}
                    ></div>
                  </div>

                  {/* Main text with enhanced gradient */}
                  <div className="relative z-10 flex items-center px-1">
                    <motion.span
                      className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-blue-500 leading-none"
                      animate={{
                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "linear",
                      }}
                      style={{
                        backgroundSize: "200% 200%",
                        transform: "translateZ(0)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      WP
                      <span className="relative">
                        {/* Small dot accent */}
                        <span className="absolute -top-0.5 right-0 w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></span>
                        .
                      </span>
                      AI
                    </motion.span>

                    {/* Tech decoration for AI emphasis */}
                    <motion.div
                      className="ml-1.5 w-1.5 h-6 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-sm"
                      initial={{ height: "0%" }}
                      animate={{ height: ["0%", "100%", "0%"] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 6,
                        ease: "easeInOut",
                      }}
                    ></motion.div>

                    {/* Sparkle icon */}
                    <motion.div
                      className="ml-2 text-yellow-300 dark:text-yellow-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ rotate: 0 }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Sparkles size={16} />
                    </motion.div>
                  </div>

                  {/* Circuit-like decoration in background */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 opacity-30 group-hover:opacity-70 transition-opacity">
                    <div className="absolute top-2 right-2 w-3 h-[1px] bg-cyan-400"></div>
                    <div className="absolute top-2 right-2 w-[1px] h-3 bg-cyan-400"></div>
                    <div className="absolute top-4 right-0 w-1 h-1 rounded-full bg-blue-400"></div>
                    <div className="absolute top-0 right-4 w-1 h-1 rounded-full bg-fuchsia-400"></div>
                  </div>
                </div>
              </Link>
            </motion.div>

            <nav className="hidden md:ml-10 md:flex md:space-x-2">
              {[
                { name: "Chat", href: "/chat" },
                { name: "Agent", href: "/agent" },
                { name: "Docs", href: "/docs" },
              ].map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={item.href}
                    className={`px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActiveLink(item.href)
                        ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 font-semibold"
                        : "text-gray-700 dark:text-gray-200 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </div>

          {/* User and theme controls */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle button with animation */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun size={20} className="text-yellow-300" />
              ) : (
                <Moon size={20} className="text-cyan-600" />
              )}
            </motion.button>

            {/* User profile or sign in button */}
            {user && isAuthenticated ? (
              <div className="relative">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 px-3.5 py-2 rounded-full">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white overflow-hidden shadow-sm">
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          className="w-8 h-8 rounded-full object-cover"
                          alt={getDisplayName()}
                        />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <span className="hidden md:inline-block text-sm font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {getDisplayName().split(" ")[0]}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-500 transition-transform duration-200 ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </motion.div>

                {/* Animated dropdown menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2.5 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100/50 dark:border-gray-700/50">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                          {getDisplayName()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {user.email}
                        </p>
                      </div>
                      <div className="py-1.5">
                        <Link
                          href="/profile"
                          className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Profile
                        </Link>
                        {/* <Link 
                          href="/settings" 
                          className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Settings
                        </Link> */}
                        <button
                          onClick={() => {
                            setIsSettingsOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/70 group"
                        >
                          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200">
                            {/* <FaCogs className="w-4 h-4" /> */}
                          </div>
                          <span className="font-medium">Settings</span>
                        </button>
                        <button
                          className="block w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-gray-100/50 dark:border-gray-700/50 transition-colors duration-150"
                          onClick={handleSignOut}
                        >
                          Sign out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/signin">
                <motion.button
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-sm hover:shadow transition-all"
                >
                  Sign In
                </motion.button>
              </Link>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleMobileMenu}
                className="p-2.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Progress Bar - Maintained and enhanced */}
      <div
        className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-100 dark:bg-gray-800"
        ref={progressBarRef}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-blue-500"
          style={{
            width: `${scrollProgress * 100}%`,
            backgroundSize: "200% 200%",
            backgroundPosition: "0% 50%",
          }}
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
        />
      </div>

      {/* Mobile menu with animation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden"
          >
            <div className="px-3 pt-3 pb-4 space-y-2">
              {[
                { name: "Chat", href: "/chat" },
                { name: "Agent", href: "/agent" },
                { name: "Docs", href: "/docs" },
              ].map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Link
                    href={item.href}
                    className={`block px-4 py-3 rounded-md text-base font-medium ${
                      isActiveLink(item.href)
                        ? "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Settings Dialog */}
      {isSettingsOpen && user && (
        <SettingsDialog
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          content={
            <MySettings
              user={{
                email: user?.email || "",
                image: user?.profile_picture || "",
                profile_picture: user?.profile_picture,
                username: user?.username,
                accountType: "none",
                joinDate: user?.date_joined || "",
                subscriptionPlan: "none",
                subscriptionEndDate: "",
              }}
              onClose={() => setIsSettingsOpen(false)}
            />
          }
        />
      )}
    </header>
  );
};

export default Header;
