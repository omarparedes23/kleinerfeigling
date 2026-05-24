"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, MessageSquareCode } from "lucide-react";
import { cn } from "@/lib/utils";

// 1. Types and Constants following project guidelines
const FLAVORS = {
  ORIGINAL: "original",
  GREEN_LEMON: "green-lemon",
  RED_BERRY_SOUR: "red-berry-sour",
  COCO_BISCUIT: "coco-biscuit",
  CHERRIE: "cherrie",
} as const;

type Flavor = (typeof FLAVORS)[keyof typeof FLAVORS];

interface FlavorDetail {
  key: Flavor;
  name: string;
  badgeLabel: string;
  titleAccent: string;
  description: string;
  watermark: string;
  image: string;
  glowColor: string;
  indicatorBg: string;
  shadowClass: string;
  borderClass: string;
  textColor: string;
  badgeGlow: string;
}

const FLAVOR_DETAILS: Record<Flavor, FlavorDetail> = {
  [FLAVORS.ORIGINAL]: {
    key: "original",
    name: "Original (Higo)",
    badgeLabel: "El Clásico Desde 1991",
    titleAccent: "text-purple-400 hover:text-purple-300",
    description: "La expresión fundacional de una historia que comenzó en Alemania y hoy se aprecia en los cinco continentes. Kleiner Feigling Original es la síntesis más auténtica de la filosofía de la marca: vodka de la más alta calidad destilado con precisión, sublimado por la dulzura del higo maduro dosificada en su justo punto. Transparente, limpio y de una cordialidad genuina.",
    watermark: "ORIGINAL",
    image: "/images/kleinerfeigling-original-foto.png",
    glowColor: "from-purple-500/20 to-transparent shadow-[0_0_80px_-10px_rgba(168,85,247,0.35)]",
    indicatorBg: "bg-purple-500",
    shadowClass: "shadow-[0_0_12px_rgba(168,85,247,0.6)]",
    borderClass: "border-purple-500/20",
    textColor: "text-purple-400",
    badgeGlow: "border-purple-500/20 bg-purple-950/20 text-purple-400",
  },
  [FLAVORS.GREEN_LEMON]: {
    key: "green-lemon",
    name: "Green Lemon",
    badgeLabel: "Fresco & Cítrico",
    titleAccent: "text-emerald-400 hover:text-emerald-300",
    description: "La energía refrescante de las limas verdes más selectas, capturada en su punto de mayor intensidad aromática. Kleiner Feigling Green Lemon logra el equilibrio preciso entre la acidez vivaz de la lima y una suavidad que lo hace versátil en cualquier contexto: solo, con hielo o como base de coctelería creativa. Su color verde brillante es reflejo de la autenticidad de sus ingredientes.",
    watermark: "LEMON",
    image: "/images/green-lemon-0.02l.png",
    glowColor: "from-emerald-500/20 to-transparent shadow-[0_0_80px_-10px_rgba(16,185,129,0.35)]",
    indicatorBg: "bg-emerald-500",
    shadowClass: "shadow-[0_0_12px_rgba(16,185,129,0.6)]",
    borderClass: "border-emerald-500/20",
    textColor: "text-emerald-400",
    badgeGlow: "border-emerald-500/20 bg-emerald-950/20 text-emerald-400",
  },
  [FLAVORS.RED_BERRY_SOUR]: {
    key: "red-berry-sour",
    name: "Red Berry Sour",
    badgeLabel: "Dulce & Ácido",
    titleAccent: "text-rose-400 hover:text-rose-300",
    description: "Un tributo a la riqueza de los frutos rojos en su plenitud. La fusión de bayas dulces y ácidas crea un perfil de sabor complejo que el vodka premium eleva a una expresión memorable. Su color rojo intenso anticipa una experiencia sensorial profunda. Servido bien frío, revela matices que sorprenden incluso al paladar más exigente.",
    watermark: "BERRY",
    image: "/images/kf-red-berry-sour-produkt-foto.png",
    glowColor: "from-rose-500/20 to-transparent shadow-[0_0_80px_-10px_rgba(244,63,94,0.35)]",
    indicatorBg: "bg-rose-500",
    shadowClass: "shadow-[0_0_12px_rgba(244,63,94,0.6)]",
    borderClass: "border-rose-500/20",
    textColor: "text-rose-400",
    badgeGlow: "border-rose-500/20 bg-rose-950/20 text-rose-400",
  },
  [FLAVORS.COCO_BISCUIT]: {
    key: "coco-biscuit",
    name: "Coco Biscuit",
    badgeLabel: "Cremoso & Exótico",
    titleAccent: "text-amber-400 hover:text-amber-300",
    description: "Una composición singular donde el vodka alemán de primera calidad se funde con la esencia auténtica del coco tropical. Su textura ligeramente cremosa evoca la suavidad de la leche de coco, mientras que un sutil acorde de galleta aporta profundidad y equilibrio en el final. Un licor de personalidad refinada para quienes aprecian los matices más delicados.",
    watermark: "COCO",
    image: "/images/kleinerfeigling-coco-biscuit-foto.png",
    glowColor: "from-amber-500/20 to-transparent shadow-[0_0_80px_-10px_rgba(245,158,11,0.35)]",
    indicatorBg: "bg-amber-500",
    shadowClass: "shadow-[0_0_12px_rgba(245,158,11,0.6)]",
    borderClass: "border-amber-500/20",
    textColor: "text-amber-400",
    badgeGlow: "border-amber-500/20 bg-amber-950/20 text-amber-400",
  },
  [FLAVORS.CHERRIE]: {
    key: "cherrie",
    name: "Kirsch Banana",
    badgeLabel: "Cereza & Plátano",
    titleAccent: "text-red-500 hover:text-red-400",
    description: "Dos notas aparentemente opuestas alcanzan su equilibrio en esta expresión excepcional. La intensidad jugosa de la cereza —profunda, vibrante, de tonos rubí— se entrelaza con la cremosidad suave del plátano. El vodka premium actúa como lienzo transparente que realza cada matiz sin dominar. El resultado es un licor de color rojo cereza único.",
    watermark: "CHERRY",
    image: "/images/kleinerfeigling-kirsch-banana-foto.png",
    glowColor: "from-red-500/20 to-transparent shadow-[0_0_80px_-10px_rgba(239,68,68,0.35)]",
    indicatorBg: "bg-red-500",
    shadowClass: "shadow-[0_0_12px_rgba(239,68,68,0.6)]",
    borderClass: "border-red-500/20",
    textColor: "text-red-500",
    badgeGlow: "border-red-500/20 bg-red-950/20 text-red-400",
  },
};

