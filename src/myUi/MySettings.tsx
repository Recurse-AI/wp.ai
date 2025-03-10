"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { LogOut, Trash2 } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";
import { FaDesktop, FaMoon, FaSun } from "react-icons/fa";
import { getUser } from "@/utils/getUser";
import { usePathname, useRouter } from "next/navigation";

// Define default settings data
const DEFAULT_SETTINGS_DATA = [
  { id: "general", label: "General" },
  { id: "Account", label: "Account" },
  { id: "language", label: "Language" },
  { id: "data", label: "Data" },
  { id: "security", label: "Security" },
  { id: "subscription", label: "Subscription" },
];

interface UserData {
  name: string;
  username: string;
  email: string;
  image: string;
  profile_picture: string;
  accountType?: string;
  joinDate?: string;
  subscriptionPlan?: string;
  subscriptionEndDate?: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [settingsData, setSettingsData] = useState(DEFAULT_SETTINGS_DATA);
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState("english");
  const [codeDataAnalyst, setCodeDataAnalyst] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<UserData>({
    name: "Guest User",
    username: "guest_user",
    email: "guest@example.com",
    image:
      "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=",
    profile_picture:
      "https://media.istockphoto.com/id/2149530993/photo/digital-human-head-concept-for-ai-metaverse-and-facial-recognition-technology.jpg?s=1024x1024&w=is&k=20&c=Ob0ACggwWuFDFRgIc-SM5bLWjNbIyoREeulmLN8dhLs=",
  });

