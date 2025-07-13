import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AttendanceProvider } from "@/contexts/AttendanceContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Attendify - AI-Powered Attendance Tracker",
  description: "Smart attendance tracker for students to manage and visualize their class-wise attendance",
  manifest: "/manifest.json",
  themeColor: "#3F51B5",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Attendify",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3F51B5" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Attendify" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <AttendanceProvider>
          {children}
        </AttendanceProvider>
      </body>
    </html>
  );
}
