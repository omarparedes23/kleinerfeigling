import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Global Responsive Navbar */}
      <Navbar />

      {/* Content */}
      <main className="flex-1 w-full">{children}</main>

      {/* Global Responsive Footer */}
      <Footer />

      {/* Botón flotante de voz con estética "Green Lemon" y redirección con auto-activación */}
      <div className="fixed bottom-6 right-6 z-40 group">
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-lime-400 to-purple-500 opacity-40 blur group-hover:opacity-80 transition duration-500 animate-pulse" />
        <Link href="/chat?voice=true">
          <Button
            size="icon"
            className="relative h-14 w-14 rounded-full bg-lime-400 text-neutral-950 shadow-xl hover:bg-lime-300 hover:scale-108 active:scale-95 transition-all duration-300 border-none cursor-pointer"
          >
            <Mic className="h-6 w-6" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
