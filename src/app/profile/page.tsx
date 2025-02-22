"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import ProfileContent from "../../components/profile-comp/profile-content";
import { getUser } from "@/utils/getUser";

export default function ProfilePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", image: "" });
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    getUser(setIsLoggedIn, setUser, router, pathname);
  }, []);

  // ✅ If user is NOT logged in, show login message
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          🚫 Login required to access this page!
        </h2>
        <button
          onClick={() => router.push("/signin")}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Sign In
        </button>
      </div>
    );
  }

  // ✅ Show profile page if user is logged in
  return (
    <div className="container mx-auto py-10 px-6 md:px-12 lg:px-20">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-900 dark:text-white">
        <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-transparent bg-clip-text animate-pulse">
          WP.ai
        </span>{" "}
        <span className="relative inline-block">
          User Profile
          <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-wiggle"></span>
        </span>
      </h1>
      <ProfileContent />
    </div>
  );
}
