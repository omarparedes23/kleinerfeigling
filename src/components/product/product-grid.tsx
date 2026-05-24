"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ShoppingBag, GlassWater } from "lucide-react";
import { ProductCard } from "./product-card";
import { getFlavorTheme } from "@/types/product";
import type { ProductWithCategory, Category } from "@/types/product";

interface ProductGridProps {
  products: ProductWithCategory[];
  categories: Category[];
  selectedCategorySlug: string | null;
}

export function ProductGrid({
  products,
  categories,
  selectedCategorySlug,
}: ProductGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleCategorySelect = (slug: string | null) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set("categoria", slug);
      } else {
        params.delete("categoria");
      }
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-10">
      
      {/* SECCIÓN FILTROS: Chips de Categorías */}
      <div className="flex flex-col gap-4">
        <span className="text-xs font-black uppercase text-neutral-500 tracking-widest block">
          Categorías de Sabores
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 scrollbar-thin scrollbar-thumb-neutral-900 scrollbar-track-transparent">
          
          {/* Chip para 'Todos' */}
          <button
            onClick={() => handleCategorySelect(null)}
            className={`cursor-pointer px-6 py-3.5 rounded-full border text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2.5 ${
              selectedCategorySlug === null
                ? "bg-amber-400 border-amber-400 text-black shadow-[0_4px_20px_rgba(245,158,11,0.35)] hover:bg-amber-300"
                : "border-white/[0.05] bg-white/[0.02] text-neutral-400 backdrop-blur-md hover:border-white/20 hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            <ShoppingBag className="h-4.5 w-4.5 shrink-0" />
            Todos
          </button>

          {/* Chips Dinámicos de Categorías */}
          {categories.map((category) => {
            const isSelected = selectedCategorySlug === category.slug;
            const theme = getFlavorTheme(category.slug);

            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.slug)}
                className={`cursor-pointer px-6 py-3.5 rounded-full border text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2.5 ${
                  isSelected
                    ? `${theme.accentBg} ${theme.border} text-black shadow-[0_4px_20px_rgba(255,255,255,0.15)]`
                    : "border-white/[0.05] bg-white/[0.02] text-neutral-400 backdrop-blur-md hover:border-white/20 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 transition-all ${isSelected ? 'bg-black scale-110' : theme.text.replace('text-', 'bg-')}`} />
                {category.nombre}
              </button>
            );
          })}
        </div>
      </div>

      {/* SKELETONS O GRID DE PRODUCTOS */}
      {isPending ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-300">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center py-20 rounded-3xl border border-neutral-900 bg-neutral-950/20 backdrop-blur-sm p-8">
          <div className="w-20 h-20 rounded-full border border-neutral-800 bg-neutral-950 flex items-center justify-center mb-6">
            <GlassWater className="h-8 w-8 text-neutral-600 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Sin productos disponibles</h3>
          <p className="text-sm text-neutral-500 max-w-sm mt-2">
            No encontramos botellas activas bajo esta categoría en este momento. ¡Elige otro sabor para empezar la fiesta!
          </p>
          <button
            onClick={() => handleCategorySelect(null)}
            className="cursor-pointer mt-6 px-6 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-black uppercase text-white hover:bg-neutral-800 transition-colors"
          >
            Ver todos los sabores
          </button>
        </div>
      )}
    </div>
  );
}

// Beautiful Glassmorphic Skeleton Loader
function ProductCardSkeleton() {
  return (
    <div className="rounded-3xl glass-card-premium p-5 space-y-4 flex flex-col justify-between h-[420px] animate-pulse">
      <div className="space-y-4">
        {/* Head */}
        <div className="flex justify-between items-center">
          <div className="h-5 w-20 rounded-lg bg-neutral-900" />
          <div className="h-4 w-12 rounded-lg bg-neutral-900" />
        </div>
        {/* Image panel */}
        <div className="aspect-square w-full rounded-xl bg-neutral-900/40 flex items-center justify-center p-4">
          <div className="w-1/3 h-2/3 rounded-lg bg-neutral-900" />
        </div>
        {/* Texts */}
        <div className="space-y-2">
          <div className="h-6 w-3/4 rounded-lg bg-neutral-900" />
          <div className="h-4 w-full rounded-lg bg-neutral-900" />
          <div className="h-4 w-5/6 rounded-lg bg-neutral-900" />
        </div>
      </div>
      {/* Price & Button */}
      <div className="space-y-3">
        <div className="h-6 w-24 rounded-lg bg-neutral-900" />
        <div className="h-9 w-full rounded-xl bg-neutral-900" />
      </div>
    </div>
  );
}
