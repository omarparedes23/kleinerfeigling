"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Minus, 
  Plus, 
  ShoppingCart, 
  Flame, 
  Droplet, 
  GlassWater, 
  Check, 
  ArrowLeft,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFlavorTheme } from "@/types/product";
import { useCart } from "@/hooks/use-cart";
import type { ProductWithCategory } from "@/types/product";

interface ProductDetailProps {
  product: ProductWithCategory;
}

interface Recipe {
  name: string;
  ingredients: string[];
  instructions: string;
}

// Recipes dictionary based on product flavor
const RECIPES_BY_FLAVOR: Record<string, Recipe[]> = {
  original: [
    {
      name: "Feigling Cold Shot",
      ingredients: ["1.5 oz Kleiner Feigling Original", "Hielo picado"],
      instructions: "Servir directamente del congelador en un vaso de chupito (shot) helado. ¡Tómalo de un solo golpe!",
    },
    {
      name: "Feigling Tonic",
      ingredients: ["2 oz Kleiner Feigling Original", "4 oz Agua Tónica", "Rodaja de limón verde"],
      instructions: "Llenar un vaso highball con hielo. Agregar Kleiner Feigling Original, completar con agua tónica y decorar con la rodaja de limón.",
    },
  ],
  "green-lemon": [
    {
      name: "Lemon Mojito Splash",
      ingredients: ["2 oz Kleiner Feigling Green Lemon", "1 oz Ron Blanco", "6 hojas de menta", "1/2 oz Jugo de limón", "Soda"],
      instructions: "Machacar las hojas de menta con el jugo de limón en un vaso. Agregar hielo, Kleiner Feigling, ron blanco y completar con soda.",
    },
    {
      name: "Citrus Night",
      ingredients: ["2 oz Kleiner Feigling Green Lemon", "Sprite o 7Up", "Rodaja de lima"],
      instructions: "Servir en un vaso corto con mucho hielo, completar con gaseosa lima-limón y decorar con una rodaja de lima.",
    },
  ],
  "red-berry-sour": [
    {
      name: "Wild Berry Sunset",
      ingredients: ["2 oz Kleiner Feigling Red Berry Sour", "3 oz Jugo de Arándanos", "1 oz Prosecco o Cava", "Moras frescas"],
      instructions: "En una copa de champán, verter Kleiner Feigling y jugo de arándanos. Completar con prosecco y decorar con moras flotantes.",
    },
    {
      name: "Red Berry Lemonade",
      ingredients: ["2 oz Kleiner Feigling Red Berry Sour", "4 oz Limonada americana", "Hielo"],
      instructions: "Mezclar Kleiner Feigling con limonada fría en un vaso alto con hielo. Decorar con una ramita de menta.",
    },
  ],
  "coco-biscuit": [
    {
      name: "Feigling Piña Colada",
      ingredients: ["2.5 oz Kleiner Feigling Coco Biscuit", "3 oz Jugo de piña", "1 oz Crema de coco", "Hielo"],
      instructions: "Licuar todos los ingredientes con hielo hasta obtener una consistencia cremosa. Servir en un vaso alto con rodaja de piña.",
    },
    {
      name: "Sweet Espresso Biscuit",
      ingredients: ["2 oz Kleiner Feigling Coco Biscuit", "1 shot de Café Espresso frío", "0.5 oz Licor de Café"],
      instructions: "Agitar vigorosamente en una coctelera con hielo y servir en una copa martini. ¡Un postre líquido espectacular!",
    },
  ],
  cherrie: [
    {
      name: "Cherry Bomb Coke",
      ingredients: ["2 oz Kleiner Feigling Cherrie", "Coca-Cola zero", "Cerezo al marrasquino"],
      instructions: "Llenar un vaso alto con hielo, verter Kleiner Feigling Cherrie, completar con Coca-Cola y decorar con una cereza.",
    },
    {
      name: "Ruby Sunset",
      ingredients: ["2 oz Kleiner Feigling Cherrie", "3 oz Jugo de Naranja", "Un chorrito de granadina"],
      instructions: "Verter Kleiner Feigling y jugo de naranja en un vaso con hielo. Agregar despacio la granadina para que decante al fondo creando un efecto degradado.",
    },
  ],
};

