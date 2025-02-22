"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { LogOut, Archive, Trash2 } from "lucide-react";

export default function SettingsPage() {
    const [theme, setTheme] = useState("Dark");
    const [activeTab, setActiveTab] = useState("general");
    const [settingsData, setSettingsData] = useState([]);

    useEffect(() => {
        const fetchSettings = async () => {
          try {
            const response = await fetch("/settingsData.json"); // No "public/" prefix needed
            const data = await response.json();
            setSettingsData(data);
          } catch (error) {
            console.error("Failed to fetch settings:", error);
          }
        };
      
        fetchSettings();
    }, []);
      
    return (
        <div className="flex w-full bg-background text-foreground">
            {/* Sidebar Navigation */}
            <aside className="w-1/4 border-r p-4 bg-background fixed">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="flex flex-col w-full space-y-2">
                        {settingsData.map((item) => (
                            <TabsTrigger
                                key={item["id"]}
                                value={item["id"]}
                                className="w-full text-left p-2 rounded-md hover:bg-muted"
                            >
                                {item["label"]}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </aside>
            
            {/* Content Area */}
            <main className="w-3/4 p-6 max-w-4xl mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    {settingsData.map((item) => (
                        <TabsContent key={item["id"]} value={item["id"]} className="w-full">
                            <Card>
                                <CardContent className="space-y-4 p-6">
                                    {item["id"] === "general" && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <Label>Theme</Label>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="outline">{theme}</Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setTheme("Dark")}>Dark</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setTheme("Light")}>Light</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <Label>Always show code when using data analyst</Label>
                                                <Switch />
                                            </div>
                                        </>
                                    )}
                                    {item["id"] === "notifications" && <p>Manage notification preferences here.</p>}
                                    {item["id"] === "personalization" && <p>Personalization settings go here.</p>}
                                    {item["id"] === "speech" && <p>Speech settings go here.</p>}
                                    {item["id"] === "data" && (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <Label>Archived Chats</Label>
                                                <Button variant="outline" className="flex items-center gap-2">
                                                    <Archive size={16} /> Manage
                                                </Button>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <Label>Archive all chats</Label>
                                                <Button variant="outline" className="flex items-center gap-2">
                                                    <Archive size={16} /> Archive All
                                                </Button>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <Label>Delete all chats</Label>
                                                <Button variant="destructive" className="flex items-center gap-2">
                                                    <Trash2 size={16} /> Delete All
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                    {item["id"] === "security" && <p>Security settings go here.</p>}
                                    {item["id"] === "subscription" && <p>Manage your subscription here.</p>}
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
            </main>
        </div>
    );
}
