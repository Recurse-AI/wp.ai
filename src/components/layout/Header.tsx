"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeProvider";
import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    "/chat",
    "/chat/*",
  ],
}) => {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthContext();
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Handle scroll effect with enhanced animations
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      // More gradual transition for scrolled state
      setScrolled(offset > 20);
      
      // Calculate scroll progress for progress indicator
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = Math.min(offset / height, 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const toggleMobileMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Check if a nav link is active
  const isActiveLink = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname?.startsWith(path)) return true;
    return false;
  };

  // Show login button if not authenticated
  const renderAuthButton = () => {
    if (isAuthenticated && user) {
      return (
        <motion.div 
          className="flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
          >
            {user.profile_picture ? (
              <div className="relative">
                <img
                  src={user.profile_picture}
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-md"
                />
              </div>
            ) : (
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                  <User size={16} />
                </div>
              </div>
            )}
          </button>
        </motion.div>
      );
    }

    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link
          href="/signin"
          className="px-5 py-2.5 rounded-md bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
        >
          Sign In
        </Link>
      </motion.div>
    );
  };


  if (excludedPaths.includes(pathname || "") || pathname?.startsWith('/chat/')) {
    return null;
  }

  return (
    <>
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? "py-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-lg" 
            : "py-5 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Link href="/" className="flex items-center">
                <span className="text-xl font-serif font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  WordPress Agent
                </span>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-10">
              {[
                { name: "Home", href: "/" },
                { name: "Services", href: "/services" },
                { name: "About", href: "/about" }
              ].map((item) => (
                <motion.div 
                  key={item.name}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                >
                  <Link
                    href={item.href}
                    className={`text-sm font-medium transition-colors relative ${
                      isActiveLink(item.href)
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400"
                    }`}
                  >
                    {item.name}
                    {isActiveLink(item.href) && (
                      <motion.span
                        layoutId="activeIndicator"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Right Section: Auth & Theme Toggle */}
            <div className="flex items-center space-x-5">
              {/* Theme Toggle - Removed highlighting */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <Sun size={18} className="text-gray-500 dark:text-gray-400" />
                ) : (
                  <Moon size={18} className="text-gray-500 dark:text-gray-400" />
                )}
              </motion.button>

              {/* Auth Button */}
              {renderAuthButton()}

              {/* Mobile Menu Button - Removed highlighting */}
              <div className="md:hidden">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMobileMenu}
                  className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Toggle mobile menu"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Scrollbar that appears on scroll */}
        <div 
          className="absolute bottom-0 left-0 right-0 overflow-hidden"
          style={{ opacity: scrollProgress > 0 ? 1 : 0 }}
        >
          <div 
            className="h-0.5 bg-blue-500/30 dark:bg-blue-400/30"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>

        {/* Mobile menu with animation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden"
            >
              <div className="px-4 py-3 space-y-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t dark:border-gray-800">
                {[
                  { name: "Home", href: "/" },
                  { name: "Services", href: "/services" },
                  { name: "About", href: "/about" }
                ].map((item) => (
                  <motion.div
                    key={item.name}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ x: 4 }}
                  >
                    <Link
                      href={item.href}
                      className={`block py-2.5 px-3 rounded-md text-sm font-medium ${
                        isActiveLink(item.href)
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
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
        
        <ChangePasswordModal 
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
        />
      </motion.header>
    </>
  );
};

export default Header;