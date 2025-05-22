import Link from "next/link";
import { Bot, ChevronRight } from "lucide-react";
import { DelegateButton } from "../polkadot/DelegateButton";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
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

          <Link
            href="/"
            className="hidden md:inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            View Proposals
            <ChevronRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