export function ProductDetail({ product }: ProductDetailProps) {
  const { addItem } = useCart();
  const theme = getFlavorTheme(product.sabor);
  
  const [quantity, setQuantity] = useState(1);
  const [selectedVolume, setSelectedVolume] = useState<number>(product.volumen_ml ?? 250);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Dynamic prices mapping based on selected volume
  const getPrices = () => {
    const basePrice = Number(product.precio);
    const offerPrice = product.precio_oferta ? Number(product.precio_oferta) : null;
    
    if (selectedVolume === 700) {
      return {
        precio: basePrice * 2.4,
        precio_oferta: offerPrice ? offerPrice * 2.4 : null,
      };
    }
    if (selectedVolume === 20) {
      return {
        precio: basePrice * 0.15,
        precio_oferta: offerPrice ? offerPrice * 0.15 : null,
      };
    }
    return {
      precio: basePrice,
      precio_oferta: offerPrice,
    };
  };

  const { precio, precio_oferta } = getPrices();
  const precioActual = precio_oferta ?? precio;

  // Retrieve drink recipes based on product flavor
  const getRecipes = (): Recipe[] => {
    if (!product.sabor) return RECIPES_BY_FLAVOR.original;
    const normalized = product.sabor.toLowerCase().trim();
    if (normalized.includes("lemon") || normalized.includes("limon") || normalized === "green-lemon") {
      return RECIPES_BY_FLAVOR["green-lemon"];
    }
    if (normalized.includes("berry") || normalized.includes("sour") || normalized === "red-berry-sour") {
      return RECIPES_BY_FLAVOR["red-berry-sour"];
    }
    if (normalized.includes("coco") || normalized.includes("biscuit") || normalized === "coco-biscuit") {
      return RECIPES_BY_FLAVOR["coco-biscuit"];
    }
    if (normalized.includes("cherrie") || normalized.includes("cereza") || normalized === "cherrie") {
      return RECIPES_BY_FLAVOR.cherrie;
    }
    return RECIPES_BY_FLAVOR.original;
  };

  const recipes = getRecipes();

  // Combine image URLs from single and list fields
  const allImages = [
    product.imagen_url,
    ...(product.imagen_urls || []),
  ].filter((img): img is string => !!img);

  // Default elegant fallback image if none provided
  const imagesToShow = allImages.length > 0 ? allImages : ["/images/placeholder.png"];

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    } else {
      toast.warning(`Solo hay ${product.stock} unidades en stock.`);
    }
  };

  const handleAddToCart = () => {
    // Clone product with updated prices for this specific volume order
    const customProduct = {
      ...product,
      precio,
      precio_oferta,
      volumen_ml: selectedVolume,
    };
    
    addItem(customProduct, quantity, selectedVolume);
    toast.success(`🎉 ${quantity} botella${quantity > 1 ? "s" : ""} de ${product.nombre} (${selectedVolume}ml) agregada${quantity > 1 ? "s" : ""} al carrito!`, {
      description: "Puedes seguir comprando o ir al checkout en el menú superior.",
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 pt-6 px-4 sm:px-6 lg:px-8">
      {/* Botón de regreso */}
      <div className="mx-auto max-w-7xl mb-6">
        <Link 
          href="/productos"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver al catálogo
        </Link>
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* SECCIÓN IMAGEN: Pedestal premium blanco */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full rounded-3xl bg-gradient-to-b from-white to-neutral-50/95 border border-neutral-200/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_10px_20px_-5px_rgba(0,0,0,0.25)] transition-all duration-500 overflow-hidden flex items-center justify-center p-6 group">
              
              {/* Reflejo glassmorphism */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />
              
              {/* Luces de neon de fondo */}
              <div className={`absolute -bottom-10 -left-10 w-44 h-44 rounded-full filter blur-[60px] opacity-20 ${theme.accentBg}`} />
              <div className={`absolute -top-10 -right-10 w-44 h-44 rounded-full filter blur-[60px] opacity-20 ${theme.accentBg}`} />

              {/* Botella del producto */}
              {product.imagen_url ? (
                <div className="relative w-4/5 h-4/5 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                  <img
                    src={imagesToShow[activeImageIndex]}
                    alt={product.nombre}
                    className="object-contain max-h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] filter contrast-110 mix-blend-multiply"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6">
                  <div className={`w-28 h-28 rounded-full border border-dashed ${theme.border} flex items-center justify-center mb-4`}>
                    <GlassWater className={`h-12 w-12 ${theme.text} animate-pulse`} />
                  </div>
                  <h3 className="text-lg font-bold">Botella Premium</h3>
                  <p className="text-xs text-neutral-500 max-w-[200px] mt-1">Imágenes de alta fidelidad en preparación</p>
                </div>
              )}

              {/* Tag Flotante de Descuento */}
              {precio_oferta && (
                <div className="absolute top-6 left-6 rotate-[-5deg] scale-100 hover:scale-110 transition-all duration-300">
                  <Badge className="bg-rose-500 text-white font-black text-xs px-3 py-1 tracking-widest border border-rose-400/30 uppercase shadow-[0_4px_10px_rgba(239,68,68,0.3)]">
                    Oferta Club
                  </Badge>
                </div>
              )}
            </div>

            {/* Carrusel de Miniaturas */}
            {imagesToShow.length > 1 && (
              <div className="flex gap-3 justify-center">
                {imagesToShow.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border bg-neutral-950 transition-all ${
                      activeImageIndex === index 
                        ? `${theme.border} ring-1 ring-offset-2 ring-offset-black ring-lime-400` 
                        : "border-neutral-800 hover:border-neutral-600"
                    }`}
                  >
                    <img 
                      src={img} 
                      alt={`${product.nombre} thumbnail ${index}`} 
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN DETALLES */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Cabecera */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${theme.badge} uppercase tracking-wider font-extrabold text-[10px] px-2.5 py-0.5 border`}>
                  {product.sabor || "Original"}
                </Badge>
                {product.categoria?.nombre && (
                  <Badge className="bg-neutral-900 border border-neutral-800 text-neutral-400 font-medium text-[10px] px-2.5 py-0.5 uppercase">
                    {product.categoria.nombre}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white to-neutral-400 bg-clip-text text-transparent">
                {product.nombre}
              </h1>
              <p className="text-base text-neutral-400 leading-relaxed max-w-xl">
                {product.descripcion || product.descripcion_corta || "Exquisito licor alemán Kleiner Feigling. Disfruta de la mejor calidad internacional y un sabor inigualable de fiesta."}
              </p>
            </div>

            {/* Especificaciones Premium */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-neutral-950/60 border border-neutral-900 backdrop-blur-md">
              <div className="flex flex-col items-center justify-center py-2 text-center border-r border-neutral-900">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Volumen</span>
                <span className="text-base font-black text-white mt-1 flex items-center gap-1">
                  <Droplet className="h-3.5 w-3.5 text-blue-400" />
                  {selectedVolume} ml
                </span>
              </div>
              <div className="flex flex-col items-center justify-center py-2 text-center border-r border-neutral-900">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Graduación</span>
                <span className="text-base font-black text-white mt-1 flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  {product.graduacion || 15}% Vol
                </span>
              </div>
              <div className="flex flex-col items-center justify-center py-2 text-center">
                <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Stock</span>
                <span className="text-base font-black text-white mt-1">
                  {product.stock > 0 ? (
                    <span className="text-emerald-400 flex items-center gap-1 justify-center">
                      <Check className="h-3.5 w-3.5" />
                      {product.stock} u.
                    </span>
                  ) : (
                    <span className="text-rose-500">Agotado</span>
                  )}
                </span>
              </div>
            </div>

            {/* Selector de Volumen Options */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-neutral-400 tracking-widest block">Seleccionar Tamaño</span>
              <div className="flex gap-2">
                {[
                  { vol: 20, label: "20 ml Mini" },
                  { vol: 250, label: "250 ml Shot" },
                  { vol: 700, label: "700 ml Party" },
                ].map((option) => {
                  const isAvailable = option.vol === 250 || option.vol === (product.volumen_ml ?? 250) || option.vol === 700;
                  const isSelected = selectedVolume === option.vol;

                  return (
                    <button
                      key={option.vol}
                      disabled={!isAvailable}
                      onClick={() => setSelectedVolume(option.vol)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? `${theme.border} ${theme.bg} ${theme.text} border-2`
                          : isAvailable
                          ? "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-600 hover:text-white"
                          : "border-neutral-900 bg-black/40 text-neutral-700 cursor-not-allowed"
                      }`}
                    >
                      <span>{option.label}</span>
                      <span className="text-[9px] text-neutral-500 font-medium">
                        {option.vol === 250 ? "Original" : option.vol === 20 ? "Muestra" : "Compartir"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alerta de Stock Activo */}
            {product.stock <= 5 && product.stock > 0 && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Info className="h-5 w-5 flex-shrink-0" />
                <p className="text-xs font-semibold">
                  ¡Atención! Quedan muy pocas botellas disponibles en stock. Completa tu pedido antes de que se agote.
                </p>
              </div>
            )}

            {/* PRECIO CONTENEDOR */}
            <div className="flex flex-col gap-1 py-2">
              <span className="text-xs uppercase font-bold text-neutral-500 tracking-wider">Precio Total</span>
              <div className="flex items-baseline gap-3">
                <span className={`text-4xl font-black ${theme.text}`}>
                  S/ {precioActual.toFixed(2)}
                </span>
                {precio_oferta && (
                  <span className="text-lg text-neutral-600 line-through font-bold">
                    S/ {precio.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* ACCIONES DE COMPRA */}
            <div className="flex items-center gap-4 pt-2">
              {product.stock > 0 ? (
                <>
                  {/* Selector de Cantidad */}
                  <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-950 h-12">
                    <button
                      onClick={handleDecrease}
                      disabled={quantity <= 1}
                      className="flex h-full w-12 items-center justify-center hover:bg-neutral-900 transition-colors disabled:opacity-40 disabled:hover:bg-transparent rounded-l-xl text-neutral-400 hover:text-white"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="flex h-full w-10 items-center justify-center font-black text-sm text-white select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncrease}
                      disabled={quantity >= product.stock}
                      className="flex h-full w-12 items-center justify-center hover:bg-neutral-900 transition-colors disabled:opacity-40 disabled:hover:bg-transparent rounded-r-xl text-neutral-400 hover:text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Botón Comprar */}
                  <Button
                    onClick={handleAddToCart}
                    size="lg"
                    className={`flex-1 h-12 text-sm font-black uppercase tracking-wider rounded-xl cursor-pointer ${theme.accentBg} hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4 stroke-[3px]" />
                    Agregar al Carrito
                  </Button>
                </>
              ) : (
                <Button
                  disabled
                  size="lg"
                  className="w-full h-12 text-sm font-black uppercase rounded-xl bg-neutral-900 text-neutral-600 border border-neutral-800"
                >
                  Producto Agotado
                </Button>
              )}
            </div>

            {/* Detalle PWA Delivery */}
            <p className="text-[10px] text-neutral-600 text-center uppercase tracking-widest mt-1">
              🚚 Delivery express disponible para Lima Metropolitana
            </p>

          </div>
        </div>

        {/* RECETAS RECOMENDADAS: High-fidelity Cards */}
        {recipes && recipes.length > 0 && (
          <div className="mt-20 space-y-6">
            <div className="border-t border-neutral-900 pt-10">
              <h2 className="text-2xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                <GlassWater className={`h-6 w-6 ${theme.text}`} />
                Cócteles Sugeridos con {product.sabor || "Original"}
              </h2>
              <p className="text-sm text-neutral-500 mt-1">Saca el máximo provecho a tu Kleiner Feigling preparando estas increíbles recetas de discoteca en casa.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recipes.map((recipe, index) => (
                <div 
                  key={index}
                  className="group relative rounded-2xl bg-neutral-950/40 border border-neutral-900 hover:border-neutral-800/80 p-6 backdrop-blur-md overflow-hidden transition-all duration-300"
                >
                  <div className={`absolute -bottom-10 -right-10 w-24 h-24 rounded-full filter blur-[40px] opacity-10 ${theme.accentBg} group-hover:scale-150 transition-transform duration-500`} />
                  
                  <h3 className={`text-lg font-bold tracking-tight text-white group-hover:${theme.text} transition-colors`}>
                    {recipe.name}
                  </h3>
                  
                  <div className="mt-4 space-y-3">
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block mb-1">Ingredientes</span>
                      <ul className="text-xs text-neutral-300 space-y-1 list-disc list-inside">
                        {recipe.ingredients.map((ing, i) => (
                          <li key={i}>{ing}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-neutral-900/50">
                      <span className="text-[10px] uppercase font-black tracking-widest text-neutral-500 block mb-1">Preparación</span>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        {recipe.instructions}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
