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
            className={`cursor-pointer px-5 py-2.5 rounded-full border text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
              selectedCategorySlug === null
                ? "bg-lime-400 border-lime-400 text-black shadow-[0_0_15px_rgba(163,230,53,0.3)] hover:bg-lime-300"
                : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-600 hover:text-white"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
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
                className={`cursor-pointer px-5 py-2.5 rounded-full border text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                  isSelected
                    ? `${theme.accentBg} ${theme.border} text-black shadow-[0_0_15px_rgba(255,255,255,0.1)]`
                    : `border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-600 hover:text-white`
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-black' : theme.text.replace('text-', 'bg-')}`} />
                {category.nombre}
              </button>
            );
          })}
        </div>
      </div>

      {/* SKELETONS O GRID DE PRODUCTOS */}
      {isPending ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {[...Array(6)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 animate-in fade-in duration-300">
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
    <div className="rounded-2xl bg-neutral-950/20 border border-neutral-900/60 p-5 space-y-4 flex flex-col justify-between h-[420px] animate-pulse">
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
