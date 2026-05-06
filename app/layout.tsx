import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastProvider from "@/app/components/ToastProvider";
import Navbar from "@/app/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://crosshairbase.gg"),
  title: "CrosshairBase — Pro Valorant Crosshairs",
  description: "Browse and copy crosshair codes from the world's best Valorant pro players. Live editor lets you customise and share any crosshair.",
  keywords: ["Valorant", "crosshair", "crosshair codes", "pro crosshairs", "crosshair editor"],
  openGraph: {
    type: "website",
    siteName: "CrosshairBase",
    title: "CrosshairBase — Pro Valorant Crosshairs",
    description: "Browse pro Valorant crosshair codes, tweak them live, and share your custom settings with a single link.",
    url: "https://crosshairbase.gg",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CrosshairBase — Pro Valorant Crosshairs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CrosshairBase — Pro Valorant Crosshairs",
    description: "Browse pro Valorant crosshair codes, tweak them live, and share your custom settings with a single link.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <Navbar />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
