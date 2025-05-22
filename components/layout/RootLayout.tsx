import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface RootLayoutProps {
  children: ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-2">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
