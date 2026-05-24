"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Trash2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  ArrowRight,
  Droplet
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const pathname = usePathname();
  const { items, updateQuantity, remove, clearCart, getTotalPrice, getTotalItems } = useCart();

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleDecrease = (id: number, currentQty: number) => {
    updateQuantity(id, currentQty - 1);
  };

  const handleIncrease = (id: number, currentQty: number) => {
    updateQuantity(id, currentQty + 1);
  };

  const subtotal = getTotalPrice();
  const isEmpty = items.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md border-l border-neutral-900 bg-neutral-950/95 backdrop-blur-2xl text-white flex flex-col h-full shadow-[0_0_50px_rgba(0,0,0,0.8)]"
      >
        <SheetHeader className="border-b border-neutral-900 pb-4">
          <SheetTitle className="text-xl font-black tracking-widest text-white flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-amber-400" />
            MI <span className="text-amber-400">CARRITO</span>
          </SheetTitle>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
              {getTotalItems()} botella{getTotalItems() !== 1 ? "s" : ""} seleccionada{getTotalItems() !== 1 ? "s" : ""}
            </span>
            {!isEmpty && (
              <button 
                onClick={clearCart}
                className="text-[9px] uppercase font-extrabold tracking-wider text-rose-400 hover:text-rose-300 transition-colors"
              >
                Vaciar todo
              </button>
            )}
          </div>
        </SheetHeader>

        {/* CONTENIDO DEL CARRITO */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-neutral-900 scrollbar-track-transparent">
          {isEmpty ? (
            /* Estado Vacío */
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-400/10 rounded-full filter blur-xl animate-pulse" />
                <div className="relative w-20 h-20 rounded-full border border-neutral-800 bg-neutral-900/40 flex items-center justify-center text-neutral-600">
                  <ShoppingBag className="h-10 w-10 stroke-1 text-neutral-500" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white uppercase tracking-wider">Tu carrito está vacío</h3>
                <p className="text-xs text-neutral-500 max-w-[250px]">
                  Tu selección de licores premium te está esperando. Agrega tus expresiones favoritas.
                </p>
              </div>
              <Button
                onClick={handleClose}
                size="sm"
                className="bg-amber-400 text-neutral-950 font-extrabold text-xs uppercase tracking-widest hover:bg-amber-300 px-6 rounded-xl shadow-md transition-all cursor-pointer"
              >
                Explorar Catálogo
              </Button>
            </div>
          ) : (
            /* Lista de Productos */
            <div className="space-y-3">
              {items.map((item) => (
                <div 
                  key={item.id}
                  className="group relative flex gap-3 p-3 rounded-2xl bg-neutral-900/30 border border-neutral-900/60 hover:border-neutral-900 backdrop-blur-sm transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/1 to-white/0 pointer-events-none" />
                  
                  {/* Imagen */}
                  <div className="relative h-20 w-20 rounded-xl bg-neutral-900/50 border border-neutral-950 overflow-hidden flex items-center justify-center p-2 flex-shrink-0">
                    {item.imagen_url ? (
                      <img 
                        src={item.imagen_url} 
                        alt={item.nombre}
                        className="object-contain max-h-full max-w-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <ShoppingBag className="h-6 w-6 text-neutral-700" />
                    )}
                  </div>

                  {/* Detalles */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="space-y-0.5">
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-extrabold text-sm text-white truncate group-hover:text-amber-400 transition-colors">
                          {item.nombre}
                        </h4>
                        <button 
                          onClick={() => remove(item.id)}
                          className="text-neutral-600 hover:text-rose-400 transition-colors p-0.5 flex-shrink-0"
                          title="Eliminar producto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1">
                          <Droplet className="h-3 w-3 text-blue-400" />
                          {item.volumen_ml} ml
                        </span>
                        <Badge className="bg-neutral-950 border border-neutral-900 text-neutral-500 font-extrabold text-[8px] px-1.5 py-0">
                          S/ {item.precio.toFixed(2)} c/u
                        </Badge>
                      </div>
                    </div>

                    <div className="flex justify-between items-end pt-1">
                      {/* Control de Cantidades */}
                      <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-950 h-7">
                        <button
                          onClick={() => handleDecrease(item.id, item.cantidad)}
                          disabled={item.cantidad <= 1}
                          className="flex h-full w-7 items-center justify-center hover:bg-neutral-900 transition-colors disabled:opacity-30 disabled:hover:bg-transparent rounded-l-lg text-neutral-400"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="flex h-full w-6 items-center justify-center font-bold text-xs text-white select-none">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => handleIncrease(item.id, item.cantidad)}
                          className="flex h-full w-7 items-center justify-center hover:bg-neutral-900 transition-colors rounded-r-lg text-neutral-400"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Subtotal Item */}
                      <span className="text-sm font-black text-white">
                        S/ {(item.precio * item.cantidad).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PIE DE PÁGINA / RESUMEN */}
        {!isEmpty && (
          <div className="border-t border-neutral-900 pt-4 pb-2 space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs uppercase font-extrabold tracking-widest text-neutral-500">Subtotal</span>
                <span className="text-xl font-black text-amber-400">
                  S/ {subtotal.toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 leading-relaxed uppercase tracking-wider text-center bg-neutral-950/40 p-2 rounded-xl border border-neutral-900/60">
                Tarifas de envío se calculan al confirmar tu distrito en el checkout.
              </p>
            </div>

            <div className="flex gap-3">
              <Link 
                href="/carrito" 
                onClick={handleClose}
                className="flex-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-400/5 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                Proceder al Checkout
                <ArrowRight className="h-4 w-4 stroke-[3px]" />
              </Link>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
