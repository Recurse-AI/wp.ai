"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { FaUser, FaEnvelope, FaCrown, FaLock } from "react-icons/fa"; // Icons
import Modal from "@/components/Modal";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [user, setUser] = useState({
    name: "Unayes Ahmed Khan",
    email: "unayeskhan.0808@gmail.com",
    image: "https://avatars.githubusercontent.com/u/106924262?v=4",
    provider: "manual",
    premium: true,
    premiumType: "monthly",
    premiumEndDate: "31 February, 2025",
  });

  const [imagePreview, setImagePreview] = useState(user.image);
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  // 🔹 Handle Image Upload & Send to API
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // 🔹 Create FormData to send image file
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/update-profile-picture`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to update profile picture");

      const data = await res.json();
      setUser((prev) => ({ ...prev, image: data.image })); // Update state with new image
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      toast.error("Error updating profile picture.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Profile Card */}
      <div className="bg-gray-800/40 backdrop-blur-lg shadow-lg rounded-xl p-10 w-full max-w-2xl text-center border border-gray-700">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <FaUser /> Profile
        </h1>

        {/* Profile Picture (With Hover Effect & API Call) */}
        <div className="relative mt-6 group">
          <Image
            src={imagePreview}
            alt="Profile"
            width={180}
            height={180}
            className="rounded-full border-4 border-gray-600 mx-auto"
          />
          <label className="absolute inset-0 flex items-center justify-center bg-gray-800/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
            <span className="text-white text-lg font-semibold">Change</span>
            <input type="file" className="hidden" onChange={handleImageChange} />
          </label>
        </div>

        {/* User Details */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-center gap-2 text-lg">
            <FaUser className="text-gray-400" />
            <span className="font-semibold">{user.name}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <FaEnvelope />
            <span>{user.email}</span>
          </div>
        </div>

        {/* Premium Status */}
        <div className="mt-6">
          {user.premium ? (
            <div className="bg-yellow-500 text-gray-900 px-4 py-2 rounded-md text-sm font-bold">
              <FaCrown className="inline mr-2" />
              Premium: {user.premiumType} Plan (Expires: {user.premiumEndDate})
            </div>
          ) : (
            <div className="text-gray-400">You are on the Free Plan</div>
          )}
        </div>

        {/* Action Buttons (Centered Text) */}
        <div className="mt-8 flex flex-col space-y-3">
          {user.provider === "manual" && (
            <button
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-all text-white rounded-md w-full font-medium"
              onClick={() => setPasswordModalOpen(true)}
            >
              <FaLock className="text-lg" /> Change Password
            </button>
          )}
          <button
            className="flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 transition-all text-white rounded-md w-full font-medium"
            onClick={() => window.location.href = "/upgrade-plan"}
          >
            <FaCrown className="text-lg" /> Upgrade Plan
          </button>
        </div>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <Modal onClose={() => setPasswordModalOpen(false)}>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FaLock /> Change Password
          </h2>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const oldPassword = (e.currentTarget.elements.namedItem("oldPassword") as HTMLInputElement).value;
              const newPassword = (e.currentTarget.elements.namedItem("newPassword") as HTMLInputElement).value;

              try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/change-password`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ oldPassword, newPassword }),
                });

                if (!res.ok) throw new Error("Failed to change password");

                toast.success("Password updated successfully!");
                setPasswordModalOpen(false);
              } catch (error) {
                toast.error("Error changing password.");
              }
            }}
          >
            <input
              type="password"
              name="oldPassword"
              placeholder="Old Password"
              className="w-full p-3 bg-gray-800 text-white rounded-md mb-3"
              required
            />
            <input
              type="password"
              name="newPassword"
              placeholder="New Password"
              className="w-full p-3 bg-gray-800 text-white rounded-md mb-3"
              required
            />
            <button type="submit" className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
              Submit
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
