import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { Outfit, Cormorant_Garamond } from "next/font/google";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/components/cart/cart-provider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
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
    <html lang="es" className={cn("antialiased", "font-sans", outfit.variable, cormorant.variable)}>
      <body className="min-h-dvh bg-background text-foreground relative overflow-x-hidden">
        {/* Subtle luxury ambient */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-[50vw] h-[60vh] rounded-full bg-amber-500/4 blur-[140px]" />
          <div className="absolute bottom-0 left-0 w-[40vw] h-[40vh] rounded-full bg-amber-700/3 blur-[120px]" />
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

