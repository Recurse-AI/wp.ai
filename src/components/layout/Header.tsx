"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeProvider";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, Menu, X, User, ChevronDown, Sparkles, Code, MessageCircle } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useAuthContext } from "@/context/AuthProvider";
import SettingsDialog from "@/myUi/SettingsDialog";
import MySettings from "@/myUi/MySettings";
import ChangePasswordModal from "../profile-comp/change-password-modal";

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
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Animation values for hover effects
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-10, 10], [2, -2]);
  const rotateY = useTransform(x, [-10, 10], [-2, 2]);

  // Create a ref for the dropdown menu
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // Modify the click outside handler
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

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
                <div className="relative flex items-center py-3 px-3.5">
                  {/* Background glow effect */}
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-teal-600/20 via-emerald-500/20 to-cyan-500/20 rounded-xl blur-xl group-hover:blur-2xl opacity-70 group-hover:opacity-100 transition-all duration-700"
                    style={{
                      transform: "translateZ(0)",
                      backfaceVisibility: "hidden",
                    }}
                  ></div>

                  {/* Animated background shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-teal-600/40 via-emerald-500/40 to-cyan-600/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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

                  {/* Main text with enhanced gradient */}
                  <div className="relative z-10 flex items-center px-1">
                    <motion.span
                      className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 leading-none"
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
                      <span className="relative inline-block mx-0.5">
                        {/* Enhanced caret symbol with animation */}
                        <motion.span 
                          className="absolute -top-2 right-0 text-teal-400 font-bold text-lg"
                          animate={{ 
                            y: [0, -2, 0],
                            opacity: [0.7, 1, 0.7]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >^</motion.span>
                      </span>
                      AI
                    </motion.span>

                    {/* Tech decoration for AI emphasis */}
                    <motion.div
                      className="ml-1.5 w-1.5 h-6 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-sm"
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
                </div>
              </Link>
            </motion.div>

            <nav className="hidden md:ml-10 md:flex md:space-x-2">
              {[
                { name: "Chat", href: "/chat" },
                { name: "Agent", href: "/agent-workspace" },
              ].map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative"
                >
                  <Link
                    href={item.href}
                    className={`px-5 py-3.5 text-sm font-medium rounded-md transition-colors duration-200 flex items-center gap-2 ${
                      isActiveLink(item.href)
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-semibold"
                        : "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    {item.name}
                    <ChevronDown
                      size={16}
                      className={`text-emerald-500 dark:text-emerald-400 transition-transform duration-200 ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                    {isActiveLink(item.href) && (
                      <span className="text-xs text-teal-500 font-bold">^</span>
                    )}
                  </Link>
                  {/* Add floating caret for active link */}
                  {isActiveLink(item.href) && (
                    <span className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 text-teal-500 text-lg">^</span>
                  )}
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
              className="p-3 rounded-full text-gray-500 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun size={20} className="text-yellow-300" />
              ) : (
                <Moon size={20} className="text-emerald-600" />
              )}
            </motion.button>

            {/* User profile or sign in button */}
            {user && isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 cursor-pointer user-menu-button"
                >
                  <div className="flex items-center space-x-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 px-4 py-3 rounded-full border border-emerald-200 dark:border-gray-700 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white overflow-hidden shadow-sm">
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
                      className={`text-emerald-500 dark:text-emerald-400 transition-transform duration-200 ${
                        isUserMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </motion.div>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2.5 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-emerald-100 dark:border-gray-700"
                    >
                      <div className="p-4 border-b border-emerald-100/50 dark:border-gray-700/50">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                          {getDisplayName()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                          {user.email}
                        </p>
                      </div>
                      <div className="py-1.5">
                        {/* Change Password Button */}
                        <button
                          onClick={() => setIsChangePasswordModalOpen(true)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                              <User size={14} />
                            </div>
                            <span>Change Password</span>
                          </div>
                        </button>

                        {/* Sign Out Button */}
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-gray-100/50 dark:border-gray-700/50 transition-colors duration-150"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                            </div>
                            <span>Sign out</span>
                          </div>
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
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white px-6 py-3.5 rounded-full text-sm font-medium shadow-sm hover:shadow transition-all"
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
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500"
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
            <div className="px-3 pt-3 pb-4 space-y-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
              {[
                { name: "Chat", href: "/chat" },
                { name: "Agent", href: "/agent-workspace" },
              ].map((item) => (
                <motion.div
                  key={item.name}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                >
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-4 rounded-md text-base font-medium ${
                      isActiveLink(item.href)
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name === "Chat" ? (
                      <MessageCircle size={20} className="text-blue-500 dark:text-blue-400" />
                    ) : (
                      <Code size={20} className="text-purple-500 dark:text-purple-400" />
                    )}
                    {item.name}
                    {isActiveLink(item.href) && (
                      <span className="ml-auto text-teal-500 font-bold">^</span>
                    )}
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
      <ChangePasswordModal 
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </header>
  );
};

export default Header;
