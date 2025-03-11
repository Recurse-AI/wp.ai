"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { useTheme } from "@/context/ThemeProvider";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DeleteAccountError {
  password?: string[];
  message?: string;
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const { theme } = useTheme();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Reset form when modal closes
  const handleClose = () => {
    setPassword("");
    setErrorMessage("");
    onClose();
  };

  // Handle Delete Account API Call
  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter your password to confirm account deletion.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/users/delete-account/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const errorData = await res.json() as DeleteAccountError;
        console.log("Error data:", errorData);
        
        // Create error message from all error fields
        const errorMessages: string[] = [];
        if (errorData.password) {
          errorMessages.push(...errorData.password);
        }
        if (errorData.message) {
          errorMessages.push(errorData.message);
        }
        
        if (errorMessages.length > 0) {
          throw new Error(errorMessages.join("\n"));
        } else {
          throw new Error("Failed to delete account");
        }
      }

      toast.success("Your account has been deleted.");
      handleClose();

      // Clear all auth data from localStorage
      localStorage.removeItem("userData");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("isChat");

      // Redirect to homepage after deletion
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.detail || "Failed to delete account. Try again.");
      toast.error(err.detail || "Failed to delete account.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className={`p-6 rounded-lg shadow-lg w-[90%] max-w-md border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}>
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
            Delete Account
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            ✕
          </button>
        </div>

        {/* Description */}
        <p className={`text-sm mb-4 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>
          This action <strong>cannot be undone</strong>. Your account and all associated data will be permanently deleted.
        </p>

        {/* Error Messages */}
        {errorMessage && errorMessage.split("\n").map((error, index) => (
          <p key={index} className="text-red-400 text-center mb-4">{error}</p>
        ))}

        {/* Form */}
        <form onSubmit={handleDeleteAccount}>
          <div className="mb-4">
            <label htmlFor="confirm-password" className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
              Enter your password to confirm deletion
            </label>
            <input
              id="confirm-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full mt-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${theme === "dark" ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-100 border-gray-300 text-gray-900"}`}
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 rounded-md transition ${theme === "dark" ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
