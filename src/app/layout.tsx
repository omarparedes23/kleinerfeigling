import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Outfit } from "next/font/google";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/components/cart/cart-provider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});


export const metadata: Metadata = {
  title: {
    default: "Kleiner Feigling Perú",
    template: "%s | Kleiner Feigling",
  },
  description:
    "Compra Kleiner Feigling con IA. Delivery en Lima. Paga con Yape, Plin o tarjeta.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KF Perú",
  },
  icons: {
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={cn("antialiased", "font-sans", outfit.variable)}>
      <body className="min-h-dvh bg-background text-foreground relative overflow-x-hidden">
        {/* Floating Nightclub Spotlights background */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-lime-400/8 blur-[120px] animate-spot-slow" />
          <div className="absolute bottom-[20%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-indigo-500/8 blur-[100px] animate-spot-fast" />
          <div className="absolute top-[40%] left-[30%] w-[35vw] h-[35vw] rounded-full bg-pink-500/6 blur-[110px] animate-spot-slow" />
        </div>

        <div className="relative z-10 flex flex-col min-h-dvh">
          <CartProvider>
            {children}
          </CartProvider>
        </div>
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}

