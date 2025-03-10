import "./globals.css";
import { Inter } from "next/font/google";
import { IssueProvider } from "@/context/IssueContext";
import Navbar from "@/components/community/navbar/Navbar";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Blog App",
    description: "The best blog app!",
};

export default function RootLayout({ children }) {
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
