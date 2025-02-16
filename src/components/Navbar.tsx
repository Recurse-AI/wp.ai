/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState } from "react";
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
import SettingsDialog from "@/myUi/SettingsDialog";
import MySettings from "@/myUi/MySettings";

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
    image: "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=",
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // ✅ Moved to top

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

  /** ✅ useEffect should be called unconditionally */
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    console.log(token)
  
    if (token) {
      setIsLoggedIn(true);
  
      fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/get-user/`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ Ensures cookies are sent
      })
        .then((res) => {
          if (res.status === 200) {
            return res.json(); // ✅ Proceed only if status is 200
          } else {
            // localStorage.removeItem("authToken");
            // setIsLoggedIn(false);
            throw new Error("Unauthorized"); // ✅ Trigger error handling
          }
        })
        .then((data) => {
          console.log(data);
          // ✅ Save full user data in localStorage
          localStorage.setItem("userData", JSON.stringify(data));
          setUser({ name: data.user.full_name, image: data.profile_pic });
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          // toast.error("You are not logged in, please log in first!"); // ✅ Show error toast
          // localStorage.removeItem("authToken");
          // setIsLoggedIn(false);
          if(pathname !== "/signin" && pathname !== "/signup" && pathname !== "/about" && pathname !== "/pricing")
          router.push("/"); // ✅ Redirect to sign-in page
        });
    } else {
      // localStorage.removeItem("authToken");
      // setIsLoggedIn(false);
      // toast.error("You are not logged in, please log in first!"); // ✅ Show toast if no token
      if(pathname !== "/signin" && pathname !== "/signup" && pathname !== "/about" && pathname !== "/pricing")
      router.push("/"); // ✅ Redirect to sign-in page
    }
  }, [pathname, session]);
  

  const handleLogout = async () => {
    setShowDropdown(false);
    localStorage.removeItem("authToken");
    await signOut({ redirect: false });
    setIsLoggedIn(false);
    router.push("/");
  };

  if (pathname === "/signin" || pathname === "/signup" || pathname === "/chat") return null;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full py-4 px-6 flex justify-between items-center z-50 transition-all duration-300
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
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"], // Moves the gradient left-right
            }}
            transition={{
              duration: 4, // Duration of one cycle
              repeat: Infinity, // Infinite loop
              ease: "linear", // Smooth transition
            }}
            style={{
              backgroundSize: "200% 200%", // Increases gradient size for smooth flow
            }}
          >
            WP.ai
          </motion.span>
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

            {/* 🔹 Theme Selection Dropdown */}
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
                <motion.button
                  className="relative px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition overflow-hidden"
                  whileHover={{ scale: 1.05 }} // Slight scale-up on hover
                >
                  Sign In
                  {/* Flowing Light Effect */}
                  <motion.div
                    className="absolute inset-0 bg-white opacity-10"
                    animate={{ x: ["-100%", "100%"] }} // Moves from left to right
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                </motion.button>
              </Link>

              <Link href="/signup">
                <motion.button
                  className="relative px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition overflow-hidden"
                  whileHover={{ scale: 1.05 }} // Slight scale-up on hover
                >
                  Sign Up
                  {/* Flowing Light Effect */}
                  <motion.div
                    className="absolute inset-0 bg-white opacity-10"
                    animate={{ x: ["-100%", "100%"] }} // Moves from left to right
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  />
                </motion.button>
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
              {/* 🔹 Responsive Username */}
              <div className="font-semibold max-w-[100px] sm:max-w-[150px] md:max-w-none break-words text-left hidden sm:block">
                {user.name}
              </div>

            </button>

            {/* 🔹 Profile Dropdown */}
            {showDropdown && (
              <motion.div
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
                <Link href="/pricing" onClick={() => setShowDropdown(false)}>
                  <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                    <FaCrown /> Pricing
                  </div>
                </Link>
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
      <div className="pt-16"></div>
    </>
  );
}