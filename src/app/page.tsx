import Link from "next/link";
import { 
  Sparkles, 
  MessageSquareCode, 
  ShoppingBag, 
  Flame, 
  Truck, 
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import type { ProductWithCategory, Category } from "@/types/product";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  // Fetch featured products from Supabase
  const { data: featuredData, error } = await supabase
    .from("kleiner_products")
    .select("*, categoria:kleiner_categories(*)")
    .eq("activo", true)
    .eq("destacado", true)
    .limit(3);

  if (error) {
    console.error("Error loading featured products:", error);
  }

  const featuredProducts: ProductWithCategory[] = (featuredData || []).map((p) => ({
    ...p,
    categoria: p.categoria ? (p.categoria as unknown as Category) : null,
  }));

  return (
    <main className="min-h-screen bg-black text-white overflow-hidden">
      
      {/* 1. HERO SECTION: High-Fidelity Nightclub Atmosphere */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Glowing backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-indigo-500/10 filter blur-[90px] pointer-events-none animate-pulse duration-10000" />
        <div className="absolute bottom-1/4 left-1/3 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] rounded-full bg-lime-500/10 filter blur-[90px] pointer-events-none animate-pulse duration-7000" />

        {/* Diagonal lighting layout */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)]" />

        <div className="relative z-10 mx-auto max-w-4xl space-y-8">
          {/* Subtitle Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lime-400/20 bg-lime-950/20 text-lime-400 text-xs font-black uppercase tracking-widest animate-fade-in shadow-[0_0_15px_rgba(163,230,53,0.1)]">
            <Sparkles className="h-3 w-3 animate-spin" />
            PWA Nightclub Experience en Perú
          </div>

          {/* Glowing Brand Title */}
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9]">
              KLEINER <br className="sm:hidden" />
              <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_4px_20px_rgba(163,230,53,0.25)]">
                FEIGLING
              </span>
            </h1>
            <p className="text-base sm:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              El vodka alemán con higos y sabores más fiestero del planeta llegó a Lima. Compra con nuestra <strong>IA de Voz</strong> y recíbelo en tiempo récord.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto pt-4">
            <Link
              href="/productos"
              className="w-full sm:w-auto inline-flex h-13 items-center justify-center rounded-2xl bg-lime-400 px-8 font-black uppercase text-xs tracking-wider text-black hover:bg-lime-300 transition-all hover:scale-[1.02] shadow-lg shadow-lime-400/20 hover:shadow-lime-400/30 cursor-pointer"
            >
              <ShoppingBag className="mr-2 h-4 w-4 stroke-[3px]" />
              Ver Catálogo
            </Link>
            <Link
              href="/chat"
              className="w-full sm:w-auto inline-flex h-13 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-950/80 px-8 font-black uppercase text-xs tracking-wider text-white hover:border-neutral-700 hover:bg-neutral-900 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <MessageSquareCode className="mr-2 h-4 w-4 text-lime-400" />
              Pedir con Voz
            </Link>
          </div>
        </div>

        {/* Feature stats summary line */}
        <div className="absolute bottom-8 left-0 right-0 border-t border-neutral-900/50 bg-black/60 backdrop-blur-md py-4">
          <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row gap-6 justify-around text-[10px] sm:text-xs font-black uppercase text-neutral-400 tracking-[0.2em]">
            <span>🇩🇪 100% Importado de Alemania</span>
            <span className="hidden sm:inline">•</span>
            <span>⚡ Delivery Express en Lima</span>
            <span className="hidden sm:inline">•</span>
            <span>🛡️ Transacciones seguras con Culqi</span>
          </div>
        </div>
      </section>

      {/* 2. VALUE PROPOSITION: Premium nightclubs grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-neutral-950">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          <div className="group rounded-2xl bg-neutral-950/40 border border-neutral-900 p-6 space-y-4 hover:border-lime-500/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-lime-950/40 border border-lime-400/20 flex items-center justify-center text-lime-400 group-hover:scale-110 transition-transform">
              <Flame className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase">El Alma de la Fiesta</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Famoso en las discotecas europeas por su juego icónico y sus botellas con ojos locos que brillan bajo la luz ultravioleta.
            </p>
          </div>

          <div className="group rounded-2xl bg-neutral-950/40 border border-neutral-900 p-6 space-y-4 hover:border-indigo-500/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/40 border border-indigo-400/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <MessageSquareCode className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase">Smart Order Voice IA</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              ¿Demasiado ocupado bailando? Presiona el botón de micrófono y dile a nuestro bot &quot;Quiero 3 botellas de Green Lemon&quot; para agregarlas instantáneamente.
            </p>
          </div>

          <div className="group rounded-2xl bg-neutral-950/40 border border-neutral-900 p-6 space-y-4 hover:border-cyan-500/20 transition-all">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/40 border border-cyan-400/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white uppercase">Logística Ultra Express</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Sistema PWA de tracking de motorizados integrado para que sepas en tiempo real cuándo llegará tu Kleiner Feigling a enfriarse.
            </p>
          </div>

        </div>
      </section>

      {/* 3. FEATURED PRODUCTS: Dynamic Supabase Query Display */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 border-t border-neutral-900/50">
          <div className="space-y-12">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-lime-400 tracking-[0.2em] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Los Favoritos de la Noche
                </span>
                <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                  Sabores Destacados
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 max-w-xl">
                  Nuestra selección de botellas premium más vendidas en Lima. Importados directamente para garantizar el sabor original alemán.
                </p>
              </div>

              <Link 
                href="/productos" 
                className="inline-flex items-center gap-2 text-xs font-black uppercase text-neutral-400 hover:text-white transition-colors group"
              >
                Ver todo el catálogo
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 4. COCTEL CTA BANNER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-3xl bg-neutral-950/80 border border-neutral-900 p-8 sm:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md">
          {/* Glowing back lights */}
          <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-48 rounded-full bg-indigo-500/10 filter blur-[40px] pointer-events-none" />
          
          <div className="space-y-4 max-w-2xl relative z-10">
            <Badge className="bg-indigo-500/20 text-indigo-400 border border-indigo-400/20 font-black text-[9px] uppercase px-3 py-1 tracking-wider">
              Recetas Exclusivas
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight">
              ¿Quieres preparar cócteles espectaculares?
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Cada uno de nuestros sabores (Original, Green Lemon, Coco Biscuit) tiene increíbles combinaciones recomendadas. Revisa la página de detalles de cada botella para aprender a mezclarlos como un bartender profesional.
            </p>
          </div>

          <div className="relative z-10 flex-shrink-0">
            <Link
              href="/productos"
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-white px-8 font-black uppercase text-xs tracking-wider text-black hover:bg-neutral-200 transition-all hover:scale-[1.02] shadow-lg cursor-pointer"
            >
              Explorar Recetas
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
