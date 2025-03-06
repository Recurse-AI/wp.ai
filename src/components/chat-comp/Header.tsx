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
  FaWordpress,
  FaRobot,
  FaBrain,
  FaCode,
  FaMagic,
  FaDatabase,
  FaSearch,
  FaCog,
} from "react-icons/fa";
import { SiOpenai, SiGooglegemini } from "react-icons/si";
import { SiClaude } from "react-icons/si";
import { useTheme } from "@/context/ThemeProvider";
import { Menu, ChevronRight, Database, Layers, Zap } from "lucide-react";
import { Tooltip } from "react-tooltip";

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
  { id: 'plugin-dev', name: 'Plugin Development', icon: FaRocket },
  { id: 'theme-dev', name: 'Theme Development', icon: FaBrain },
  { id: 'gutenberg', name: 'Gutenberg Blocks', icon: FaWordpress },
  { id: 'custom-code', name: 'Custom PHP/JS Code', icon: FaCode }
];


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
  
  // New state for AI provider and model
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const [currentProvider, setCurrentProvider] = useState(AI_PROVIDERS[0]);
  const [currentModel, setCurrentModel] = useState(AI_PROVIDERS[0].models[0]);
  const aiDropdownRef = useRef<HTMLDivElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);
  
  // New state for WordPress features
  const [showWPFeaturesDropdown, setShowWPFeaturesDropdown] = useState(false);
  const wpFeaturesDropdownRef = useRef<HTMLDivElement>(null);
  const wpFeaturesButtonRef = useRef<HTMLButtonElement>(null);
  
  // New state for agent modes
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const agentDropdownRef = useRef<HTMLDivElement>(null);
  const agentButtonRef = useRef<HTMLButtonElement>(null);
  
  // WordPress input state
  const [wpQuery, setWpQuery] = useState("");
  
  // Embedding mode state
  const [embeddingEnabled, setEmbeddingEnabled] = useState(false);

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

  // Handle model selection
  const handleModelSelection = (provider: typeof AI_PROVIDERS[0], model: typeof AI_PROVIDERS[0]['models'][0]) => {
    setCurrentProvider(provider);
    setCurrentModel(model);
    setShowAIDropdown(false);
    
    // Here you would typically set the model in your state or context
    console.log(`Selected ${provider.name} - ${model.name}`);
    localStorage.setItem('selectedAIModel', JSON.stringify({provider: provider.id, model: model.id}));
  };
  
 
  
  // Handle WordPress query submission
  const handleWpQuerySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wpQuery.trim()) return;
    
    console.log(`Submitting WP query: ${wpQuery} with embedding: ${embeddingEnabled}`);
    // Here you would send the query to your backend
    
    // Clear the input
    setWpQuery("");
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
      
      // Close Agent Mode Dropdown if clicked outside
      if (
        agentDropdownRef.current &&
        !agentDropdownRef.current.contains(event.target as Node) &&
        agentButtonRef.current &&
        !agentButtonRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setShowAgentDropdown(false), 100);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    getUser(setIsLoggedIn, setUser, router, pathname);
    
    // Load saved preferences
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
    
    const savedAgentMode = localStorage.getItem('selectedAgentMode');
    
  }, []);

  return (
    <div className={`flex flex-col w-full ${theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-100 text-black"}`}>
      {/* Top navigation bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 w-full border-b border-gray-700 dark:border-gray-700">
        {/* Left: Logo and Mode Selection */}
        <div className="flex items-center gap-3">
      <div className="relative">
        <button
          ref={wpAIButtonRef}
          onClick={() => {
            setShowWPAIDropdown(!showWPAIDropdown);
            setShowDropdown(false);
            setShowThemeDropdown(false);
                setShowAIDropdown(false);
                setShowWPFeaturesDropdown(false);
                setShowAgentDropdown(false);
          }}
          className={`flex items-center gap-1 font-semibold tracking-wide px-3 py-2 rounded-lg duration-300
            ${
              theme === "dark"
                    ? "bg-blue-900/40 border border-blue-800 text-white hover:bg-blue-800/50"
                    : "bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100"
                }`}
            >
              <div className="flex items-center gap-1">
                <FaWordpress className="text-blue-500 text-xl" />
                <span className="font-bold">WP.AI</span>
                <FiChevronDown />
          </div>
        </button>

        {/* WP.AI Dropdown Menu */}
        {showWPAIDropdown && (
          <motion.div
            ref={wpAIDropdownRef}
                className="absolute left-0 mt-2 w-60 bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg overflow-hidden z-50 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
          >
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <h3 className="font-medium">WordPress AI Assistant</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Your WordPress development companion</p>
                </div>
            <div
              onClick={handleDefaultMode}
                  className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <FaRocket className="text-blue-500" /> Default Mode
                </div>
                <Link href="/agent" className="block w-full">
                  <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                    <FaRobot className="text-blue-500" /> Agent Mode
                  </div>
                </Link>
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  Designed specifically for WordPress developers
                </div>
              </motion.div>
            )}
          </div>
        </div>
        
        {/* Right: Theme & Authentication */}
        <div className="flex gap-4 items-center relative">
          {/* AI Provider Selection */}
          <div className="relative hidden md:block">
            <button
              ref={aiButtonRef}
              onClick={() => {
                setShowAIDropdown(!showAIDropdown);
                setShowDropdown(false);
                setShowThemeDropdown(false);
                setShowWPAIDropdown(false);
                setShowWPFeaturesDropdown(false);
                setShowAgentDropdown(false);
              }}
              className={`flex items-center gap-1 font-semibold tracking-wide px-3 py-2 rounded-lg duration-300
                ${
                  theme === "dark"
                    ? "bg-gray-900/60 border border-gray-800 text-white hover:bg-gray-800/70"
                    : "bg-white border border-gray-300 text-gray-800 hover:bg-gray-100"
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
                className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg overflow-hidden z-50 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium">Select AI Provider & Model</h3>
                </div>
                
                {AI_PROVIDERS.map((provider) => (
                  <div key={provider.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0">
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
          
          {/* WordPress Features */}
          <div className="relative hidden md:block">
            <button
              ref={wpFeaturesButtonRef}
              onClick={() => {
                setShowWPFeaturesDropdown(!showWPFeaturesDropdown);
                setShowDropdown(false);
                setShowThemeDropdown(false);
                setShowWPAIDropdown(false);
                setShowAIDropdown(false);
                setShowAgentDropdown(false);
              }}
              className={`flex items-center gap-1 font-semibold tracking-wide px-3 py-2 rounded-lg duration-300
                ${
                  theme === "dark"
                    ? "bg-blue-900/30 border border-blue-800 text-white hover:bg-blue-800/40"
                    : "bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100"
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
                className="absolute right-0 mt-2 w-56 bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-lg overflow-hidden z-50 backdrop-blur-sm border border-gray-200 dark:border-gray-700"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium">WordPress Features</h3>
                </div>
                
                {WP_FEATURES.map((feature) => (
                  <div 
                    key={feature.id} 
                    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    onClick={() => {
                      console.log(`Selected WP feature: ${feature.name}`);
                      setShowWPFeaturesDropdown(false);
                      setWpQuery(`Help me with ${feature.name.toLowerCase()}`);
                    }}
                  >
                    <feature.icon className="text-blue-500" /> 
                    <span>{feature.name}</span>
            </div>
                ))}
          </motion.div>
        )}
      </div>

        {/* 🔹 Theme Dropdown Button */}
        <div className="relative">
          <button
              ref={themeButtonRef} 
            onClick={(e) => {
                e.stopPropagation();
              setShowThemeDropdown((prev) => !prev);
              setShowDropdown(false);
                setShowWPAIDropdown(false);
                setShowAIDropdown(false);
                setShowWPFeaturesDropdown(false);
                setShowAgentDropdown(false);
              }}
              className="p-2.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-full hover:shadow-md transition-all duration-300 relative group backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
              aria-label="Theme settings"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-50 blur transition duration-300" />
              <div className="relative">
                {theme === "light" && <FaSun className="text-yellow-500 text-xl" />}
                {theme === "dark" && <FaMoon className="text-blue-500 text-xl" />}
                {theme === "system" && <FaDesktop className="text-purple-500 text-xl" />}
              </div>
          </button>

          {/* 🔹 Theme Selection Dropdown */}
          {showThemeDropdown && (
              <motion.div
              ref={themeDropdownRef}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-2 w-44 bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
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
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg transition text-sm md:text-base"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => localStorage.setItem("isChat", "true")}
                >
                  Sign Up
                </motion.button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative">
            <button
                ref={buttonRef}
              onClick={(e) => {
                  e.stopPropagation();
                setShowDropdown((prev) => !prev);
                setShowThemeDropdown(false);
                  setShowWPAIDropdown(false);
                  setShowAIDropdown(false);
                  setShowWPFeaturesDropdown(false);
                  setShowAgentDropdown(false);
              }}
                className="flex items-center gap-2 py-1 px-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-full hover:shadow-md transition-all duration-300 relative group backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50"
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-0 group-hover:opacity-50 blur transition duration-300" />
                <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-white dark:border-gray-700 shadow-inner">
              <Image
                    src={user.image || "/placeholder.svg"}
                    alt={user.name || "User"}
                width={40}
                height={40}
                    className="rounded-full"
              />
                </div>
                <span className="font-medium text-sm hidden md:block relative">
                {user.name}
                </span>
            </button>

              {/* User Dropdown Menu */}
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
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-700">
                        <Image
                          src={user.image || "/placeholder.svg"}
                          alt={user.name || "User"}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                  </div>
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          WordPress Developer
                  </div>
                  </div>
                    </div>
                  </div>

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
  );
};

export default Header;