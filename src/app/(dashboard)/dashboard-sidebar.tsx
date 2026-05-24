"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircle, Package, LogOut } from "lucide-react";

interface DashboardSidebarProps {
  userInitial: string;
  fullName: string;
  email: string;
  onSignOut: () => Promise<void>;
}

export function DashboardSidebar({
  userInitial,
  fullName,
  email,
  onSignOut,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      name: "Mi Perfil",
      href: "/perfil",
      icon: UserCircle,
    },
    {
      name: "Mis Pedidos",
      href: "/pedidos",
      icon: Package,
    },
  ];

  return (
    <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl p-6 space-y-6 shadow-2xl">
      {/* User Information Display */}
      <div className="flex flex-col items-center text-center pb-6 border-b border-neutral-900">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-emerald-400 text-neutral-950 text-2xl font-black shadow-lg shadow-amber-400/10 mb-4 animate-pulse">
          {userInitial}
        </div>
        <h2 className="text-lg font-black text-white tracking-wide truncate max-w-full">
          {fullName}
        </h2>
        <p className="text-xs text-neutral-500 truncate max-w-full mt-0.5">
          {email}
        </p>
      </div>

      {/* Tabs Navigation */}
      <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 justify-center lg:justify-start">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                isActive
                  ? "bg-gradient-to-r from-amber-400/20 to-emerald-400/10 border border-amber-400/30 text-amber-400 shadow-[0_0_15px_rgba(163,230,53,0.15)]"
                  : "border border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/50"
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${isActive ? "text-amber-400" : "text-neutral-500"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out Button Container */}
      <div className="pt-4 border-t border-neutral-900 flex lg:block justify-center">
        <form action={onSignOut} className="w-full">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-950/40 bg-rose-950/10 hover:bg-rose-950/20 px-4 py-3 text-xs font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </div>
  );
}
