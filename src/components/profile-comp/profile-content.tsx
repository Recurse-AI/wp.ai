/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTheme } from "@/context/ThemeProvider";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UploadCloud, Lock, Sun, Moon, Laptop, AlertTriangle } from "lucide-react"
import ChangePasswordModal from "./change-password-modal"
import DeleteAccountModal from "./delete-account-modal"

const fallbackUserData = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  avatarUrl: "https://avatars.githubusercontent.com/u/106924262?v=4",
  isPremium: true,
  premiumType: "yearly",
  premiumExpireDate: "2024-12-31",
}

export default function ProfileContent() {
  const [userData, setUserData] = useState(fallbackUserData);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const storedUser = JSON.parse(localStorage.getItem("userData") || "{}");

  // Ensure storedUser has expected properties to avoid errors
  const ensureValidUser = {
    user: storedUser.user || { full_name: "Guest User", email: "guest@example.com" },
    profile_pic: storedUser.profile_pic || "/placeholder.svg"
  };

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const response = await fetch("/api/user/profile"); // Replace with actual API endpoint
  //       if (!response.ok) throw new Error("Failed to fetch user data");
  //       const data = await response.json();
  //       setUserData(data);
  //     } catch (error) {
  //       console.error("Error fetching user data:", error);
  //     }
  //   };
  //   fetchUserData();
  // }, []);

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="preferences">Preferences</TabsTrigger>
      </TabsList>
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your public profile details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Image
                  src={ensureValidUser.profile_pic}
                  alt="Profile picture"
                  width={100}
                  height={100}
                  className="rounded-full"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{ensureValidUser.user.full_name}</h2>
                <p className="text-muted-foreground">{ensureValidUser.user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            {/* <CardDescription>Manage your account and subscription details.</CardDescription> */}
            <CardDescription>Manage your account here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* <div className="space-y-2">
              <h3 className="text-lg font-semibold">Premium Status</h3>
              {(storedUser.user_profile.is_premium || true) ? (
                <div>
                  <p>You have a {userData.premiumType} premium plan.</p>
                  <p>Expires on: {userData.premiumExpireDate}</p>
                </div>
              ) : (
                <p>You are on the free plan.</p>
              )}
            </div> */}
            {/* <Button onClick={() => console.log("Upgrade premium clicked")}>{userData.isPremium ? "Change Plan" : "Upgrade to Premium"}</Button> */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Password</h3>
              <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)}>
                <Lock className="mr-2 h-4 w-4" /> Change Password
              </Button>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Delete Account</h3>
              <Button variant="destructive" onClick={() => setIsDeleteAccountModalOpen(true)}>
                <AlertTriangle className="mr-2 h-4 w-4" /> Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="preferences">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your app experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Theme</h3>
              <div className="flex space-x-4">
                <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" /> Light
                </Button>
                <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </Button>
                <Button variant={theme === "system" ? "default" : "outline"} onClick={() => setTheme("system")}>
                  <Laptop className="mr-2 h-4 w-4" /> System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      <DeleteAccountModal isOpen={isDeleteAccountModalOpen} onClose={() => setIsDeleteAccountModalOpen(false)} />
    </Tabs>
  )
}
