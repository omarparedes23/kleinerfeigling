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
    border: "border-indigo-500/20 hover:border-indigo-400/80 focus:border-indigo-400/80",
    glow: "shadow-[0_0_15px_rgba(99,102,241,0.15)] hover:shadow-[0_0_25px_rgba(99,102,241,0.35)]",
    text: "text-indigo-400",
    bg: "bg-indigo-950/20",
    gradient: "from-indigo-600/20 to-purple-600/20",
    accentBg: "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] text-white font-black transition-all duration-300",
    badge: "border-indigo-500/30 text-indigo-400 bg-indigo-950/40",
  },
  "green-lemon": {
    border: "border-lime-500/20 hover:border-lime-400/80 focus:border-lime-400/80",
    glow: "shadow-[0_0_15px_rgba(132,204,22,0.15)] hover:shadow-[0_0_25px_rgba(132,204,22,0.35)]",
    text: "text-lime-400",
    bg: "bg-lime-950/20",
    gradient: "from-lime-600/20 to-emerald-600/20",
    accentBg: "bg-gradient-to-r from-lime-400 to-emerald-400 hover:from-lime-300 hover:to-emerald-300 hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] text-neutral-950 font-black transition-all duration-300",
    badge: "border-lime-500/30 text-lime-400 bg-lime-950/40",
  },
  "red-berry-sour": {
    border: "border-pink-500/20 hover:border-pink-400/80 focus:border-pink-400/80",
    glow: "shadow-[0_0_15px_rgba(236,72,153,0.15)] hover:shadow-[0_0_25px_rgba(236,72,153,0.35)]",
    text: "text-pink-400",
    bg: "bg-pink-950/20",
    gradient: "from-pink-600/20 to-rose-600/20",
    accentBg: "bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] text-white font-black transition-all duration-300",
    badge: "border-pink-500/30 text-pink-400 bg-pink-950/40",
  },
  "coco-biscuit": {
    border: "border-cyan-500/20 hover:border-cyan-400/80 focus:border-cyan-400/80",
    glow: "shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]",
    text: "text-cyan-400",
    bg: "bg-cyan-950/20",
    gradient: "from-cyan-600/20 to-teal-600/20",
    accentBg: "bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] text-neutral-950 font-black transition-all duration-300",
    badge: "border-cyan-500/30 text-cyan-400 bg-cyan-950/40",
  },
  cherrie: {
    border: "border-red-500/20 hover:border-red-400/80 focus:border-red-400/80",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:shadow-[0_0_25px_rgba(239,68,68,0.35)]",
    text: "text-red-400",
    bg: "bg-red-950/20",
    gradient: "from-red-600/20 to-rose-700/20",
    accentBg: "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] text-white font-black transition-all duration-300",
    badge: "border-red-500/30 text-red-400 bg-red-950/40",
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

