"use client";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChatPage = pathname === "/chat";

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Global Responsive Navbar */}
      <Navbar />

      {/* Content */}
      <main className="flex-1 w-full">{children}</main>

      {/* Global Responsive Footer (hidden on chat page to lock viewport) */}
      {!isChatPage && <Footer />}

      {/* Botón flotante de voz con estética "Green Lemon" (hidden on chat page since it has its own) */}
      {!isChatPage && (
        <div className="fixed bottom-6 right-6 z-40 group">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-purple-500 opacity-40 blur group-hover:opacity-80 transition duration-500 animate-pulse" />
          <Link href="/chat?voice=true">
            <Button
              size="icon"
              className="relative h-14 w-14 md:h-18 md:w-18 rounded-full bg-amber-400 text-neutral-950 shadow-xl hover:bg-amber-300 hover:scale-108 active:scale-95 transition-all duration-300 border-none cursor-pointer flex items-center justify-center"
            >
              <Mic className="h-6 w-6 md:h-8 md:w-8 shrink-0" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
