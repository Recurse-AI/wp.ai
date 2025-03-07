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
import { UploadCloud, Lock, Sun, Moon, Laptop, AlertTriangle, Edit, Camera } from "lucide-react"
import ChangePasswordModal from "./change-password-modal"
import DeleteAccountModal from "./delete-account-modal"

interface UserData {
  name: string;
  username: string;
  email: string;
  image: string;
  profile_picture: string;
}

interface ProfileContentProps {
  initialUserData: UserData;
}

const fallbackUserData: UserData = {
  name: "Guest User",
  username: "guest_user",
  email: "guest@example.com",
  image: "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=",
  profile_picture: "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs="
};

export default function ProfileContent({ initialUserData }: ProfileContentProps) {
  const [userData, setUserData] = useState<UserData>(initialUserData);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    console.log('ProfileContent - Raw userData:', storedUserData);
    
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        console.log('ProfileContent - Parsed userData:', parsedData);
        
        if (parsedData) {
          setUserData({
            name: parsedData.name || parsedData.username || fallbackUserData.name,
            username: parsedData.username || fallbackUserData.username,
            email: parsedData.email || fallbackUserData.email,
            image: parsedData.image || parsedData.profile_picture || fallbackUserData.image,
            profile_picture: parsedData.profile_picture || parsedData.image || fallbackUserData.profile_picture
          });
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        setUserData(fallbackUserData);
      }
    }
  }, [initialUserData]);

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="profile" className="text-lg">Profile</TabsTrigger>
        <TabsTrigger value="account" className="text-lg">Account</TabsTrigger>
        <TabsTrigger value="preferences" className="text-lg">Preferences</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Profile Information</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Your public profile details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-1000"></div>
                <div className="relative">
                  <Image
                    src={userData.profile_picture}
                    alt="Profile picture"
                    width={150}
                    height={150}
                    className="rounded-full border-4 border-white dark:border-gray-800"
                  />
                  <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
                    {userData.name}
                  </h2>
                  <p className="text-xl text-gray-600 dark:text-gray-400">@{userData.username}</p>
                  <p className="text-gray-500 dark:text-gray-500">{userData.email}</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Edit className="w-4 h-4 mr-2" /> Edit Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="account">
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Account Settings</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Manage your account here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Password</h3>
                <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)} className="w-full md:w-auto">
                  <Lock className="mr-2 h-4 w-4" /> Change Password
                </Button>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-red-500">Danger Zone</h3>
                <Button variant="destructive" onClick={() => setIsDeleteAccountModalOpen(true)} className="w-full md:w-auto">
                  <AlertTriangle className="mr-2 h-4 w-4" /> Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preferences">
        <Card className="border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Preferences</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">Customize your app experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Theme</h3>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant={theme === "light" ? "default" : "outline"} 
                  onClick={() => setTheme("light")}
                  className="flex-1 md:flex-none"
                >
                  <Sun className="mr-2 h-4 w-4" /> Light
                </Button>
                <Button 
                  variant={theme === "dark" ? "default" : "outline"} 
                  onClick={() => setTheme("dark")}
                  className="flex-1 md:flex-none"
                >
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </Button>
                <Button 
                  variant={theme === "system" ? "default" : "outline"} 
                  onClick={() => setTheme("system")}
                  className="flex-1 md:flex-none"
                >
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
  );
}