export function HeroSection() {
  const [activeFlavor, setActiveFlavor] = useState<Flavor>(FLAVORS.ORIGINAL);

  const flavorDetail = FLAVOR_DETAILS[activeFlavor];

  return (
    <section className="relative min-h-[90vh] lg:min-h-screen flex items-center justify-center overflow-hidden py-12 sm:py-16 lg:py-24">
      {/* Background radial soft lights representing current active flavor */}
      <div
        className={cn(
          "absolute right-10 top-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full blur-[160px] pointer-events-none transition-all duration-1000 ease-in-out z-0 bg-gradient-to-r",
          activeFlavor === "original" && "from-purple-500/10 to-indigo-500/5",
          activeFlavor === "green-lemon" && "from-emerald-500/10 to-teal-500/5",
          activeFlavor === "red-berry-sour" && "from-rose-500/10 to-pink-500/5",
          activeFlavor === "coco-biscuit" && "from-amber-500/10 to-yellow-500/5",
          activeFlavor === "cherrie" && "from-red-500/10 to-orange-500/5"
        )}
      />

      {/* Main unified grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Left Content column (lg:col-span-7) */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-8 lg:space-y-10 text-left">
          
          <div className="space-y-4">
            {/* Origin badge dynamically displaying active flavor characteristics */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-neutral-800 bg-neutral-950/60 text-neutral-300 text-[10px] font-semibold uppercase tracking-[0.22em] shadow-sm">
              <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-500", flavorDetail.indicatorBg)} />
              <span>Importado de Alemania</span>
              <span className="text-neutral-700">·</span>
              <span className={cn("transition-colors duration-500 font-bold", flavorDetail.textColor)}>
                {flavorDetail.badgeLabel}
              </span>
            </div>

            {/* Headline - Editorial Sans-Serif / Serif Mix */}
            <h1 
              className="font-heading font-semibold leading-tight tracking-tight text-white select-none transition-all duration-300"
              style={{ fontSize: "clamp(3rem, 7.5vw, 5.5rem)" }}
            >
              Kleiner<br />
              <span className={cn("italic font-serif transition-colors duration-500", flavorDetail.titleAccent)}>
                Feigling
              </span>
            </h1>
          </div>

          {/* Dynamic Flavor Description with a subtle height stabilizer for smooth updates */}
          <div className="min-h-[110px] sm:min-h-[85px] lg:min-h-[105px] max-w-2xl">
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed transition-all duration-500">
              {flavorDetail.description}
            </p>
          </div>

          {/* Interactive Flavor Picker: beautiful, tactile rows of buttons */}
          <div className="space-y-3.5">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] block">
              Explorar Sabores
            </span>
            <div className="flex flex-wrap gap-2.5">
              {Object.values(FLAVOR_DETAILS).map((flavor) => {
                const isActive = activeFlavor === flavor.key;
                return (
                  <button
                    key={flavor.key}
                    onClick={() => setActiveFlavor(flavor.key)}
                    onMouseEnter={() => setActiveFlavor(flavor.key)}
                    className={cn(
                      "group flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all duration-300 cursor-pointer text-xs font-semibold tracking-wide",
                      isActive
                        ? "bg-white/[0.07] border-white/20 text-white"
                        : "bg-white/[0.01] border-white/[0.03] text-neutral-400 hover:bg-white/[0.04] hover:border-white/10 hover:text-white"
                    )}
                    style={isActive ? {
                      boxShadow: `0 0 16px -2px rgba(${
                        flavor.key === "original" ? "168,85,247" :
                        flavor.key === "green-lemon" ? "16,185,129" :
                        flavor.key === "red-berry-sour" ? "244,63,94" :
                        flavor.key === "coco-biscuit" ? "245,158,11" :
                        "239,68,68"
                      }, 0.25)`
                    } : undefined}
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300 shrink-0",
                        flavor.indicatorBg,
                        isActive ? "scale-110" : "scale-90 opacity-70 group-hover:opacity-100"
                      )}
                      style={isActive ? {
                        boxShadow: `0 0 10px ${
                          flavor.key === "original" ? "rgba(168,85,247,0.8)" :
                          flavor.key === "green-lemon" ? "rgba(16,185,129,0.8)" :
                          flavor.key === "red-berry-sour" ? "rgba(244,63,94,0.8)" :
                          flavor.key === "coco-biscuit" ? "rgba(245,158,11,0.8)" :
                          "rgba(239,68,68,0.8)"
                        }`
                      } : undefined}
                    />
                    <span className="pr-0.5">{flavor.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary & Secondary Call to Actions */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-md pt-2">
            <Link
              href="/productos"
              className={cn(
                "inline-flex h-12 items-center justify-center rounded-xl px-7 text-sm font-bold tracking-wide transition-all duration-300 shadow-md cursor-pointer",
                activeFlavor === "original" && "bg-purple-500 text-white hover:bg-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)]",
                activeFlavor === "green-lemon" && "bg-emerald-500 text-neutral-950 hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]",
                activeFlavor === "red-berry-sour" && "bg-rose-500 text-white hover:bg-rose-400 hover:shadow-[0_0_20px_rgba(244,63,94,0.4)]",
                activeFlavor === "coco-biscuit" && "bg-amber-500 text-neutral-950 hover:bg-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]",
                activeFlavor === "cherrie" && "bg-red-600 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
              )}
            >
              <ShoppingBag className="mr-2 h-4 w-4 shrink-0" />
              Ver Tienda de Productos
            </Link>
            <Link
              href="/chat"
              className="group relative inline-flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-8 text-sm font-semibold tracking-wide text-neutral-300 hover:text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:border-white/20 hover:bg-white/[0.05]"
            >
              <MessageSquareCode className="mr-2 h-4 w-4 text-amber-400 group-hover:text-purple-400 transition-colors" />
              <span>Asistente IA</span>
            </Link>
          </div>

          {/* Compact Premium Features Grid below CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 border-t border-white/10 max-w-2xl">
            <div className="flex items-center gap-3">
              <span className="text-xl shrink-0 select-none">🇩🇪</span>
              <span className="text-xs text-neutral-400 font-sans tracking-wide">
                <span className="font-semibold text-neutral-200 block">100% Importado</span>
                Alemania · Desde 1991
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl shrink-0 select-none">🧪</span>
              <span className="text-xs text-neutral-400 font-sans tracking-wide">
                <span className="font-semibold text-neutral-200 block">Formato Original</span>
                Botellas 20ml / 250ml
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xl shrink-0 select-none">⚡</span>
              <span className="text-xs text-neutral-400 font-sans tracking-wide">
                <span className="font-semibold text-neutral-200 block">Delivery Express</span>
                Envíos el mismo día en Lima
              </span>
            </div>
          </div>

        </div>

        {/* Right Content pedestal and bottle layout (lg:col-span-5) */}
        <div className="lg:col-span-5 flex items-center justify-center relative min-h-[420px] sm:min-h-[500px] lg:min-h-[550px] w-full z-10 select-none">
          
          {/* Watermark text in the background of the bottle pedestal */}
          {Object.values(FLAVOR_DETAILS).map((flavor) => (
            <div
              key={flavor.key}
              className={cn(
                "text-[7rem] sm:text-[10rem] lg:text-[11rem] xl:text-[13rem] font-heading font-black leading-none uppercase tracking-[0.1em] pointer-events-none absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 select-none z-0 transition-all duration-700 ease-in-out font-sans",
                activeFlavor === flavor.key
                  ? "opacity-[0.02] scale-100 translate-y-[-50%]"
                  : "opacity-0 scale-75 translate-y-[-40%]"
              )}
            >
              {flavor.watermark}
            </div>
          ))}

          {/* Premium glowing pedestal */}
          <div
            className={cn(
              "relative bg-gradient-to-b from-white/10 to-transparent rounded-3xl p-6 glass-card-premium overflow-hidden transition-all duration-700 w-full max-w-[360px] sm:max-w-[420px] lg:max-w-[460px] aspect-[3/3.8] flex items-center justify-center border border-white/[0.08]"
            )}
          >
            {/* Color dynamic glow inside the pedestal */}
            <div
              className={cn(
                "absolute -inset-10 rounded-full blur-[90px] pointer-events-none transition-all duration-1000 ease-in-out z-0 bg-gradient-to-b",
                flavorDetail.glowColor
              )}
            />

            {/* Pedestal top highlight reflection line */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            {/* Active bottle image loaded absolutely to enable crossfading animations */}
            <div className="relative w-full h-full flex items-center justify-center z-10">
              {Object.values(FLAVOR_DETAILS).map((flavor) => {
                const isActive = activeFlavor === flavor.key;
                return (
                  <img
                    key={flavor.key}
                    src={flavor.image}
                    alt={flavor.name}
                    className={cn(
                      "absolute inset-x-0 mx-auto max-h-[94%] w-auto object-contain transition-all duration-700 ease-in-out pointer-events-none select-none",
                      isActive
                        ? "opacity-100 scale-100 rotate-0 translate-y-0 filter drop-shadow-[0_20px_50px_rgba(255,255,255,0.08)] animate-[float-slow_6s_ease-in-out_infinite]"
                        : "opacity-0 scale-90 rotate-[12deg] translate-y-8"
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Inject custom CSS keyframes for floating effect if custom classes are not loaded globally */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(-1deg);
          }
        }
      `}</style>
    </section>
  );
}
