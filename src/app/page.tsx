import Link from "next/link";
import {
  MessageSquareCode,
  Truck,
  ArrowRight,
  Leaf,
  Award
} from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/product-card";
import type { ProductWithCategory, Category } from "@/types/product";
import { HeroSection } from "@/components/home/hero-section";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

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
    <main className="min-h-screen bg-black text-white overflow-hidden lux-grid">

      {/* 1. HERO: Interactive Luxury Hero Section */}
      <HeroSection />

      {/* 2. VALUE PROPS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 border-t border-neutral-900/40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">

          {/* Card 1 - Origen Certificado (Amber Glow) */}
          <div className="group relative rounded-3xl bg-neutral-950/20 border border-white/[0.04] p-8 space-y-6 overflow-hidden transition-all duration-500 hover:bg-neutral-950/45 hover:-translate-y-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_20px_40px_rgba(0,0,0,0.5)] hover:border-amber-500/30 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_25px_50px_rgba(0,0,0,0.7),0_0_25px_rgba(245,158,11,0.06)] backdrop-blur-md">
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-amber-500/5 blur-[40px] pointer-events-none group-hover:scale-150 transition-transform duration-700" />
            <div className="relative w-12 h-12 rounded-2xl bg-amber-950/40 border border-amber-400/15 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:border-amber-400/30 transition-all duration-500">
              <Award className="h-5 w-5" />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest font-sans group-hover:text-amber-400 transition-colors">Origen Certificado</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Destilado y embotellado en Alemania bajo los más estrictos estándares de calidad. Cada botella es garantía de autenticidad.
              </p>
            </div>
          </div>

          {/* Card 2 - Asistente IA de Voz (Purple Glow) */}
          <div className="group relative rounded-3xl bg-neutral-950/20 border border-white/[0.04] p-8 space-y-6 overflow-hidden transition-all duration-500 hover:bg-neutral-950/45 hover:-translate-y-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_20px_40px_rgba(0,0,0,0.5)] hover:border-purple-500/30 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_25px_50px_rgba(0,0,0,0.7),0_0_25px_rgba(168,85,247,0.06)] backdrop-blur-md">
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-purple-500/5 blur-[40px] pointer-events-none group-hover:scale-150 transition-transform duration-700" />
            <div className="relative w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-400/15 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:border-purple-400/30 transition-all duration-500">
              <MessageSquareCode className="h-5 w-5" />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest font-sans group-hover:text-purple-400 transition-colors">Asistente IA de Voz</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Selecciona tu sabor y cantidad por voz. Di "Quiero dos Green Lemon" y nuestro bot lo agrega al carrito en segundos.
              </p>
            </div>
          </div>

          {/* Card 3 - Logística Express (Amber Glow) */}
          <div className="group relative rounded-3xl bg-neutral-950/20 border border-white/[0.04] p-8 space-y-6 overflow-hidden transition-all duration-500 hover:bg-neutral-950/45 hover:-translate-y-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_20px_40px_rgba(0,0,0,0.5)] hover:border-amber-500/30 hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_25px_50px_rgba(0,0,0,0.7),0_0_25px_rgba(245,158,11,0.06)] backdrop-blur-md">
            <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-amber-500/5 blur-[40px] pointer-events-none group-hover:scale-150 transition-transform duration-700" />
            <div className="relative w-12 h-12 rounded-2xl bg-amber-950/40 border border-amber-400/15 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:border-amber-400/30 transition-all duration-500">
              <Truck className="h-5 w-5" />
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest font-sans group-hover:text-amber-400 transition-colors">Logística Express</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Tracking en tiempo real para Lima Metropolitana. Tu pedido llega frío y en condiciones óptimas directamente a tu puerta.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. FEATURED PRODUCTS */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 border-t border-neutral-900/40">
          <div className="space-y-14">

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-2">
                <span className="text-[10px] font-medium uppercase text-amber-400/80 tracking-[0.22em]">
                  Selección Premium
                </span>
                <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-white">
                  Expresiones Destacadas
                </h2>
                <p className="text-sm text-neutral-500 max-w-md leading-relaxed">
                  Nuestra selección de sabores más apreciados en Lima. Importados directamente para preservar su perfil original.
                </p>
              </div>
              <Link
                href="/productos"
                className="inline-flex items-center gap-2 text-xs font-medium uppercase text-neutral-500 hover:text-amber-400 transition-colors tracking-wider group"
              >
                Ver catálogo completo
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

          </div>
        </section>
      )}

      {/* 4. COCKTAIL BANNER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-3xl border border-neutral-900 bg-neutral-950/60 p-8 sm:p-14 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10 backdrop-blur-md">
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-amber-500/5 blur-[80px] pointer-events-none" />

          <div className="space-y-4 max-w-xl relative z-10">
            <span className="text-[10px] font-medium uppercase text-amber-400/70 tracking-[0.22em] flex items-center gap-2">
              <Leaf className="h-3 w-3" />
              Recetas Exclusivas
            </span>
            <h3 className="font-heading text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-tight">
              El arte de la coctelería en casa
            </h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Cada expresión de Kleiner Feigling tiene combinaciones cuidadosamente seleccionadas. Descubre cómo nuestros sabores elevan cualquier preparación.
            </p>
          </div>

          <div className="relative z-10 flex-shrink-0">
            <Link
              href="/productos"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900 px-8 text-sm font-semibold tracking-wide text-white hover:border-amber-400/30 hover:bg-neutral-800 transition-all"
            >
              Explorar Recetas
            </Link>
          </div>
        </div>
      </section>

      {/* Floating Voice Assistant Trigger */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link
          href="/chat?voice=true"
          className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500/20 to-purple-500/20 border border-white/10 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(245,158,11,0.2)] hover:shadow-[0_8px_32px_0_rgba(168,85,247,0.3)] transition-all duration-300 hover:scale-110 active:scale-95"
        >
          {/* Subtle pulse ring */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-400 to-purple-500 opacity-25 group-hover:opacity-50 blur-sm animate-pulse duration-1000" />
          <MessageSquareCode className="relative z-10 h-6 w-6 text-amber-400 group-hover:text-purple-400 transition-colors" />
          
          {/* Tooltip */}
          <span className="absolute right-20 scale-0 group-hover:scale-100 transition-transform origin-right bg-neutral-950/90 border border-neutral-800 text-amber-400 text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl whitespace-nowrap shadow-2xl">
            Asistente de Voz IA 🎙️
          </span>
        </Link>
      </div>

    </main>
  );
}
