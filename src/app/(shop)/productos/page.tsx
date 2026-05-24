import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/product/product-grid";
import type { ProductWithCategory, Category } from "@/types/product";

interface Props {
  searchParams: Promise<{ categoria?: string }>;
}

export default async function CatalogoPage({ searchParams }: Props) {
  const { categoria } = await searchParams;
  const selectedCategorySlug = categoria || null;

  const supabase = await createServerSupabaseClient();

  // Parallel Data Fetching (Next.js 15 Rule compliant)
  const [categoriesRes, productsRes] = await Promise.all([
    supabase
      .from("kleiner_categories")
      .select("*")
      .eq("activo", true)
      .order("orden", { ascending: true }),
    supabase
      .from("kleiner_products")
      .select("*, categoria:kleiner_categories(*)")
      .eq("activo", true)
      .order("destacado", { ascending: false }),
  ]);

  if (categoriesRes.error) {
    console.error("Error loading categories:", categoriesRes.error);
  }
  if (productsRes.error) {
    console.error("Error loading products:", productsRes.error);
  }

  const rawCategories = categoriesRes.data || [];
  const rawProducts = productsRes.data || [];

  // Map and cast products to compound types safely
  const allProducts: ProductWithCategory[] = rawProducts.map((p) => ({
    ...p,
    categoria: p.categoria ? (p.categoria as unknown as Category) : null,
  }));

  // Perform premium server-side filtering based on category slug
  const filteredProducts = selectedCategorySlug
    ? allProducts.filter(
        (p) => p.categoria && p.categoria.slug === selectedCategorySlug
      )
    : allProducts;

  const categories = rawCategories as unknown as Category[];

  return (
    <div className="min-h-screen bg-black text-white pb-20 lux-grid">
      
      {/* BANNER PRINCIPAL: Premium Nightclub Glow */}
      <div className="relative overflow-hidden border-b border-neutral-900 bg-neutral-950/40 py-16 sm:py-20 backdrop-blur-xl">
        {/* Neon Glow Effects */}
        <div className="absolute -bottom-10 left-1/4 w-72 h-72 rounded-full bg-amber-500/10 filter blur-[80px] pointer-events-none" />
        <div className="absolute -top-10 right-1/4 w-72 h-72 rounded-full bg-indigo-500/10 filter blur-[80px] pointer-events-none" />
        
        {/* Glass reflection lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
          <span className="text-[10px] sm:text-xs font-black uppercase text-amber-400 tracking-[0.3em] block">
            Colección Importada de Alemania
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent uppercase">
            Nuestros Sabores
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto font-medium">
            Descubre Kleiner Feigling, el icónico licor de higo y sabores cítricos premium diseñado para transformar tus noches de discoteca y celebraciones.
          </p>
        </div>
      </div>

      {/* CATÁLOGO DE PRODUCTOS GRID */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-12">
        <ProductGrid
          products={filteredProducts}
          categories={categories}
          selectedCategorySlug={selectedCategorySlug}
        />
      </div>

    </div>
  );
}
