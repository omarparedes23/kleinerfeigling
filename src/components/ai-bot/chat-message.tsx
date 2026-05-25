import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShoppingBag,
  CheckCircle,
  Truck,
  Flame,
  Check,
  GlassWater,
  AlertTriangle,
  User,
  Sparkles,
  MapPin,
} from "lucide-react";

import type { UIMessage, ToolInvocation } from "ai";

interface ChatMessageProps {
  message: UIMessage;
}

// Color palettes for nightclub theme based on Kleiner Feigling flavors
const FLAVOR_THEMES: Record<
  string,
  { bg: string; text: string; border: string; glow: string; badge: string }
> = {
  original: {
    bg: "bg-purple-950/30 backdrop-blur-md",
    text: "text-purple-400",
    border: "border-purple-500/30",
    glow: "shadow-[0_0_15px_rgba(168,85,247,0.15)]",
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  },
  "green lemon": {
    bg: "bg-emerald-950/30 backdrop-blur-md",
    text: "text-emerald-400",
    border: "border-emerald-600/30",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.12)]",
    badge: "bg-emerald-600/20 text-emerald-300 border-emerald-600/40",
  },
  "red berry sour": {
    bg: "bg-rose-950/30 backdrop-blur-md",
    text: "text-rose-400",
    border: "border-rose-500/30",
    glow: "shadow-[0_0_15px_rgba(244,63,94,0.15)]",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  },
  "coco biscuit": {
    bg: "bg-amber-950/30 backdrop-blur-md",
    text: "text-amber-400",
    border: "border-amber-500/30",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.15)]",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
  cherrie: {
    bg: "bg-red-950/30 backdrop-blur-md",
    text: "text-red-400",
    border: "border-red-500/30",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
    badge: "bg-red-500/20 text-red-300 border-red-500/40",
  },
  default: {
    bg: "bg-zinc-950/40 backdrop-blur-md",
    text: "text-amber-400",
    border: "border-zinc-800",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.05)]",
    badge: "bg-zinc-800 text-zinc-300 border-zinc-700",
  },
};

