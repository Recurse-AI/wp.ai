"use client"

import { useState } from "react"
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

// Dummy data - replace with API call in production
const userData = {
  name: "Jane Doe",
  email: "jane.doe@example.com",
  avatarUrl: "https://avatars.githubusercontent.com/u/106924262?v=4",
  isPremium: true,
  premiumType: "yearly",
  premiumExpireDate: "2024-12-31",
}

export default function ProfileContent() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false)
  const { theme, setTheme } = useTheme();

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Handle avatar upload
    console.log("Avatar change:", event.target.files?.[0])
    // In production, make an API call to upload the image
  }

  const handlePremiumUpgrade = () => {
    // Handle premium upgrade
    console.log("Upgrade premium clicked")
    // In production, redirect to upgrade page or open upgrade modal
  }

  const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
    setTheme(newTheme)
    // In production, save theme preference to user settings via API
  }

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
                  src={userData.avatarUrl || "/placeholder.svg"}
                  alt="Profile picture"
                  width={100}
                  height={100}
                  className="rounded-full"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{userData.name}</h2>
                <p className="text-muted-foreground">{userData.email}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={userData.name} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={userData.email} readOnly />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account and subscription details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Premium Status</h3>
              {userData.isPremium ? (
                <div>
                  <p>You have a {userData.premiumType} premium plan.</p>
                  <p>Expires on: {userData.premiumExpireDate}</p>
                </div>
              ) : (
                <p>You are on the free plan.</p>
              )}
            </div>
            <Button onClick={handlePremiumUpgrade}>{userData.isPremium ? "Change Plan" : "Upgrade to Premium"}</Button>
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
                <Button variant={theme === "light" ? "default" : "outline"} onClick={() => handleThemeChange("light")}>
                  <Sun className="mr-2 h-4 w-4" /> Light
                </Button>
                <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => handleThemeChange("dark")}>
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => handleThemeChange("system")}
                >
                  <Laptop className="mr-2 h-4 w-4" /> System
                </Button>
              </div>
            </div>
            {/* Add more preference options here */}
          </CardContent>
        </Card>
      </TabsContent>
      <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />
      <DeleteAccountModal isOpen={isDeleteAccountModalOpen} onClose={() => setIsDeleteAccountModalOpen(false)} />
    </Tabs>
  )
}

