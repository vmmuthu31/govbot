"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { DelegateButton } from "../polkadot/DelegateButton";
import { NetworkSelector } from "../ui/network-selector";
import { useNetwork } from "@/lib/network-context";
import dynamic from "next/dynamic";
const WalletConnect = dynamic(
  () => import("../wallet/WalletConnect").then((mod) => mod.WalletConnect),
  {
    ssr: false,
  }
);
export function Header() {
  const { networkConfig } = useNetwork();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="mr-6 flex items-center space-x-2 group">
              <div className="relative">
                <Bot className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  GovBot
                </span>
                <div className="text-xs text-muted-foreground -mt-1">
                  AI Governance Assistant
                </div>
              </div>
            </Link>
            <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
              <Link
                href="/about"
                className="transition-colors hover:text-foreground/80 text-foreground/60 hover:text-primary"
              >
                About
              </Link>
              <a
                href={networkConfig.polkassemblyUrl}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground/80 text-foreground/60 hover:text-primary flex items-center gap-1"
              >
                Polkassembly
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <NetworkSelector />
            <DelegateButton />
            <WalletConnect />
          </div>
        </div>
      </div>
    </header>
  );
}
