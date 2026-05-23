"use client";

import Link from "next/link";
import { ShoppingCart, Flame, Droplet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFlavorTheme } from "@/types/product";
import { useCart } from "@/hooks/use-cart";
import type { ProductWithCategory } from "@/types/product";

interface ProductCardProps {
  product: ProductWithCategory;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const theme = getFlavorTheme(product.sabor);
  
  const hasOffer = product.precio_oferta !== null && product.precio_oferta !== undefined;
  const originalPrice = Number(product.precio);
  const activePrice = hasOffer ? Number(product.precio_oferta) : originalPrice;
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Evitar que el clic en el botón active el enlace del card
    
    if (isOutOfStock) {
      toast.error("Este producto se encuentra temporalmente agotado.");
      return;
    }

    addItem(product, 1, product.volumen_ml ?? 250);
    toast.success(`🎉 ${product.nombre} agregado al carrito!`, {
      description: "Puedes modificar las cantidades en el carrito de compras.",
      duration: 2500,
    });
  };

  return (
    <div className={`group relative rounded-2xl bg-neutral-950/40 border ${theme.border} ${theme.glow} backdrop-blur-xl flex flex-col justify-between overflow-hidden transition-all duration-300 h-full`}>
      
      {/* Link de vista de detalle */}
      <Link href={`/producto/${product.slug}`} className="flex flex-col h-full p-5 space-y-4">
        
        {/* Superior: Badges y Volumen */}
        <div className="flex justify-between items-center z-10">
          <Badge className={`${theme.badge} uppercase tracking-wider font-extrabold text-[8px] px-2 py-0.5 border`}>
            {product.sabor || "Original"}
          </Badge>
          <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1">
            <Droplet className="h-3 w-3 text-blue-400" />
            {product.volumen_ml || 250} ml
          </span>
        </div>

        {/* Imagen del Producto en pedestal premium blanco */}
        <div className="relative aspect-square w-full rounded-xl bg-gradient-to-b from-white to-neutral-50/95 border border-neutral-200/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06),0_10px_20px_-5px_rgba(0,0,0,0.25)] overflow-hidden flex items-center justify-center p-4 transition-colors">
          {/* Reflejos y gradientes de fondo */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />
          <div className={`absolute -bottom-6 -left-6 w-20 h-20 rounded-full filter blur-[35px] opacity-10 ${theme.accentBg}`} />
          
          {product.imagen_url ? (
            <img
              src={product.imagen_url}
              alt={product.nombre}
              className="object-contain h-4/5 w-4/5 drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-transform duration-300 filter contrast-105 mix-blend-multiply"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-600">
              <ShoppingCart className="h-10 w-10 stroke-1" />
              <span className="text-[10px] uppercase font-bold tracking-widest mt-2">Premium Bottle</span>
            </div>
          )}

          {/* Badge de Oferta */}
          {hasOffer && (
            <div className="absolute top-2 left-2 rotate-[-5deg]">
              <Badge className="bg-rose-500 text-white font-extrabold text-[9px] px-2 py-0.5 border border-rose-400/20 uppercase tracking-widest shadow-md">
                Oferta
              </Badge>
            </div>
          )}
        </div>

        {/* Información de texto */}
        <div className="space-y-1.5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-base tracking-tight text-white line-clamp-1 group-hover:text-white transition-colors">
              {product.nombre}
            </h3>
            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed mt-1">
              {product.descripcion_corta || product.descripcion || "Auténtico licor alemán Feigling."}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            {/* Stock status indicator */}
            <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider">
              {isOutOfStock ? (
                <span className="text-rose-500">Agotado</span>
              ) : product.stock <= 5 ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <Flame className="h-3 w-3 animate-pulse text-amber-500" />
                  ¡Solo {product.stock} disp!
                </span>
              ) : (
                <span className="text-emerald-400">En Stock</span>
              )}
            </div>

            {/* Precios */}
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black ${theme.text}`}>
                S/ {activePrice.toFixed(2)}
              </span>
              {hasOffer && (
                <span className="text-xs text-neutral-600 line-through font-bold">
                  S/ {originalPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>
        </div>

      </Link>

      {/* Botón de compra rápido */}
      <div className="px-5 pb-5 z-10">
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          size="sm"
          className={`w-full h-9 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer ${
            isOutOfStock 
              ? "bg-neutral-900 text-neutral-600 border border-neutral-800" 
              : `${theme.accentBg} hover:scale-[1.02] active:scale-[0.98]`
          }`}
        >
          <ShoppingCart className="mr-1.5 h-3.5 w-3.5 stroke-[3px]" />
          Comprar
        </Button>
      </div>

    </div>
  );
}
