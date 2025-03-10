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
  const [fontSize, setFontSize] = useState("medium");
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
      <div className="py-4 px-1 bg-background overflow-y-auto mx-0">
        <div className="w-full">
          <div className="flex flex-col w-full space-y-2 bg-transparent h-auto">
            {settingsData.map((item) => (
              <div
                key={item["id"]}
                onClick={() => setActiveTab(item["id"])}
                className={`w-full text-left justify-start p-2 rounded-md hover:bg-muted cursor-pointer ml-0 text-base ${
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
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 p-6 overflow-y-auto">
          {settingsData.map((item) => (
            <div
              key={item["id"]}
              className={`w-full h-full ${
                activeTab === item["id"] ? "" : "hidden"
              }`}
            >
              <Card className="w-full h-full border-0 shadow-none">
                <CardContent className="h-full p-6 text-lg">
                  {item["id"] === "general" && (
                    <div className="space-y-6">
                      {/* Theme Toggle */}
                      <div className="flex justify-between items-center w-full">
                        <Label className="text-base">Theme</Label>
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

                      {/* Always Show Code Toggle */}
                      <div className="flex justify-between items-center w-full">
                        <Label className="text-base">
                          Always show code when using data analyst
                        </Label>
                        <Switch
                          checked={codeDataAnalyst}
                          onCheckedChange={(checked) =>
                            setCodeDataAnalyst(checked)
                          }
                        />
                      </div>

                      {/* Font Size */}
                      <div className="flex justify-between items-center w-full">
                        <Label className="text-base">Font Size</Label>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setFontSize("small")}
                            variant={
                              fontSize === "small" ? "default" : "outline"
                            }
                            className="min-w-[80px]"
                          >
                            Small
                          </Button>
                          <Button
                            onClick={() => setFontSize("medium")}
                            variant={
                              fontSize === "medium" ? "default" : "outline"
                            }
                            className="min-w-[80px]"
                          >
                            Medium
                          </Button>
                          <Button
                            onClick={() => setFontSize("large")}
                            variant={
                              fontSize === "large" ? "default" : "outline"
                            }
                            className="min-w-[80px]"
                          >
                            Large
                          </Button>
                        </div>
                      </div>

                      {/* Reduce Motion */}
                      {/* <div className="flex justify-between items-center w-full">
                        <Label>Reduce Motion</Label>
                        <Switch
                          checked={reduceMotion}
                          onCheckedChange={(checked) =>
                            setReduceMotion(checked)
                          }
                        />
                      </div> */}

                      {/* Sidebar Position */}
                      {/* <div className="flex justify-between items-center w-full">
                        <Label>Sidebar Position</Label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSidebarPosition("left")}
                            className={`p-2 rounded-md ${
                              sidebarPosition === "left"
                                ? "bg-blue-100 dark:bg-blue-800"
                                : "bg-gray-100 dark:bg-gray-700"
                            }`}
                          >
                            Left
                          </button>
                          <button
                            onClick={() => setSidebarPosition("right")}
                            className={`p-2 rounded-md ${
                              sidebarPosition === "right"
                                ? "bg-blue-100 dark:bg-blue-800"
                                : "bg-gray-100 dark:bg-gray-700"
                            }`}
                          >
                            Right
                          </button>
                        </div>
                      </div> */}
                    </div>
                  )}

                  {item["id"] === "Account" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-foreground text-center">
                        Account Details
                      </h2>

                      <div className="grid grid-cols-2 gap-4 text-base">
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-muted-foreground font-medium">
                            Name
                          </p>
                          <p className="mt-1">{user?.name || "Not set"}</p>
                        </div>

                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-muted-foreground font-medium">
                            Email
                          </p>
                          <p className="mt-1 break-all">
                            {user?.email || "Not set"}
                          </p>
                        </div>

                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-muted-foreground font-medium">
                            Account Type
                          </p>
                          <p className="mt-1">
                            {user?.accountType || "Standard"}
                          </p>
                        </div>

                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-muted-foreground font-medium">
                            Join Date
                          </p>
                          <p className="mt-1">
                            {user?.joinDate
                              ? new Date(user.joinDate).toLocaleDateString()
                              : "Not available"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* {item["id"] === "personalization" && (
                      <p>Personalization settings go here.</p>
                    )} */}
                  {item["id"] === "language" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-foreground text-center">
                        Language Settings
                      </h2>

                      <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                        <Label className="text-base font-medium">
                          Select Language
                        </Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="capitalize text-base min-w-[120px]"
                            >
                              {language}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-[120px]"
                          >
                            <DropdownMenuItem
                              onClick={() => setLanguage("english")}
                              className="text-base cursor-pointer"
                            >
                              English
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setLanguage("spanish")}
                              className="text-base cursor-pointer"
                            >
                              Español
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setLanguage("french")}
                              className="text-base cursor-pointer"
                            >
                              Français
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setLanguage("german")}
                              className="text-base cursor-pointer"
                            >
                              Deutsch
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="text-sm text-muted-foreground text-center">
                        Changes will be applied immediately across your account
                      </div>
                    </div>
                  )}
                  {item["id"] === "chats" && (
                    <div className="space-y-6">
                      <h2 className="text-xl font-semibold text-foreground text-center">
                        Chat Management
                      </h2>

                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex flex-col space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <Label className="text-base font-medium">
                                Delete all chats
                              </Label>
                              <p className="text-sm text-muted-foreground">
                                This will permanently remove all your chat
                                history
                              </p>
                            </div>
                            <Button
                              variant="destructive"
                              className="flex items-center gap-2 text-base"
                              onClick={handleDeleteAllChats}
                            >
                              <Trash2 size={18} /> Delete All
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Note: This action cannot be undone. All your chat
                          history will be permanently deleted.
                        </p>
                      </div>
                    </div>
                  )}
                  {item["id"] === "security" && (
                    <div className="w-full space-y-4">
                      <div className="max-w-xl mx-auto p-4 bg-background rounded-lg space-y-6">
                        <h2 className="text-center font-medium text-lg text-gray-800 dark:text-gray-200 mb-4">
                          Security Settings
                        </h2>

                        {/* MFA Section */}
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              Multi-factor authentication
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Require an extra security challenge when logging
                              in. If you are unable to pass this challenge, you
                              will have the option to recover your account via
                              email.
                            </p>
                          </div>
                          <Button variant="outline" className="shrink-0">
                            Enable
                          </Button>
                        </div>

                        {/* Logout Section */}
                        <div className="flex justify-between items-start gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="space-y-1 flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              Log out of all devices
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Log out of all active sessions across all devices,
                              including your current session. It may take up to
                              30 minutes for other devices to be logged out.
                            </p>
                          </div>
                          <Button variant="destructive" className="shrink-0">
                            Log out all
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {item["id"] === "subscription" && (
                    <div className="w-full space-y-4">
                      <div className="max-w-xl mx-auto p-4 bg-background rounded-lg">
                        <div className="space-y-4">
                          <h2 className="text-center font-medium text-lg text-gray-800 dark:text-gray-200">
                            Current Subscription
                          </h2>

                          <div className="p-4 border rounded-lg border-blue-200 dark:border-blue-800 bg-background">
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
