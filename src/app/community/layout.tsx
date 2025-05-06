"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { IssueProvider } from "@/context/IssueContext";
import Navbar from "@/components/community/navbar/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useAuth from "@/lib/useAuth";
import { useTheme } from "@/context/ThemeProvider";
const inter = Inter({ subsets: ["latin"] });

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [isClient, setIsClient] = useState(false);
    const { theme } = useTheme();
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && !loading && !isAuthenticated) {
            router.push("/signin?redirect=/community");
        }
    }, [isClient, isAuthenticated, loading, router]);

    if (loading || !isClient || !isAuthenticated) {
        return (
            <div className={`container ${theme === "dark" ? "dark" : "light"}`}>
                <div className="wrapper">
                    <div className="loading-auth">
                        <div className="loading-spinner"></div>
                        <p>Checking authentication...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
            <body className={`${inter.className} ${theme === "dark" ? "dark" : "light"}`}>
                <div className="container">
                    <div className="wrapper">
                       
                            <IssueProvider>
                                <Navbar />
                                {children}
                            </IssueProvider>
                    </div>
                </div>
            </body>
    );
} 