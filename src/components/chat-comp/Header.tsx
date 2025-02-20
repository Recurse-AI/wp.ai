"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { FiChevronDown } from "react-icons/fi";
import { useRouter, usePathname } from "next/navigation";
import { getUser } from "@/utils/getUser";

const Header = ({ ml }: { ml: string }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ name: "", image: "" });

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    getUser(setIsLoggedIn, setUser, router, pathname);
  }, []);

  return (
    <div
      className={`flex items-center justify-between m-2
    absolute w-full top-0 left-0 pl-3 pr-1 ${ml}`}
    >
      {/* WP.AI Dropdown Button */}
      <button
        className="flex items-center gap-1 bg-[#212121]
        hover:bg-black font-semibold tracking-wide px-3 py-2 rounded-lg duration-300"
      >
        <div className="flex gap-1">
          WP.AI <FiChevronDown />
        </div>
      </button>

      {/* User Profile OR Sign-In Button */}
      <div className="flex text-base mr-10">
        {isLoggedIn ? (
          <div className="flex flex-row gap-2 hover:opacity-80">
            {/* Profile Picture */}
            <Image
              key={user.image}
              src={user.image || "/default-avatar.png"} // Default avatar if no image
              alt="User Image"
              height={40}
              width={40}
              className="px-1 rounded-full object-cover cursor-pointer"
              onClick={() => router.push("/profile")} // Redirect to profile page
            />

            {/* User Name (Hidden in Mobile Mode) */}
            <p className="font-semibold items-center justify-center hidden sm:flex">
              {user.name}
            </p>
          </div>
        ) : (
          // Sign-In Button
          <button
            onClick={() => router.push("/signin")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;