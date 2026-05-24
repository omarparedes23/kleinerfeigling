"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Menu,
  ShoppingBag,
  User,
  LogOut,
  UserCircle,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useCart } from "@/hooks/use-cart";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { usePwaInstall } from "@/hooks/use-pwa-install";


export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);


  const supabase = createClient();
  const totalItems = useCart((state) => state.getTotalItems());
  const { isInstallable, installApp } = usePwaInstall();

  const handleInstallClick = async () => {
    const result = await installApp();
    if (result === "accepted") {
      toast.success("🎉 ¡Instalación iniciada con éxito!");
    } else if (result === "dismissed") {
      toast.info("Instalación cancelada. Puedes instalar la aplicación en cualquier momento desde el menú.");
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Obtener sesión actual
    async function getUser() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);
      } catch (err) {
        console.error("Error getting user session in Navbar:", err);
      } finally {
        setLoading(false);
      }
    }
    getUser();

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          toast.error(error.message);
          return;
        }
        toast.success("Sesión cerrada correctamente");
        router.push("/");
        router.refresh();
      } catch (err) {
        console.error("Error signing out:", err);
        toast.error("Error al cerrar sesión");
      }
    });
  };

  const navLinks = [
    { name: "Inicio", href: "/" },
    { name: "Productos", href: "/productos" },
    { name: "Cocteles", href: "/#cocteles" },
    { name: "Kleiner Bot 🥂", href: "/chat" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-900 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xs font-black tracking-[0.22em] text-white uppercase flex items-center transition-opacity hover:opacity-90">
            KLEINER<span className="text-amber-400 font-serif italic capitalize tracking-normal font-semibold ml-1.5 text-sm">Feigling</span>
          </Link>
          
          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-semibold tracking-wide transition-colors hover:text-amber-400 ${
                  pathname === link.href ? "text-amber-400" : "text-neutral-400"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop User & Cart Actions */}
        <div className="hidden md:flex items-center gap-4">
          {isInstallable && (
            <button
              onClick={handleInstallClick}
              className="border border-amber-400/20 bg-amber-950/20 px-3 h-9 text-xs font-bold text-amber-400 hover:bg-amber-400 hover:text-black transition-all shadow-[0_0_10px_rgba(163,230,53,0.1)] cursor-pointer rounded-full"
            >
              Instalar App 📱
            </button>
          )}

          <button 
            onClick={() => setIsCartOpen(true)} 
            className="relative p-2 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer bg-transparent border-none"
          >
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-neutral-950">
              {mounted ? totalItems : 0}
            </span>
          </button>


          {loading ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-neutral-800" />
          ) : user ? (
            <div className="relative group flex items-center gap-2">
              <Link
                href="/perfil"
                className="flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-950 px-3 h-9 text-xs font-semibold text-neutral-300 hover:border-amber-400/50 hover:text-white transition-all"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-neutral-950 font-black">
                  {user.email?.[0].toUpperCase() ?? "U"}
                </div>
                <span className="max-w-[100px] truncate">
                  {user.user_metadata?.nombre || user.email?.split("@")[0]}
                </span>
              </Link>

              {/* Dropdown Menu al Hover */}
              <div className="absolute right-0 top-full pt-2 hidden group-hover:block w-48 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-2 shadow-2xl">
                  <Link
                    href="/perfil"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-900 hover:text-white"
                  >
                    <UserCircle className="h-4 w-4" />
                    Mi Perfil
                  </Link>
                  <Link
                    href="/pedidos"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-neutral-900 hover:text-white"
                  >
                    <Package className="h-4 w-4" />
                    Mis Pedidos
                  </Link>
                  <div className="my-1 border-t border-neutral-900" />
                  <button
                    onClick={handleSignOut}
                    disabled={isPending}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-full bg-amber-400 px-4 h-9 text-xs font-bold text-neutral-950 hover:bg-amber-300 shadow-md shadow-amber-400/15 hover:shadow-amber-400/25 transition-all cursor-pointer"
            >
              <User className="h-3.5 w-3.5" />
              Ingresar
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Trigger & Cart */}
        <div className="flex items-center gap-2 md:hidden">
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="relative p-2 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer bg-transparent border-none"
          >
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] font-black text-neutral-950">
              {mounted ? totalItems : 0}
            </span>
          </button>



          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-neutral-400 hover:text-amber-400 hover:bg-neutral-900"
                />
              }
            >
              <Menu className="h-6 w-6" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px] border-l border-neutral-900 bg-neutral-950 p-6 text-white"
            >
              <SheetHeader className="text-left pb-4 border-b border-neutral-900 mb-6">
                <SheetTitle className="text-xs font-black tracking-[0.22em] text-white uppercase flex items-center">
                  KLEINER<span className="text-amber-400 font-serif italic capitalize tracking-normal font-semibold ml-1.5 text-sm">Feigling</span>
                </SheetTitle>
                <span className="text-[9px] uppercase font-medium tracking-[0.2em] text-neutral-600 mt-1 block">
                  Licores Premium · Lima, Perú
                </span>
              </SheetHeader>

              {isInstallable && (
                <div className="mb-6">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      handleInstallClick();
                    }}
                    className="w-full border border-amber-400/20 bg-amber-950/20 px-3 h-11 text-xs font-bold text-amber-400 hover:bg-amber-400 hover:text-black transition-all shadow-[0_0_10px_rgba(163,230,53,0.1)] cursor-pointer rounded-xl flex items-center justify-center gap-2"
                  >
                    Instalar App 📱
                  </button>
                </div>
              )}

              {/* Navigation Links */}
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-base font-bold tracking-wide transition-colors hover:text-amber-400 ${
                      pathname === link.href ? "text-amber-400" : "text-neutral-300"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>

              <div className="my-6 border-t border-neutral-900" />

              {/* User Section */}
              <div className="flex flex-col gap-4">
                {loading ? (
                  <div className="h-10 w-full animate-pulse rounded-xl bg-neutral-900" />
                ) : user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/50 border border-neutral-900">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-neutral-950 font-black">
                        {user.email?.[0].toUpperCase() ?? "U"}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">
                          {user.user_metadata?.nombre || user.email?.split("@")[0]}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link
                        href="/perfil"
                        onClick={() => setIsOpen(false)}
                        className="flex w-full items-center gap-3 rounded-xl px-4 h-11 text-sm font-bold text-neutral-300 hover:bg-neutral-900 hover:text-white transition-all"
                      >
                        <UserCircle className="h-5 w-5 text-amber-400" />
                        Mi Perfil
                      </Link>
                      <Link
                        href="/pedidos"
                        onClick={() => setIsOpen(false)}
                        className="flex w-full items-center gap-3 rounded-xl px-4 h-11 text-sm font-bold text-neutral-300 hover:bg-neutral-900 hover:text-white transition-all"
                      >
                        <Package className="h-5 w-5 text-amber-400" />
                        Mis Pedidos
                      </Link>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          handleSignOut();
                        }}
                        disabled={isPending}
                        className="flex w-full items-center gap-3 rounded-xl px-4 h-11 text-sm font-bold text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-all text-left mt-2"
                      >
                        <LogOut className="h-5 w-5" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 h-11 text-sm font-black text-neutral-950 hover:bg-amber-300 shadow-md shadow-amber-400/10 transition-all"
                  >
                    <User className="h-4 w-4" />
                    Iniciar Sesión
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />
    </header>
  );
}