  const handleDeleteAllChats = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete all chats? This action cannot be undone."
      )
    ) {
      try {
        const response = await fetch("/api/chats", {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete chats");
        }

        alert("All chats have been deleted successfully");
      } catch (error) {
        console.error("Failed to delete chats:", error);
        alert("Failed to delete chats. Please try again.");
      }
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/settingsData.json");
        if (!response.ok) {
          throw new Error("Failed to fetch settings data");
        }
        const data = await response.json();
        setSettingsData(data);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    getUser(setIsLoggedIn, setUser, router, pathname);
  }, []);

  return (
    <div className="flex w-full h-full bg-background text-foreground">
      {/* Sidebar Navigation */}
      <div className="border-r py-4 px-1 bg-background overflow-y-auto mx-0">
        <div className="w-full">
          <div className="flex flex-col w-full space-y-2 bg-transparent h-auto">
            {settingsData.map((item) => (
              <div
                key={item["id"]}
                onClick={() => setActiveTab(item["id"])}
                className={`w-full text-left justify-start p-2 rounded-md hover:bg-muted cursor-pointer text-sm ml-0 ${
                  activeTab === item["id"] ? "bg-muted" : ""
                }`}
              >
                {item["label"]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          {settingsData.map((item) => (
            <div
              key={item["id"]}
              className={`w-full h-full ${
                activeTab === item["id"] ? "" : "hidden"
              }`}
            >
              <Card className="w-full h-full">
                <CardContent className="h-full p-6">
                  {item["id"] === "general" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center w-full">
                        <Label>Theme</Label>
                        <div className="px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setTheme("light")}
                              className={`p-2 rounded-full ${
                                theme === "light"
                                  ? "bg-blue-100 dark:bg-blue-800"
                                  : "bg-gray-100 dark:bg-gray-700"
                              }`}
                            >
                              <FaSun className="text-yellow-500 text-sm" />
                            </button>
                            <button
                              onClick={() => setTheme("dark")}
                              className={`p-2 rounded-full ${
                                theme === "dark"
                                  ? "bg-blue-100 dark:bg-blue-900/30"
                                  : "bg-gray-100 dark:bg-gray-700"
                              }`}
                            >
                              <FaMoon className="text-blue-500 text-sm" />
                            </button>
                            <button
                              onClick={() => setTheme("system")}
                              className={`p-2 rounded-full ${
                                theme === "system"
                                  ? "bg-blue-100 dark:bg-blue-900/30"
                                  : "bg-gray-100 dark:bg-gray-700"
                              }`}
                            >
                              <FaDesktop className="text-purple-500 text-sm" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center w-full">
                        <Label>Always show code when using data analyst</Label>
                        <Switch
                          checked={codeDataAnalyst}
                          onCheckedChange={(checked) =>
                            setCodeDataAnalyst(checked)
                          }
                        />
                      </div>
                    </div>
                  )}
                  {item["id"] === "Account" && (
                    <div className="space-y-4">
                      <p className="text-gray-600 dark:text-gray-400 text-center">
                        Account Details.
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-sm break-words">
                        <div className="text-gray-500 dark:text-gray-400">
                          Name
                        </div>
                        <div>{user?.name || "Not set"}</div>

                        <div className="text-gray-500 dark:text-gray-400">
                          Email
                        </div>
                        <div
                          // className="truncate"
                          title={user?.email || "Not set"}
                        >
                          {user?.email || "Not set"}
                        </div>

                        <div className="text-gray-500 dark:text-gray-400">
                          Account Type
                        </div>
                        <div>{user?.accountType || "Standard"}</div>

                        <div className="text-gray-500 dark:text-gray-400">
                          Join Date
                        </div>
                        <div>
                          {user?.joinDate
                            ? new Date(user.joinDate).toLocaleDateString()
                            : "Not available"}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* {item["id"] === "personalization" && (
                      <p>Personalization settings go here.</p>
                    )} */}
                  {item["id"] === "language" && (
                    <div className="flex justify-between items-center">
                      <Label>Select Language</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="capitalize">
                            {language}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setLanguage("english")}
                          >
                            English
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setLanguage("spanish")}
                          >
                            Español
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setLanguage("french")}
                          >
                            Français
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setLanguage("german")}
                          >
                            Deutsch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                  {item["id"] === "chats" && (
                    <>
                      <div className="flex justify-between items-center">
                        <Label>Delete all chats</Label>
                        <Button
                          variant="destructive"
                          className="flex items-center gap-2"
                          onClick={handleDeleteAllChats}
                        >
                          <Trash2 size={16} /> Delete All
                        </Button>
                      </div>
                    </>
                  )}
                  {item["id"] === "security" && (
                    <div className="w-full">
                      <div className="max-w-xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow space-y-6">
                        <h2 className="text-center font-medium text-lg text-gray-800 dark:text-gray-200 mb-4">
                          Security Settings
                        </h2>

                        {/* MFA Section */}
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              Multi-factor authentication
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                              Require an extra security challenge when logging
                              in. If you are unable to pass this challenge, you
                              will have the option to recover your account via
                              email.
                            </p>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                            Enable
                          </button>
                        </div>

                        {/* Logout Section */}
                        <div className="flex justify-between items-start pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="space-y-1">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              Log out of all devices
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                              Log out of all active sessions across all devices,
                              including your current session. It may take up to
                              30 minutes for other devices to be logged out.
                            </p>
                          </div>
                          <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                            Log out all
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {item["id"] === "subscription" && (
                    <div className="w-full">
                      <div className="max-w-xl mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="space-y-4">
                          <h2 className="text-center font-medium text-lg text-gray-800 dark:text-gray-200">
                            Current Subscription
                          </h2>

                          <div className="p-4 border rounded-lg border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                  {user?.subscriptionPlan || "Free Plan"}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {user?.subscriptionPlan
                                    ? "Your subscription will renew on " +
                                      new Date(
                                        user?.subscriptionEndDate
                                      ).toLocaleDateString()
                                    : "Upgrade to access premium features"}
                                </p>
                              </div>
                              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                                {user?.subscriptionPlan
                                  ? "Manage Plan"
                                  : "Upgrade Now"}
                              </button>
                            </div>
                          </div>

                          {/* Features List */}
                          <div className="mt-6">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                              Plan Features
                            </h3>
                            <ul className="space-y-2">
                              <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <svg
                                  className="w-4 h-4 mr-2 text-green-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Basic access to all features
                              </li>
                              <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <svg
                                  className="w-4 h-4 mr-2 text-green-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Community support
                              </li>
                              <li className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                <svg
                                  className="w-4 h-4 mr-2 text-green-500"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                1GB storage space
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
        {/* Logout Button */}
        <div className="p-6 pt-0 flex justify-end flex-shrink-0">
          <Button variant="destructive" className="flex items-center gap-2">
            <LogOut size={16} /> Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
