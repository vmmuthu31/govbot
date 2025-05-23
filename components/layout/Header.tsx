"use client";

import Link from "next/link";
import { Bot } from "lucide-react";
import { DelegateButton } from "../polkadot/DelegateButton";
import dynamic from "next/dynamic";
const WalletConnect = dynamic(
  () => import("../wallet/WalletConnect").then((mod) => mod.WalletConnect),
  {
    ssr: false,
  }
);
export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="hidden font-bold sm:inline-block">GovBot</span>
            </Link>
            <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
              <Link
                href="/"
                className="transition-colors hover:text-foreground/80 text-foreground"
              >
                Proposals
              </Link>
              <Link
                href="/about"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                About
              </Link>
              <a
                href="https://polkadot.polkassembly.io"
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Polkassembly
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <DelegateButton />

            <Link href="/" className="md:hidden">
              <Bot className="h-6 w-6 text-primary" />
            </Link>

            <WalletConnect />
          </div>
        </div>
      </div>
    </header>
  );
}
