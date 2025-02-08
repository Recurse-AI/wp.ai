"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FaUser, FaSignOutAlt, FaCogs, FaInfoCircle, FaCrown } from "react-icons/fa"; // Icons

export default function Navbar() {
  const { data: session } = useSession(); // ✅ Track NextAuth session
  const pathname = usePathname();
  const router = useRouter(); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "Unayes Khan", image: "https://avatars.githubusercontent.com/u/106924262?v=4" });
  const [showDropdown, setShowDropdown] = useState(false);

  // ✅ Check Auth Status when Path Changes
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token && session) {
      setIsLoggedIn(true);

      // ✅ Fetch user details from API
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
  }, [pathname, session]); // ✅ Runs when session changes

  // 🔹 Logout Function (Fix NextAuth Session Persistence)
  const handleLogout = async () => {
    setShowDropdown(false);
    localStorage.removeItem("authToken"); // ✅ Clear token

    await signOut({ redirect: false }); // ✅ Sign out from NextAuth, but don't auto redirect

    setIsLoggedIn(false);
    router.push("/"); // ✅ Redirect manually
  };

  // 🔹 Hide Navbar on /signin & /signup
  if (pathname === "/signin" || pathname === "/signup") return null;

  return (
    <>
      {/* Fixed Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-gray-900 text-white py-4 px-6 flex justify-between items-center shadow-lg z-50">
        {/* Left: Website Name */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-transparent bg-clip-text">
            WP.ai
          </span>
        </Link>

        {/* Right: Authentication Options */}
        {!isLoggedIn ? (
          <div className="flex gap-4">
            <Link href="/signin">
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">Sign In</button>
            </Link>
            <Link href="/signup">
              <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">Sign Up</button>
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Profile Section */}
            <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2">
              <Image src={user.image} alt="Profile" width={40} height={40} className="rounded-full border-2 border-gray-600" />
              <span className="font-semibold">{user.name}</span>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <Link href="/profile">
                  <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-700 cursor-pointer">
                    <FaUser /> Profile
                  </div>
                </Link>
                <Link href="/pricing">
                  <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-700 cursor-pointer">
                    <FaCrown /> Pricing
                  </div>
                </Link>
                <Link href="/settings">
                  <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-700 cursor-pointer">
                    <FaCogs /> Settings
                  </div>
                </Link>
                <Link href="/about">
                  <div className="flex items-center gap-2 px-4 py-3 hover:bg-gray-700 cursor-pointer">
                    <FaInfoCircle /> About
                  </div>
                </Link>
                <div onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 hover:bg-red-50 cursor-pointer text-red-400">
                  <FaSignOutAlt /> Sign Out
                </div>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* 🔹 Add padding so content doesn't get hidden behind navbar */}
      <div className="pt-16"></div>
    </>
  );
}
