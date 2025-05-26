import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { NetworkProvider } from "@/lib/network-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GovBot - AI Governance for Polkadot OpenGov",
  description: "AI-powered governance agent for Polkadot's OpenGov system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <NetworkProvider>
          <main className="min-h-screen bg-background">{children}</main>
          <Toaster position="top-right" />
        </NetworkProvider>
      </body>
    </html>
  );
}
