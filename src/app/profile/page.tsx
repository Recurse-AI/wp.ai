"use client";

import ProfileContent from "../../components/profile-comp/profile-content";

export default function ProfilePage() {
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
