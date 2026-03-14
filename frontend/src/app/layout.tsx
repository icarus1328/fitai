import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FitAI — Your AI-Powered Fitness Coach",
  description: "Track workouts, monitor progress, and get intelligent AI-powered workout recommendations to crush your fitness goals.",
  keywords: ["fitness tracker", "AI coach", "workout log", "strength training", "calorie tracking"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#030712",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-inter antialiased bg-gray-950`}>
        {children}
      </body>
    </html>
  );
}
