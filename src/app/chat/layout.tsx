/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect, useRef } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Sidebar from "@/components/chat-comp/Sidebar";
import { FiSidebar, FiChevronDown } from "react-icons/fi";
import { useTheme } from "@/context/ThemeProvider";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import "@fontsource/inter";
import { useRouter } from "next/navigation";
import { 
  FaSun, 
  FaMoon, 
  FaDesktop, 
  FaUser,
  FaSignOutAlt,
  FaCog,
  FaWordpress
} from "react-icons/fa";
import { SiOpenai, SiClaude, SiGooglegemini } from "react-icons/si";
import useAuth from "@/lib/useAuth";

// AI Provider configuration
const AI_PROVIDERS = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    icon: SiOpenai,
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', wpOptimized: true },
      { id: 'gpt-4', name: 'GPT-4 Turbo', wpOptimized: true },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', wpOptimized: false }
    ]
  },
  { 
    id: 'claude', 
    name: 'Claude',
    icon: SiClaude,
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus', wpOptimized: true },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', wpOptimized: false },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', wpOptimized: false }
    ]
  },
  { 
    id: 'gemini', 
    name: 'Google Gemini',
    icon: SiGooglegemini,
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', wpOptimized: true },
      { id: 'gemini-ultra', name: 'Gemini Ultra', wpOptimized: false }
    ]
  }
];

