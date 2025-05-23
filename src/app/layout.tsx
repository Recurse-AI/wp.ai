import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const runtime = 'edge';

export const metadata: Metadata = {
  title: "WordPress Agent",
  description: "WordPress Agent for AI-assisted WordPress development"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} flex flex-col h-full bg-white dark:bg-gray-900 text-black dark:text-white`} suppressHydrationWarning>
        <div className="flex flex-col flex-1 h-full">
          <ClientLayout>{children}</ClientLayout>
        </div>
      </body>
    </html>
  );
}
