import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { twMerge } from "tailwind-merge";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Inline script to handle theme before page load
const themeScript = `
  (function() {
    function applyTheme() {
      const isDark = localStorage.theme === 'dark' || 
        (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.style.setProperty('color-scheme', 'dark');
        document.documentElement.style.setProperty('background-color', '#0A0F1C');
        document.body.style.setProperty('background-color', '#0A0F1C');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.style.setProperty('color-scheme', 'light');
        document.documentElement.style.setProperty('background-color', '#F8FAFC');
        document.body.style.setProperty('background-color', '#F8FAFC');
      }
    }

    // Apply theme immediately
    applyTheme();

    // Re-apply theme after DOM content loads
    document.addEventListener('DOMContentLoaded', applyTheme);

    // Watch for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  })()
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={twMerge(
          `${geistSans.variable} ${geistMono.variable} theme-transition overflow-x-hidden relative w-full bg-[#F8FAFC] dark:bg-[#0A0F1C] text-gray-900 dark:text-white`
        )}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
