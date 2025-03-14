"use client";

import "./globals.css";
import { Inter } from "next/font/google";
import { IssueProvider } from "@/context/IssueContext";
import Navbar from "@/components/community/navbar/Navbar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useAuth from "@/lib/useAuth";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        // Only run this check on the client side and after auth state is determined
        if (isClient && !loading && !isAuthenticated) {
            router.push("/login?redirect=/community");
        }
    }, [isClient, isAuthenticated, loading, router]);

    // Show loading state while checking authentication
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

    // Show content only if authenticated
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="container">
                    <div className="wrapper">
                        <IssueProvider>
                            <Navbar />
                            {children}
                            {/* <Footer /> */}
                        </IssueProvider>
                    </div>
                </div>
            </body>
        </html>
    );
}
