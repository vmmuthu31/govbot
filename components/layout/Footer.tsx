import Link from "next/link";
import { Bot } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="flex flex-col space-y-3">
            <Link href="/" className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-bold">GovBot</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              An AI-powered governance agent for Polkadot&apos;s OpenGov system.
            </p>
          </div>
          <div className="flex flex-col space-y-3">
            <h3 className="font-medium">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://polkadot.network/features/governance/"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-foreground/80 text-muted-foreground"
                >
                  OpenGov Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://polkadot.polkassembly.io"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-foreground/80 text-muted-foreground"
                >
                  Polkassembly
                </a>
              </li>
              <li>
                <a
                  href="https://polkadot.network"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-foreground/80 text-muted-foreground"
                >
                  Polkadot Network
                </a>
              </li>
            </ul>
          </div>
          <div className="flex flex-col space-y-3">
            <h3 className="font-medium">GovBot</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-foreground/80 text-muted-foreground"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="transition-colors hover:text-foreground/80 text-muted-foreground"
                >
                  Proposals
                </Link>
              </li>
            </ul>
          </div>
          <div className="flex flex-col space-y-3">
            <h3 className="font-medium">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-foreground/80 text-muted-foreground"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-foreground/80 text-muted-foreground"
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} GovBot. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