function getFlavorTheme(flavorName?: string) {
  if (!flavorName) return FLAVOR_THEMES.default;
  const normalized = flavorName.toLowerCase().trim();
  if (normalized.includes("lemon")) return FLAVOR_THEMES["green lemon"];
  if (normalized.includes("berry") || normalized.includes("red")) return FLAVOR_THEMES["red berry sour"];
  if (normalized.includes("coco") || normalized.includes("biscuit")) return FLAVOR_THEMES["coco biscuit"];
  if (normalized.includes("cherrie") || normalized.includes("cereza")) return FLAVOR_THEMES.cherrie;
  if (normalized.includes("original")) return FLAVOR_THEMES.original;
  return FLAVOR_THEMES.default;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const { add } = useCart();

  return (
    <div className={`flex w-full gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-full border text-sm font-black transition-all duration-300 ${
          isUser
            ? "border-amber-500/30 bg-amber-950/30 text-amber-400 shadow-[0_0_15px_rgba(163,230,53,0.2)]"
            : "border-purple-500/30 bg-purple-950/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
        }`}
      >
        {isUser ? <User className="h-5.5 w-5.5" /> : <Sparkles className="h-5.5 w-5.5" />}
      </div>

      {/* Message Content & Intercepted Tools */}
      <div className="flex flex-col gap-3.5 max-w-[85%] md:max-w-[75%]">
        {/* Main Text Content */}
        {message.content && (
          <div
            className={`rounded-3xl px-5 py-4 text-base leading-relaxed border transition-all duration-300 ${
              isUser
                ? "bg-zinc-900/60 border-zinc-800 text-zinc-100 rounded-tr-none"
                : "bg-neutral-950/70 border-neutral-900 text-zinc-200 rounded-tl-none shadow-xl"
            }`}
          >
            <p className="whitespace-pre-wrap font-sans">{message.content}</p>
          </div>
        )}

        {/* Vercel AI SDK Tool Calls Interceptor */}
        {message.toolInvocations && message.toolInvocations.length > 0 && (
          <div className="flex flex-col gap-3 mt-1">
            {message.toolInvocations.map((tool) => (
              <ToolCard key={tool.toolCallId} tool={tool} add={add} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-Component: Tool Card Router ───────────────────────────
interface ToolCardProps {
  tool: ToolInvocation;
  add: (product: any, quantity?: number, volume?: number) => void;
}

function ToolCard({ tool, add }: ToolCardProps) {
  const { toolName, state } = tool;
  const args = tool.args;
  const result = "result" in tool ? (tool as Extract<ToolInvocation, { state: "result" }>).result : undefined;

  if (state === "call" || state === "partial-call") {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-neutral-900 bg-neutral-950/40 text-xs text-neutral-400 animate-pulse">
        <div className="h-2 w-2 rounded-full bg-amber-400" />
        <span>Procesando consulta: {toolName.replace("_", " ")}...</span>
      </div>
    );
  }

  if (!result) return null;

  switch (toolName) {
    case "buscar_producto":
      return <BuscarProductoCard result={result} add={add} />;
    case "verificar_stock":
      return <VerificarStockCard result={result} args={args} />;
    case "calcular_envio":
      return <CalcularEnvioCard result={result} args={args} />;
    case "buscar_receta":
      return <BuscarRecetaCard result={result} />;
    case "agregar_al_carrito":
      return <AgregarAlCarritoCard result={result} args={args} add={add} />;
    case "ver_carrito_chat":
      return <CartSummaryCard result={result} />;
    case "confirmar_pedido_chat":
      return <OrderConfirmedCard result={result} />;
    default:
      return null;
  }
}

// ─── TOOL: buscar_producto ─────────────────────────────────────
function BuscarProductoCard({ result, add }: { result: any; add: any }) {
  const productos: any[] = Array.isArray(result)
    ? result
    : Array.isArray(result?.productos)
      ? result.productos
      : [];

  if (productos.length === 0) {
    return (
      <Card className="border-red-500/20 bg-red-950/10 backdrop-blur-md">
        <CardContent className="flex items-center gap-2 p-3 text-xs text-red-400">
          <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0" />
          <span>No se encontraron productos disponibles con ese criterio.</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {productos.map((product: any) => {
        const theme = getFlavorTheme(product.sabor);
        const price = product.precio_oferta && Number(product.precio_oferta) > 0
          ? Number(product.precio_oferta)
          : Number(product.precio);

        return (
          <Card
            key={product.id}
            className={`overflow-hidden border transition-all duration-300 hover:scale-[1.02] ${theme.bg} ${theme.border} ${theme.glow}`}
          >
            <div className="relative aspect-video w-full overflow-hidden bg-neutral-900/50">
              {product.imagen_url ? (
                <img
                  src={product.imagen_url}
                  alt={product.nombre}
                  className="h-full w-full object-contain p-2 transition-transform duration-500 hover:scale-108"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-800">
                  <ShoppingBag className="h-10 w-10" />
                </div>
              )}
              {product.sabor && (
                <Badge className={`absolute bottom-2 left-2 text-[9px] border font-bold uppercase ${theme.badge}`}>
                  {product.sabor}
                </Badge>
              )}
            </div>
            <CardContent className="p-3.5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-neutral-100 line-clamp-1 font-sans">
                  {product.nombre}
                </h4>
                <span className="text-sm font-black text-amber-400">
                  S/ {price.toFixed(2)}
                </span>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  add(product, 1, product.volumen_ml);
                  toast.success(`Añadido: ${product.nombre} 🥂`);
                }}
                className="h-8 rounded-lg bg-amber-400 text-neutral-950 font-bold text-xs hover:bg-amber-300 border-none transition-all shadow-[0_0_10px_rgba(163,230,53,0.2)] cursor-pointer"
              >
                Agregar
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── TOOL: verificar_stock ─────────────────────────────────────
function VerificarStockCard({ result, args }: { result: any; args: any }) {
  const isAvailable = result.disponible;

  return (
    <Card
      className={`border backdrop-blur-md transition-all duration-300 ${
        isAvailable
          ? "border-amber-500/20 bg-amber-950/10 shadow-[0_0_10px_rgba(163,230,53,0.05)]"
          : "border-rose-500/20 bg-rose-950/10 shadow-[0_0_10px_rgba(244,63,94,0.05)]"
      }`}
    >
      <CardContent className="p-3.5 flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isAvailable ? "bg-amber-500/15 text-amber-400" : "bg-rose-500/15 text-rose-400"
          }`}
        >
          {isAvailable ? <CheckCircle className="h-4.5 w-4.5" /> : <AlertTriangle className="h-4.5 w-4.5" />}
        </div>
        <div className="flex-1 space-y-0.5">
          <h4 className="font-bold text-xs text-neutral-200">
            Verificación de Stock: <span className="text-neutral-400">{result.nombre || `ID #${args.product_id}`}</span>
          </h4>
          <p className="text-xs text-neutral-300 leading-snug">{result.mensaje}</p>
          {isAvailable && (
            <p className="text-[10px] text-neutral-500 mt-1">
              Precio unitario: S/ {Number(result.precio || 0).toFixed(2)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── TOOL: calcular_envio ──────────────────────────────────────
function CalcularEnvioCard({ result, args }: { result: any; args: any }) {
  const isAvailable = result.disponible;

  return (
    <Card
      className={`border backdrop-blur-md ${
        isAvailable
          ? "border-amber-500/20 bg-amber-950/10 shadow-[0_0_10px_rgba(163,230,53,0.05)]"
          : "border-amber-500/20 bg-amber-950/10 shadow-[0_0_10px_rgba(245,158,11,0.05)]"
      }`}
    >
      <CardContent className="p-3.5 flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isAvailable ? "bg-amber-500/15 text-amber-400" : "bg-amber-500/15 text-amber-400"
          }`}
        >
          <Truck className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 space-y-1">
          <h4 className="font-bold text-xs text-neutral-200">
            Cálculo de Envío: <span className="text-amber-400">{args.distrito}</span>
          </h4>
          <p className="text-xs text-neutral-300 leading-relaxed">{result.mensaje}</p>
          {isAvailable && (
            <div className="flex gap-4 mt-2 border-t border-neutral-900/60 pt-2 text-[10px] text-neutral-400">
              <div>
                <span>Tarifa: </span>
                <span className="font-bold text-white">S/ {Number(result.tarifa).toFixed(2)}</span>
              </div>
              <div>
                <span>Tiempo: </span>
                <span className="font-bold text-amber-400">{result.tiempo}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── TOOL: buscar_receta ───────────────────────────────────────
function BuscarRecetaCard({ result }: { result: any }) {
  const recetas = result.recetas || [];

  if (recetas.length === 0) {
    return (
      <Card className="border-zinc-800 bg-zinc-950/30">
        <CardContent className="p-3.5 text-xs text-neutral-400 text-center">
          No se encontraron recetas disponibles.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="text-[11px] font-bold text-amber-400/80 uppercase tracking-widest px-1">
        {result.mensaje}
      </div>
      {recetas.map((receta: any, idx: number) => {
        const theme = getFlavorTheme(receta.sabor_recomendado);
        return (
          <Card
            key={idx}
            className={`border overflow-hidden transition-all duration-300 ${theme.bg} ${theme.border} ${theme.glow}`}
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-900/80 pb-2">
                <div className="flex items-center gap-2">
                  <GlassWater className={`h-5 w-5 ${theme.text}`} />
                  <h4 className="font-black text-sm text-neutral-100 font-sans tracking-wide">
                    {receta.nombre}
                  </h4>
                </div>
                <Badge className={`text-[9px] uppercase border font-bold ${theme.badge}`}>
                  Recomendado: {receta.sabor_recomendado}
                </Badge>
              </div>

              {/* Ingredientes */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                  Ingredientes:
                </span>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 list-disc list-inside text-xs text-neutral-300">
                  {receta.ingredientes.map((ing: string, i: number) => (
                    <li key={i} className="truncate">
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preparacion */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                  Preparación:
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed bg-black/30 p-2 rounded-lg border border-neutral-900/50">
                  {receta.preparacion}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── TOOL: ver_carrito_chat ────────────────────────────────────
function CartSummaryCard({ result }: { result: any }) {
  if (!result.ok) {
    return (
      <Card className="border-amber-500/20 bg-amber-950/10 backdrop-blur-md">
        <CardContent className="flex items-center gap-2.5 p-3.5 text-xs text-amber-400">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-500" />
          <span>{result.mensaje}</span>
        </CardContent>
      </Card>
    );
  }

  const items: any[] = result.items ?? [];

  if (items.length === 0) {
    return (
      <Card className="border-neutral-800 bg-neutral-950/40 backdrop-blur-md">
        <CardContent className="flex items-center gap-2.5 p-3.5 text-xs text-neutral-400">
          <ShoppingBag className="h-4.5 w-4.5 shrink-0" />
          <span>Tu carrito está vacío. ¿Quieres explorar nuestros productos?</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/20 bg-amber-950/10 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.08)]">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 border-b border-neutral-900/80 pb-2.5">
          <ShoppingBag className="h-4.5 w-4.5 text-amber-400" />
          <h4 className="font-black text-xs text-amber-400 uppercase tracking-widest">Tu Carrito</h4>
          <span className="ml-auto text-[10px] text-neutral-500 font-semibold">{result.total_items} unid.</span>
        </div>

        <div className="space-y-2">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-neutral-200 font-semibold truncate">{item.nombre}</span>
                {item.sabor && (
                  <span className="text-[9px] text-neutral-600 uppercase tracking-wide shrink-0">
                    {item.sabor}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 text-neutral-400 text-[11px]">
                <span>x{item.cantidad}</span>
                <span className="font-black text-white">S/ {Number(item.subtotal).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-900/60 pt-2.5 flex justify-between items-center">
          <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wide">Subtotal</span>
          <span className="text-base font-black text-amber-400">S/ {Number(result.subtotal).toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── TOOL: confirmar_pedido_chat ───────────────────────────────
function OrderConfirmedCard({ result }: { result: any }) {
  const { clearCart } = useCart();
  const hasClearedRef = useRef(false);

  useEffect(() => {
    if (result.ok && !hasClearedRef.current) {
      hasClearedRef.current = true;
      clearCart();
    }
  }, [result, clearCart]);

  if (!result.ok) {
    return (
      <Card className="border-rose-500/20 bg-rose-950/10 backdrop-blur-md">
        <CardContent className="flex items-center gap-2.5 p-3.5 text-xs text-rose-400">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
          <span>{result.mensaje}</span>
        </CardContent>
      </Card>
    );
  }

  const items: any[] = result.items ?? [];

  return (
    <Card className="border-amber-500/30 bg-amber-950/10 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.12)]">
      <CardContent className="p-4 space-y-3.5">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-neutral-900/80 pb-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-neutral-950">
            <Check className="h-5 w-5 stroke-[3px]" />
          </div>
          <div>
            <h4 className="font-black text-sm text-amber-400 tracking-wide">¡Pedido Confirmado!</h4>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{result.codigo_pedido}</p>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1.5">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between text-xs">
              <span className="text-neutral-300 truncate">
                {item.nombre} <span className="text-neutral-500">x{item.cantidad}</span>
              </span>
              <span className="font-bold text-white shrink-0 ml-3">
                S/ {Number(item.subtotal).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-neutral-900/60 pt-2.5 space-y-1.5">
          <div className="flex justify-between text-xs text-neutral-400">
            <span>Subtotal</span>
            <span>S/ {Number(result.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Truck className="h-3 w-3" /> Delivery · {result.distrito}
            </span>
            <span>S/ {Number(result.tarifa_envio).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-black pt-0.5">
            <span className="text-white">Total</span>
            <span className="text-amber-400">S/ {Number(result.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start gap-2 bg-neutral-950/50 rounded-xl p-2.5 border border-neutral-900/60 text-[11px] text-neutral-400">
          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500/70" />
          <span>{result.direccion_envio}, {result.distrito}</span>
        </div>

        {/* CTA */}
        <Link
          href={result.payment_url ?? "/carrito"}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-full bg-amber-400 text-neutral-950 font-black text-sm uppercase tracking-wider hover:bg-amber-300 transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-[1.02] active:scale-[0.98]"
        >
          Proceder al Pago
        </Link>
      </CardContent>
    </Card>
  );
}

// ─── TOOL: agregar_al_carrito ──────────────────────────────────
function AgregarAlCarritoCard({
  result,
  args,
  add,
}: {
  result: any;
  args: any;
  add: any;
}) {
  const hasAddedRef = useRef(false);

  useEffect(() => {
    // Crucial: Programmatically trigger the client-side Zustand store on tool success!
    if (result?.ok && !hasAddedRef.current) {
      hasAddedRef.current = true;
      const fetchAndAdd = async () => {
        try {
          const supabase = createClient();
          const { data: product, error } = await supabase
            .from("kleiner_products")
            .select("*")
            .eq("id", args.product_id)
            .single();

          if (product && !error) {
            add(product, args.cantidad, product.volumen_ml);
            // Show custom visual confirmation
            toast.success(`Añadido: ${product.nombre} (x${args.cantidad}) 🥂`);
          } else {
            console.error("[AgregarAlCarritoCard] Product not found in Supabase:", error);
          }
        } catch (err) {
          console.error("[AgregarAlCarritoCard] Error fetching product details:", err);
        }
      };
      fetchAndAdd();
    }
  }, [result, args, add]);

  if (!result.ok) {
    return (
      <Card className="border-amber-500/20 bg-amber-950/10 backdrop-blur-md">
        <CardContent className="flex items-center gap-2.5 p-3.5 text-xs text-amber-400">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-500" />
          <span>{result.mensaje}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-amber-950/10 backdrop-blur-md shadow-[0_0_15px_rgba(163,230,53,0.1)]">
      <CardContent className="p-3.5 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-400 text-neutral-950 shadow-[0_0_10px_rgba(163,230,53,0.3)]">
          <Check className="h-5 w-5 stroke-[3px]" />
        </div>
        <div className="flex-1 space-y-0.5">
          <h4 className="font-black text-xs text-amber-400 font-sans tracking-wide">
            ¡AGREGADO CON ÉXITO!
          </h4>
          <p className="text-xs text-neutral-200 font-semibold leading-snug">
            {result.mensaje}
          </p>
          <p className="text-[10px] text-neutral-500">
            Sincronizado al instante con tu carrito local.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