// WordPress-specific features
const WP_FEATURES = [
  { id: 'plugin-dev', name: 'Plugin Development', icon: "🧩" },
  { id: 'theme-dev', name: 'Theme Development', icon: "🎨" },
  { id: 'gutenberg', name: 'Gutenberg Blocks', icon: "🧱" },
  { id: 'custom-code', name: 'Custom PHP/JS Code', icon: "💻" }
];

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [collapseSidebar, setCollapseSidebar] = useState(false);
  const [ismobileorMedium, setismobileorMedium] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Header state
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const [showWPFeaturesDropdown, setShowWPFeaturesDropdown] = useState(false);
  const [currentProvider, setCurrentProvider] = useState(AI_PROVIDERS[0]);
  const [currentModel, setCurrentModel] = useState(AI_PROVIDERS[0].models[0]);
  const [agentMode, setAgentMode] = useState(false);
  
  // Refs for dropdowns
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const themeButtonRef = useRef<HTMLButtonElement>(null);
  const aiDropdownRef = useRef<HTMLDivElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);
  const wpFeaturesDropdownRef = useRef<HTMLDivElement>(null);
  const wpFeaturesButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth < 975;
      setismobileorMedium(isNowMobile);

      if (!isNowMobile) {
        // Retrieve sidebar state from localStorage only on desktop
        const savedSidebarState = localStorage.getItem("sidebarState");
        setCollapseSidebar(savedSidebarState === "true");
      } else {
        // Always collapse sidebar on mobile after a refresh
        setCollapseSidebar(true);
      }
    };

    // Set initial state from localStorage on mount
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if user is logged in
  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
    }
    
    // Load saved AI model preferences
    const savedModel = localStorage.getItem('selectedAIModel');
    if (savedModel) {
      try {
        const { provider: providerId, model: modelId } = JSON.parse(savedModel);
        const providerObj = AI_PROVIDERS.find(p => p.id === providerId);
        if (providerObj) {
          setCurrentProvider(providerObj);
          const modelObj = providerObj.models.find(m => m.id === modelId);
          if (modelObj) setCurrentModel(modelObj);
        }
      } catch (e) {
        console.error("Error loading saved model", e);
      }
    }

    // Load agent mode preference
    const savedAgentMode = localStorage.getItem('selectedAgentMode');
    if (savedAgentMode === 'agent') {
      setAgentMode(true);
    }
  }, [user]);

  // Handle click outside dropdowns
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

      // Close AI Provider Dropdown if clicked outside
      if (
        aiDropdownRef.current &&
        !aiDropdownRef.current.contains(event.target as Node) &&
        aiButtonRef.current &&
        !aiButtonRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowAIDropdown(false), 100);
      }
      
      // Close WP Features Dropdown if clicked outside
      if (
        wpFeaturesDropdownRef.current &&
        !wpFeaturesDropdownRef.current.contains(event.target as Node) &&
        wpFeaturesButtonRef.current &&
        !wpFeaturesButtonRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowWPFeaturesDropdown(false), 100);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle sidebar and save state
  const handleSidebarToggle = () => {
    const newState = !collapseSidebar;
    setCollapseSidebar(newState);
    localStorage.setItem("sidebarState", newState.toString()); // Save state
  };

  // Close sidebar when clicking outside (on mobile)
  const handleOutsideClick = () => {
    if (ismobileorMedium && !collapseSidebar) {
      setCollapseSidebar(true);
      localStorage.setItem("sidebarState", "false"); // Save state as collapsed
    }
  };

  // Handle logout
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

  // Handle model selection
  const handleModelSelection = (provider: typeof AI_PROVIDERS[0], model: typeof AI_PROVIDERS[0]['models'][0]) => {
    setCurrentProvider(provider);
    setCurrentModel(model);
    setShowAIDropdown(false);
    
    // Save selection to localStorage
    localStorage.setItem('selectedAIModel', JSON.stringify({provider: provider.id, model: model.id}));
  };

  return (
    <div className="flex w-full h-screen overflow-hidden relative">
      {/* Sidebar Overlay for Mobile */}
      {ismobileorMedium && !collapseSidebar && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleOutsideClick}
        />
      )}

      {/* Sidebar - Collapse when in agent mode */}
      <div
        className={`h-full transition-all duration-300 z-50 ${
          ismobileorMedium || agentMode
            ? `fixed top-0 left-0 h-full bg-gray-700 shadow-lg ${
                collapseSidebar ? "w-0 overflow-hidden" : "w-[290px]"
              }`
            : `${
                collapseSidebar
                  ? "w-0 overflow-hidden"
                  : "w-[300px] md:w-[270px]"
              } ${
                theme === "dark"
                  ? "bg-gray-800/90 backdrop-blur-md shadow-md"
                  : "bg-gray-200/90 border-r border-gray-200"
              }`
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex flex-row items-center justify-between text-3xl p-4">
          <Link href="/" className="flex items-center gap-2">
            <motion.span
              className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}
            >
              WP.ai
            </motion.span>
          </Link>
          <button onClick={handleSidebarToggle}>
            <FiSidebar />
          </button>
        </div>

        {/* Sidebar Content */}
        {!collapseSidebar && (
          <Sidebar
            onClose={() => {
              if (ismobileorMedium) {
                setCollapseSidebar(true);
                localStorage.setItem("sidebarState", "true");
              }
            }}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-full w-full relative overflow-hidden">
        {/* Simplified Header - No Background */}
        <div className="w-full relative">
          <div className="flex justify-between items-center w-full px-4 py-3">
            {/* Left: Sidebar toggle + Two options */}
            <div className="flex items-center space-x-3">
              {collapseSidebar && (
                <button className="text-2xl mr-2" onClick={handleSidebarToggle}>
                  <FiSidebar />
                </button>
              )}
              
              {/* AI Provider Selection - Always visible */}
              <div className="relative">
                <button
                  ref={aiButtonRef}
                  onClick={() => {
                    setShowAIDropdown(!showAIDropdown);
                    setShowDropdown(false);
                    setShowThemeDropdown(false);
                    setShowWPFeaturesDropdown(false);
                  }}
                  className={`flex items-center gap-1 font-semibold tracking-wide px-3 py-2 rounded-lg duration-300
                    ${
                      theme === "dark"
                        ? "bg-gray-700/60 text-white hover:bg-gray-700/70"
                        : "bg-white text-gray-800 hover:bg-gray-100"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    {currentProvider.id === 'openai' && <SiOpenai className="text-lg" />}
                    {currentProvider.id === 'claude' && <SiClaude className="text-lg" />}
                    {currentProvider.id === 'gemini' && <SiGooglegemini className="text-lg" />}
                    <span>{currentModel.name}</span>
                    <FiChevronDown />
                  </div>
                </button>

                {/* AI Provider Dropdown */}
                {showAIDropdown && (
                  <motion.div
                    ref={aiDropdownRef}
                    className="absolute left-0 mt-2 w-64 bg-white/95 dark:bg-gray-700/95 rounded-lg shadow-lg overflow-hidden z-50 backdrop-blur-sm border border-gray-200 dark:border-gray-600"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                      <h3 className="text-sm font-medium">Select AI Provider & Model</h3>
                    </div>
                    
                    {AI_PROVIDERS.map((provider) => (
                      <div key={provider.id} className="border-b border-gray-200 dark:border-gray-600 last:border-0">
                        <div className="flex items-center gap-2 px-4 py-2 font-medium bg-gray-50/80 dark:bg-gray-700/80">
                          {provider.id === 'openai' && <SiOpenai className="text-lg" />}
                          {provider.id === 'claude' && <SiClaude className="text-lg" />}
                          {provider.id === 'gemini' && <SiGooglegemini className="text-lg" />}
                          <span>{provider.name}</span>
                        </div>
                        <div className="pl-4">
                          {provider.models.map((model) => (
                            <div 
                              key={model.id} 
                              className={`flex items-center justify-between py-2 px-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer ${
                                currentProvider.id === provider.id && currentModel.id === model.id
                                  ? 'bg-blue-50 dark:bg-blue-900/30'
                                  : ''
                              }`}
                              onClick={() => handleModelSelection(provider, model)}
                            >
                              <span className="text-sm">{model.name}</span>
                              {model.wpOptimized && (
                                <span className="flex items-center text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                                  <FaWordpress className="mr-1" /> Optimized
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>
              
              {/* WordPress Features - Only visible in agent mode */}
              {agentMode && (
                <div className="relative">
                  <button
                    ref={wpFeaturesButtonRef}
                    onClick={() => {
                      setShowWPFeaturesDropdown(!showWPFeaturesDropdown);
                      setShowDropdown(false);
                      setShowThemeDropdown(false);
                      setShowAIDropdown(false);
                    }}
                    className={`flex items-center gap-1 font-semibold tracking-wide px-3 py-2 rounded-lg duration-300
                      ${
                theme === "dark"
                          ? "bg-blue-800/30 text-white hover:bg-blue-700/40"
                          : "bg-blue-50 text-blue-800 hover:bg-blue-100"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <FaWordpress className="text-blue-500" />
                      <span>WP Features</span>
                      <FiChevronDown />
                    </div>
                  </button>

                  {/* WordPress Features Dropdown */}
                  {showWPFeaturesDropdown && (
                    <motion.div
                      ref={wpFeaturesDropdownRef}
                      className="absolute left-0 mt-2 w-56 bg-white/95 dark:bg-gray-700/95 rounded-lg shadow-lg overflow-hidden z-50 backdrop-blur-sm border border-gray-200 dark:border-gray-600"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-3 border-b border-gray-200 dark:border-gray-600">
                        <h3 className="text-sm font-medium">WordPress Features</h3>
                      </div>
                      
                      {WP_FEATURES.map((feature) => (
                        <div 
                          key={feature.id} 
                          className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            setShowWPFeaturesDropdown(false);
                          }}
                        >
                          <span className="text-blue-500">{feature.icon}</span>
                          <span>{feature.name}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}
            </div>
            
            {/* Right: Theme & Profile only */}
            <div className="flex items-center gap-3">
              {/* Theme Dropdown Button */}
              <div className="relative">
                <button
                  ref={themeButtonRef} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowThemeDropdown((prev) => !prev);
                    setShowDropdown(false);
                    setShowAIDropdown(false);
                    setShowWPFeaturesDropdown(false);
                  }}
                  className="p-2.5 bg-gray-100/80 dark:bg-gray-700/80 rounded-full hover:shadow-md transition-all duration-300 relative group backdrop-blur-sm"
                  aria-label="Theme settings"
                >
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-50 blur transition duration-300" />
                  <div className="relative">
                    {theme === "light" && <FaSun className="text-yellow-500 text-xl" />}
                    {theme === "dark" && <FaMoon className="text-blue-500 text-xl" />}
                    {theme === "system" && <FaDesktop className="text-purple-500 text-xl" />}
                  </div>
                </button>

                {/* Theme Selection Dropdown */}
                {showThemeDropdown && (
                  <motion.div
                    ref={themeDropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-44 bg-white/95 dark:bg-gray-700/95 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600 backdrop-blur-sm"
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
                          setTheme(item.mode as any);
                          setShowThemeDropdown(false);
                        }}
                      >
                        <item.icon className={`${item.color} text-lg`} />
                        <span className="font-medium">{item.label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Profile - Simplified to just circle image */}
              {!isLoggedIn ? (
                <div className="flex space-x-3">
                  <Link href="/signin">
                    <motion.button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition overflow-hidden text-sm font-medium"
                      whileHover={{ scale: 1.03 }}
                      onClick={() => localStorage.setItem("isChat", "true")}
                    >
                      Sign In
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <div className="relative">
              <button
                    ref={buttonRef}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDropdown((prev) => !prev);
                      setShowThemeDropdown(false);
                      setShowAIDropdown(false);
                      setShowWPFeaturesDropdown(false);
                    }}
                    className="relative h-10 w-10 rounded-full overflow-hidden shadow-inner hover:shadow-md transition-all duration-300"
                  >
                    <Image
                      src={user?.profile_picture || "/placeholder.svg"}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
              </button>

                  {/* User Dropdown Menu - Simplified */}
                  {showDropdown && (
                    <motion.div
                      ref={dropdownRef}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-gray-700/95 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-600 backdrop-blur-sm"
                    >
                      {/* Menu Options */}
                      <div>
                        <Link href="/profile">
                          <motion.div
                            whileHover={{ x: 5 }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <FaUser className="text-gray-500" />
                            <span>My Profile</span>
                          </motion.div>
                        </Link>
                        <Link href="/settings">
                          <motion.div
                            whileHover={{ x: 5 }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          >
                            <FaCog className="text-gray-500" />
                            <span>Settings</span>
                          </motion.div>
                        </Link>
                        <motion.div
                          whileHover={{ x: 5 }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={handleLogout}
                        >
                          <FaSignOutAlt className="text-red-500" />
                          <span className="text-red-500">Sign Out</span>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content: Make sure it scrolls */}
        <div className="flex-1 overflow-y-auto pb-2 pt-0 font-inter w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
