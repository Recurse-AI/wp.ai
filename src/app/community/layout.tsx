"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { IssueProvider } from "@/context/IssueContext";
import Navbar from "@/components/community/navbar/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useAuth from "@/lib/useAuth";
import { ThemeProvider } from "@/context/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && !loading && !isAuthenticated) {
            router.push("/login?redirect=/community");
        }
    }, [isClient, isAuthenticated, loading, router]);

    if (loading || !isClient || !isAuthenticated) {
        return (
            <html lang="en">
                <body className={inter.className}>
                    <div className="container">
                        <div className="wrapper">
                            <div className="loading-auth">
                                <div className="loading-spinner"></div>
                                <p>Checking authentication...</p>
                            </div>
                        </div>
                    </div>
                </body>
            </html>
        );
    }

    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="container">
                    <div className="wrapper">
                      
                            <IssueProvider>
                                <Navbar />
                                {children}
                            </IssueProvider>
                   
                    </div>
                </div>
            </body>
        </html>
    );
} 