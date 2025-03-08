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
        <TabsTrigger value="profile" className="text-lg font-medium transition-all hover:text-blue-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">Profile</TabsTrigger>
        <TabsTrigger value="account" className="text-lg font-medium transition-all hover:text-blue-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">Account</TabsTrigger>
        <TabsTrigger value="preferences" className="text-lg font-medium transition-all hover:text-blue-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">Preferences</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl transform transition-all duration-500 hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">Profile Information</CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-400">Manage your public profile details and information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                <div className="relative">
                  <Image
                    src={userData.profile_picture}
                    alt="Profile picture"
                    width={180}
                    height={180}
                    className="rounded-full border-4 border-white dark:border-gray-800 shadow-xl transform transition-all duration-500 group-hover:scale-105"
                  />
                  <button className="absolute bottom-2 right-2 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full hover:shadow-lg hover:scale-110 transition-all duration-300">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="space-y-2">
                  <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text animate-gradient">
                    {userData.name}
                  </h2>
                  <p className="text-2xl text-gray-600 dark:text-gray-400">@{userData.username}</p>
                  <p className="text-lg text-gray-500 dark:text-gray-500">{userData.email}</p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6 h-auto shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
                  <Edit className="w-5 h-5 mr-3" /> Edit Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="account">
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl transform transition-all duration-500 hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">Account Settings</CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-400">Manage your account security and preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Password & Security</h3>
                <Button 
                  variant="outline" 
                  onClick={() => setIsPasswordModalOpen(true)} 
                  className="w-full md:w-auto text-lg px-8 py-6 h-auto border-2 hover:border-blue-600 hover:text-blue-600 transform hover:scale-105 transition-all duration-300"
                >
                  <Lock className="mr-3 h-5 w-5" /> Change Password
                </Button>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-semibold text-red-500">Danger Zone</h3>
                <Button 
                  variant="destructive" 
                  onClick={() => setIsDeleteAccountModalOpen(true)} 
                  className="w-full md:w-auto text-lg px-8 py-6 h-auto transform hover:scale-105 transition-all duration-300"
                >
                  <AlertTriangle className="mr-3 h-5 w-5" /> Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preferences">
        <Card className="border-0 shadow-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl transform transition-all duration-500 hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">Preferences</CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-400">Customize your application experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">Theme Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant={theme === "light" ? "default" : "outline"} 
                  onClick={() => setTheme("light")}
                  className="text-lg px-6 py-8 h-auto transform hover:scale-105 transition-all duration-300"
                >
                  <Sun className="mr-3 h-5 w-5" /> Light Mode
                </Button>
                <Button 
                  variant={theme === "dark" ? "default" : "outline"} 
                  onClick={() => setTheme("dark")}
                  className="text-lg px-6 py-8 h-auto transform hover:scale-105 transition-all duration-300"
                >
                  <Moon className="mr-3 h-5 w-5" /> Dark Mode
                </Button>
                <Button 
                  variant={theme === "system" ? "default" : "outline"} 
                  onClick={() => setTheme("system")}
                  className="text-lg px-6 py-8 h-auto transform hover:scale-105 transition-all duration-300"
                >
                  <Laptop className="mr-3 h-5 w-5" /> System Default
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
