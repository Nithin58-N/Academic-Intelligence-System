import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Academic AI - Offline Multilingual Assistant",
  description:
    "AI-powered academic assistant for engineering students. Supports Kannada, Hindi, and English.",
  keywords: ["academic", "AI", "engineering", "multilingual", "offline", "study"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans animated-bg min-h-screen">
        {/* Background orbs */}
        <div className="orb orb-1" aria-hidden="true" />
        <div className="orb orb-2" aria-hidden="true" />
        <div className="orb orb-3" aria-hidden="true" />

        {/* Main content */}
        <div className="relative z-10">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
