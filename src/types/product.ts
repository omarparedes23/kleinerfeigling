import type { Database as DB } from "./database";

export type Database = DB;

// Tipos públicos para usar en la aplicación
export type Profile = DB["public"]["Tables"]["kleiner_profiles"]["Row"];
export type Product = DB["public"]["Tables"]["kleiner_products"]["Row"];
export type Order = DB["public"]["Tables"]["kleiner_orders"]["Row"];
export type OrderItem = DB["public"]["Tables"]["kleiner_order_items"]["Row"];
export type Distrito = DB["public"]["Tables"]["kleiner_distritos"]["Row"];
export type Category = DB["public"]["Tables"]["kleiner_categories"]["Row"];
export type ChatLog = DB["public"]["Tables"]["kleiner_chat_logs"]["Row"];
export type CartSession = DB["public"]["Tables"]["kleiner_cart_sessions"]["Row"];

// Tipos compuestos
export interface ProductWithCategory extends Product {
  categoria?: Category | null;
}

export interface OrderWithItems extends Order {
  items?: OrderItem[];
  distrito?: Distrito;
}

export interface FlavorTheme {
  border: string;
  glow: string;
  text: string;
  bg: string;
  gradient: string;
  accentBg: string;
  badge: string;
}

export const FLAVOR_THEMES: Record<string, FlavorTheme> = {
  original: {
    border: "border-amber-500/25 hover:border-amber-400/60",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.10)] hover:shadow-[0_0_35px_rgba(245,158,11,0.22)]",
    text: "text-amber-400",
    bg: "bg-amber-950/20",
    gradient: "from-amber-600/15 to-yellow-600/15",
    accentBg: "bg-amber-500 hover:bg-amber-400 text-black font-semibold transition-all duration-300",
    badge: "border-amber-500/25 text-amber-400/90 bg-amber-950/30",
  },
  "green-lemon": {
    border: "border-emerald-600/20 hover:border-emerald-500/50",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.08)] hover:shadow-[0_0_30px_rgba(16,185,129,0.18)]",
    text: "text-emerald-400",
    bg: "bg-emerald-950/20",
    gradient: "from-emerald-700/15 to-teal-700/15",
    accentBg: "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all duration-300",
    badge: "border-emerald-600/25 text-emerald-400/90 bg-emerald-950/30",
  },
  "red-berry-sour": {
    border: "border-rose-600/20 hover:border-rose-500/50",
    glow: "shadow-[0_0_20px_rgba(225,29,72,0.08)] hover:shadow-[0_0_30px_rgba(225,29,72,0.18)]",
    text: "text-rose-400",
    bg: "bg-rose-950/20",
    gradient: "from-rose-700/15 to-red-800/15",
    accentBg: "bg-rose-700 hover:bg-rose-600 text-white font-semibold transition-all duration-300",
    badge: "border-rose-600/25 text-rose-400/90 bg-rose-950/30",
  },
  "coco-biscuit": {
    border: "border-yellow-600/20 hover:border-yellow-500/50",
    glow: "shadow-[0_0_20px_rgba(202,138,4,0.08)] hover:shadow-[0_0_30px_rgba(202,138,4,0.18)]",
    text: "text-yellow-500",
    bg: "bg-yellow-950/20",
    gradient: "from-yellow-700/15 to-amber-800/15",
    accentBg: "bg-yellow-600 hover:bg-yellow-500 text-black font-semibold transition-all duration-300",
    badge: "border-yellow-600/25 text-yellow-500/90 bg-yellow-950/30",
  },
  cherrie: {
    border: "border-red-700/20 hover:border-red-600/50",
    glow: "shadow-[0_0_20px_rgba(185,28,28,0.08)] hover:shadow-[0_0_30px_rgba(185,28,28,0.18)]",
    text: "text-red-400",
    bg: "bg-red-950/20",
    gradient: "from-red-800/15 to-rose-900/15",
    accentBg: "bg-red-700 hover:bg-red-600 text-white font-semibold transition-all duration-300",
    badge: "border-red-700/25 text-red-400/90 bg-red-950/30",
  },
};

export function getFlavorTheme(sabor: string | null | undefined): FlavorTheme {
  if (!sabor) return FLAVOR_THEMES.original;
  
  const normalized = sabor.toLowerCase().trim();
  if (normalized.includes("lemon") || normalized.includes("limon") || normalized === "green-lemon") {
    return FLAVOR_THEMES["green-lemon"];
  }
  if (normalized.includes("berry") || normalized.includes("sour") || normalized === "red-berry-sour") {
    return FLAVOR_THEMES["red-berry-sour"];
  }
  if (normalized.includes("coco") || normalized.includes("biscuit") || normalized === "coco-biscuit") {
    return FLAVOR_THEMES["coco-biscuit"];
  }
  if (normalized.includes("cherrie") || normalized.includes("cereza") || normalized === "cherrie") {
    return FLAVOR_THEMES.cherrie;
  }
  return FLAVOR_THEMES.original;
}

