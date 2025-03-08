"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { LogOut, Archive, Trash2 } from "lucide-react";
import { useTheme } from "@/context/ThemeProvider";

// Define default settings data
const DEFAULT_SETTINGS_DATA = [
  { id: "general", label: "General" },
  { id: "Account", label: "Account" },
  { id: "language", label: "Language" },
  { id: "data", label: "Data" },
  { id: "security", label: "Security" },
  { id: "subscription", label: "Subscription" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [settingsData, setSettingsData] = useState(DEFAULT_SETTINGS_DATA);
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState("english");
  const [codeDataAnalyst, setCodeDataAnalyst] = useState(false);

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

  return (
    <div className={`flex w-full min-h-screen bg-background text-foreground`}>
      {/* Sidebar Navigation */}
      <aside className="w-auto border-r p-4 bg-background sticky top-0 h-screen overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-col w-full space-y-2 bg-transparent h-auto">
            {settingsData.map((item) => (
              <TabsTrigger
                key={item["id"]}
                value={item["id"]}
                className="w-full text-left justify-start p-2 rounded-md hover:bg-muted data-[state=active]:bg-muted"
              >
                {item["label"]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </aside>

      {/* Content Area */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {settingsData.map((item) => (
              <TabsContent
                key={item["id"]}
                value={item["id"]}
                className="w-full"
              >
                <Card>
                  <CardContent className="space-y-4 p-6">
                    {item["id"] === "general" && (
                      <>
                        <div className="flex justify-between items-center">
                          <Label>Theme</Label>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="capitalize">
                                {theme === "system" ? "Default" : theme}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setTheme("system")}
                              >
                                Default
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setTheme("dark")}
                              >
                                Dark
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setTheme("light")}
                              >
                                Light
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex justify-between items-center">
                          <Label>
                            Always show code when using data analyst
                          </Label>
                          <Switch
                            checked={codeDataAnalyst}
                            onCheckedChange={(checked) =>
                              setCodeDataAnalyst(checked)
                            }
                          />
                        </div>
                      </>
                    )}
                    {item["id"] === "Account" && (
                      <p>Manage Account preferences here.</p>
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
                    {item["id"] === "data" && (
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
                      <p>Security settings go here.</p>
                    )}
                    {item["id"] === "subscription" && (
                      <p>Manage your subscription here.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
          {/* Logout Button */}
          <div className="mt-6 flex justify-end">
            <Button variant="destructive" className="flex items-center gap-2">
              <LogOut size={16} /> Log Out
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
