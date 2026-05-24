"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ShoppingBag, 
  Trash2, 
  Minus, 
  Plus, 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  Info, 
  CheckCircle2, 
  Loader2,
  Droplet
} from "lucide-react";
import { toast } from "sonner";
import { useStripe, useElements } from "@stripe/react-stripe-js";
import { createClient } from "@/lib/supabase/client";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StripeProvider } from "@/components/payment/stripe-provider";
import { CardPaymentForm } from "@/components/payment/card-payment-form";

interface District {
  id: number;
  nombre: string;
  tarifa_envio: number;
  tiempo_estimado: string | null;
  disponible: boolean;
}

const FALLBACK_DISTRICTS: District[] = [
  { id: 1, nombre: "Miraflores", tarifa_envio: 8.00, tiempo_estimado: "30-45 min", disponible: true },
  { id: 2, nombre: "San Isidro", tarifa_envio: 8.00, tiempo_estimado: "30-45 min", disponible: true },
  { id: 3, nombre: "Santiago de Surco", tarifa_envio: 10.00, tiempo_estimado: "45-60 min", disponible: true },
  { id: 4, nombre: "San Borja", tarifa_envio: 9.00, tiempo_estimado: "40-50 min", disponible: true },
  { id: 5, nombre: "Barranco", tarifa_envio: 8.00, tiempo_estimado: "35-50 min", disponible: true },
  { id: 6, nombre: "La Molina", tarifa_envio: 12.00, tiempo_estimado: "50-70 min", disponible: true },
  { id: 7, nombre: "Lince", tarifa_envio: 8.00, tiempo_estimado: "35-45 min", disponible: true },
  { id: 8, nombre: "Jesus Maria", tarifa_envio: 8.00, tiempo_estimado: "35-45 min", disponible: true },
  { id: 9, nombre: "Magdalena del Mar", tarifa_envio: 9.00, tiempo_estimado: "40-50 min", disponible: true },
];

export default function CarritoPage() {
  return (
    <StripeProvider>
      <CarritoPageContent />
    </StripeProvider>
  );
}

function CarritoPageContent() {
  const router = useRouter();
  const supabase = createClient();
  const stripe = useStripe();
  const elements = useElements();
  
  const { items, updateQuantity, remove, clearCart, getTotalPrice } = useCart();
  
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | "">("");
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  
  // Checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  
  // Checkout form inputs
  const [email, setEmail] = useState("");
  const [direccionEnvio, setDireccionEnvio] = useState("");
  const [notas, setNotas] = useState("");
  const [cardError, setCardError] = useState<string | null>(null);

  const subtotal = getTotalPrice();
  
  // Find selected district
  const selectedDistrict = districts.find(d => d.id === Number(selectedDistrictId));
  const shippingFee = selectedDistrict ? Number(selectedDistrict.tarifa_envio) : 0;
  const grandTotal = subtotal + shippingFee;
  const isEmpty = items.length === 0;

  // Fetch districts on mount
  useEffect(() => {
    async function fetchDistricts() {
      try {
        const { data, error } = await supabase
          .from("kleiner_distritos")
          .select("*")
          .eq("disponible", true)
          .order("nombre", { ascending: true });

        if (error) {
          console.warn("Could not fetch districts from Supabase, using fallbacks:", error);
          setDistricts(FALLBACK_DISTRICTS);
        } else if (data && data.length > 0) {
          setDistricts(data);
        } else {
          setDistricts(FALLBACK_DISTRICTS);
        }
      } catch (err) {
        console.error("Error loading districts:", err);
        setDistricts(FALLBACK_DISTRICTS);
      } finally {
        setLoadingDistricts(false);
      }
    }

    fetchDistricts();
  }, [supabase]);

  // Generate unique order code on checkout open
  const handleOpenCheckout = async () => {
    if (!selectedDistrictId) {
      toast.error("Por favor, selecciona un distrito para calcular el envío antes de continuar.");
      return;
    }
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email ?? "");
      
      // Fetch user profile fields (pre-populate address if available)
      const { data: profile } = await supabase
        .from("kleiner_profiles")
        .select("direccion")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.direccion) {
        setDireccionEnvio(profile.direccion);
      }
    }
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setOrderCode(`KF-${dateStr}-${randomSuffix}`);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error("El procesador de pagos Stripe no está completamente cargado.");
      return;
    }

    if (!email || !direccionEnvio) {
      toast.error("Por favor completa los campos obligatorios de contacto y envío.");
      return;
    }

    // Dynamic import to avoid SSR errors
    const { CardElement } = await import("@stripe/react-stripe-js");
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error("Por favor complete los detalles de su tarjeta.");
      return;
    }

    setPaymentLoading(true);
    setCardError(null);

    try {
      // 1. Create client-side Stripe PaymentMethod
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          email: email,
        },
      });

      if (pmError) {
        setCardError(pmError.message || "Error al validar la tarjeta.");
        toast.error(pmError.message || "La tarjeta no pudo ser validada.");
        setPaymentLoading(false);
        return;
      }

      // 2. Post payment method & order elements to server endpoint
      const response = await fetch("/api/pago/crear-cargo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payment_method: paymentMethod.id,
          email,
          subtotal,
          tarifa_envio: shippingFee,
          total: grandTotal,
          distrito_id: Number(selectedDistrictId),
          direccion_envio: direccionEnvio,
          notas: notas || null,
          items: items.map(item => ({
            id: item.id,
            nombre: item.nombre,
            slug: item.slug,
            cantidad: item.cantidad,
            precio: item.precio,
            volumen_ml: item.volumen_ml,
            imagen_url: item.imagen_url || null,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || "Ocurrió un error al procesar el cargo.";
        setCardError(errorMsg);
        toast.error(errorMsg);
        setPaymentLoading(false);
        return;
      }

      // 3. Success checkout processing
      setPaymentLoading(false);
      setPaymentSuccess(true);
      setOrderCode(result.orderCode || orderCode);
      toast.success("🎉 ¡Pago procesado con éxito por Stripe!");
      
      // Clear global Zustand cart
      clearCart();
    } catch (err) {
      console.error("Stripe payment error:", err);
      const errMsg = err instanceof Error ? err.message : "Error de conexión con la pasarela.";
      setCardError(errMsg);
      toast.error(errMsg);
      setPaymentLoading(false);
    }
  };

  const handleFinishSuccess = () => {
    setIsCheckoutOpen(false);
    setPaymentSuccess(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Enlace para volver */}
        <div>
          <Link 
            href="/productos"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Seguir comprando
          </Link>
        </div>

        {/* Cabecera */}
        <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 border-b border-neutral-900 pb-6">
          <h1 className="text-3xl font-black tracking-tight uppercase">
            Mi <span className="text-amber-400">Carrito</span>
          </h1>
          <span className="text-xs uppercase font-extrabold tracking-widest text-neutral-500">
            PWA checkout rápido & seguro
          </span>
        </div>

        {isEmpty && !paymentSuccess ? (
          /* Estado vacío */
          <div className="rounded-3xl border border-neutral-900 bg-neutral-950/40 p-12 text-center backdrop-blur-md flex flex-col items-center justify-center max-w-xl mx-auto space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/5 rounded-full filter blur-xl" />
              <div className="relative w-24 h-24 rounded-full border border-neutral-800 bg-neutral-900/20 flex items-center justify-center text-neutral-600">
                <ShoppingBag className="h-12 w-12 stroke-1 text-neutral-500" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold uppercase tracking-wider">Tu carrito está vacío</h2>
              <p className="text-xs text-neutral-500 max-w-md leading-relaxed">
                Parece que aún no tienes productos en tu carrito. Explora nuestra exclusiva selección de botellas alemanas y cócteles premium listos para llevar la fiesta a tu casa.
              </p>
            </div>

            <Link href="/productos">
              <Button className="bg-amber-400 text-neutral-950 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-amber-300 px-8 h-12 shadow-lg shadow-amber-400/10 cursor-pointer">
                Ver Catálogo de Productos
              </Button>
            </Link>
          </div>
        ) : (
          /* Contenido del Carrito */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LISTADO DE PRODUCTOS (7/12) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="rounded-2xl border border-neutral-900 bg-neutral-950/30 backdrop-blur-xl p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Items Seleccionados</h3>
                
                <div className="divide-y divide-neutral-900/60">
                  {items.map((item) => (
                    <div 
                      key={item.id}
                      className="flex gap-4 py-4 first:pt-0 last:pb-0 group"
                    >
                      {/* Thumbnail */}
                      <div className="relative h-20 w-20 rounded-xl bg-neutral-900/40 border border-neutral-900 overflow-hidden flex items-center justify-center p-2 flex-shrink-0">
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
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors">
                              {item.nombre}
                            </h4>
                            <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1 mt-0.5">
                              <Droplet className="h-3 w-3 text-blue-400" />
                              {item.volumen_ml} ml
                            </span>
                          </div>
                          <button 
                            onClick={() => remove(item.id)}
                            className="text-neutral-600 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                            title="Quitar del carrito"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex justify-between items-end mt-2">
                          {/* Cantidades */}
                          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-950 h-8">
                            <button
                              onClick={() => updateQuantity(item.id, item.cantidad - 1)}
                              disabled={item.cantidad <= 1}
                              className="flex h-full w-8 items-center justify-center hover:bg-neutral-900 transition-colors disabled:opacity-30 disabled:hover:bg-transparent rounded-l-lg text-neutral-400 cursor-pointer"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="flex h-full w-8 items-center justify-center font-bold text-xs text-white">
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.cantidad + 1)}
                              className="flex h-full w-8 items-center justify-center hover:bg-neutral-900 transition-colors rounded-r-lg text-neutral-400 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Precios */}
                          <div className="text-right">
                            <span className="text-[10px] font-semibold text-neutral-500 block">
                              S/ {item.precio.toFixed(2)} c/u
                            </span>
                            <span className="text-sm font-black text-white">
                              S/ {(item.precio * item.cantidad).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RESUMEN DE PAGO & DISTRITO (5/12) */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-neutral-900 bg-neutral-950/60 backdrop-blur-xl rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-neutral-900/60 pb-4">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-white">
                    Resumen de Compra
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-6">
                  
                  {/* Fila Subtotal */}
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs uppercase font-extrabold text-neutral-400">Subtotal</span>
                    <span className="text-base font-black text-white">
                      S/ {subtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* CALCULADORA DE ENVÍO */}
                  <div className="space-y-3 bg-neutral-900/30 border border-neutral-900 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-xs font-black uppercase text-neutral-300 tracking-wider">
                      <Truck className="h-4 w-4 text-amber-400" />
                      Calculadora de Delivery
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="district-select" className="text-[10px] uppercase font-bold text-neutral-500 block">
                        Selecciona tu distrito (Lima)
                      </label>
                      {loadingDistricts ? (
                        <div className="h-10 w-full flex items-center justify-center bg-neutral-950 rounded-xl border border-neutral-800">
                          <Loader2 className="h-4 w-4 animate-spin text-amber-400 mr-2" />
                          <span className="text-xs text-neutral-500">Cargando distritos...</span>
                        </div>
                      ) : (
                        <select
                          id="district-select"
                          value={selectedDistrictId}
                          onChange={(e) => setSelectedDistrictId(e.target.value === "" ? "" : Number(e.target.value))}
                          className="w-full h-10 px-3 rounded-xl border border-neutral-800 bg-neutral-950 text-xs font-semibold text-white focus:outline-none focus:border-amber-400 transition-colors"
                        >
                          <option value="">-- Elige un distrito --</option>
                          {districts.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.nombre} (+S/ {Number(d.tarifa_envio).toFixed(2)})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Info de Envío seleccionado */}
                    {selectedDistrict ? (
                      <div className="space-y-1.5 pt-2 text-xs">
                        <div className="flex justify-between font-bold">
                          <span className="text-neutral-400">Costo de Envío:</span>
                          <span className="text-white">S/ {shippingFee.toFixed(2)}</span>
                        </div>
                        {selectedDistrict.tiempo_estimado && (
                          <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-extrabold uppercase">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            ⚡ Tiempo Estimado: {selectedDistrict.tiempo_estimado}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 text-[10px] text-amber-400 font-semibold leading-relaxed pt-1">
                        <Info className="h-4 w-4 flex-shrink-0" />
                        <span>Por favor, selecciona un distrito para activar el delivery y ver el costo final.</span>
                      </div>
                    )}
                  </div>

                  <Separator className="bg-neutral-900" />

                  {/* Fila Total */}
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm uppercase font-black tracking-wider text-white">Total</span>
                    <span className="text-2xl font-black text-amber-400">
                      S/ {grandTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Botón de Checkout */}
                  <Button
                    onClick={handleOpenCheckout}
                    disabled={!selectedDistrictId}
                    className={`w-full h-12 text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                      selectedDistrictId
                        ? "bg-amber-400 text-neutral-950 hover:bg-amber-300 shadow-lg shadow-amber-400/5 hover:scale-[1.01] active:scale-[0.99]"
                        : "bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed"
                    }`}
                  >
                    <CreditCard className="mr-2 h-4 w-4 stroke-[2.5px]" />
                    Pagar con Tarjeta
                  </Button>

                  <p className="text-[9px] uppercase tracking-widest text-neutral-600 text-center leading-relaxed">
                    🔒 Transacciones cifradas SSL seguras respaldadas por Stripe
                  </p>
                </CardContent>
              </Card>
            </div>

          </div>
        )}

      </div>

      {/* STRIPE PREMIUM GLASSMORPHISM CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl text-white space-y-6 overflow-hidden max-h-[90vh] overflow-y-auto">
            
            {/* Glow decorativo de fondo */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-400/10 rounded-full filter blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-400/10 rounded-full filter blur-3xl pointer-events-none" />

            {!paymentSuccess ? (
              /* FORMULARIO DE PAGO STRIPE */
              <>
                <div className="flex justify-between items-center border-b border-neutral-900 pb-3">
                  <div>
                    <span className="text-[9px] uppercase font-black tracking-widest text-amber-400">Pasarela Segura</span>
                    <h3 className="text-base font-black tracking-wider flex items-center gap-1.5 text-white uppercase mt-0.5">
                      <CreditCard className="h-4 w-4 text-amber-400" />
                      Stripe Checkout
                    </h3>
                  </div>
                  <button 
                    onClick={() => setIsCheckoutOpen(false)}
                    disabled={paymentLoading}
                    className="text-neutral-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>

                {/* Resumen pedido */}
                <div className="bg-neutral-900/50 border border-neutral-900 p-3 rounded-xl space-y-1 text-xs text-left">
                  <div className="flex justify-between text-neutral-400">
                    <span>Código de Pedido:</span>
                    <span className="font-mono font-bold text-white">{orderCode}</span>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Envío a:</span>
                    <span className="font-bold text-white">{selectedDistrict?.nombre}</span>
                  </div>
                  <Separator className="bg-neutral-850 my-1.5" />
                  <div className="flex justify-between font-black text-sm">
                    <span>Monto Total:</span>
                    <span className="text-amber-400">S/ {grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Formulario de Checkout */}
                <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs">
                  {/* Correo */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="checkout-email" className="text-[9px] uppercase font-black tracking-wider text-neutral-400 block">
                      Correo Electrónico
                    </label>
                    <input 
                      type="email"
                      id="checkout-email"
                      required
                      placeholder="correo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={paymentLoading}
                      className="w-full h-10 px-3 rounded-xl border border-neutral-800 bg-black text-white focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  {/* Dirección de Envío */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="checkout-address" className="text-[9px] uppercase font-black tracking-wider text-neutral-400 block">
                      Dirección de Envío Completa
                    </label>
                    <input 
                      type="text"
                      id="checkout-address"
                      required
                      placeholder="Av. Larco 123, Dpto. 401, Miraflores"
                      value={direccionEnvio}
                      onChange={(e) => setDireccionEnvio(e.target.value)}
                      disabled={paymentLoading}
                      className="w-full h-10 px-3 rounded-xl border border-neutral-800 bg-black text-white focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  {/* Instrucciones de Entrega */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="checkout-notes" className="text-[9px] uppercase font-black tracking-wider text-neutral-400 block">
                      Instrucciones de Entrega (Notas opcionales)
                    </label>
                    <input 
                      type="text"
                      id="checkout-notes"
                      placeholder="Tocar timbre, dejar en recepción, etc."
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      disabled={paymentLoading}
                      className="w-full h-10 px-3 rounded-xl border border-neutral-800 bg-black text-white focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  {/* Stripe CardElement Component */}
                  <CardPaymentForm error={cardError} />

                  <Button
                    type="submit"
                    disabled={paymentLoading}
                    className="w-full h-12 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 mt-4 transition-all shadow-lg shadow-amber-400/5 cursor-pointer"
                  >
                    {paymentLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-neutral-950" />
                        Procesando pago seguro...
                      </>
                    ) : (
                      <>
                        Pagar S/ {grandTotal.toFixed(2)}
                      </>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              /* ÉXITO EN EL PAGO RECEIPT */
              <div className="text-center py-6 space-y-6 flex flex-col items-center animate-in zoom-in-95 duration-300">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-full filter blur-xl animate-pulse" />
                  <CheckCircle2 className="h-16 w-16 text-emerald-400 relative z-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase text-white tracking-wide">¡Pago Exitoso!</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-sm">
                    Tu transacción ha sido validada y procesada por Stripe. Hemos enviado los detalles del pedido a <strong className="text-neutral-300">{email}</strong>.
                  </p>
                </div>

                {/* Resumen final */}
                <div className="w-full bg-neutral-900/60 border border-neutral-800 p-4 rounded-2xl text-xs space-y-1.5 text-left">
                  <div className="flex justify-between text-neutral-500">
                    <span>N° Pedido:</span>
                    <span className="font-mono font-bold text-white">{orderCode}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Costo total:</span>
                    <span className="font-bold text-amber-400">S/ {grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Dirección:</span>
                    <span className="font-semibold text-neutral-300 truncate max-w-[200px]">{direccionEnvio}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Estado:</span>
                    <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[8px] px-2 py-0">
                      Confirmado
                    </Badge>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Tipo Envío:</span>
                    <span className="font-semibold text-neutral-300">Express ({selectedDistrict?.tiempo_estimado})</span>
                  </div>
                </div>

                <Button
                  onClick={handleFinishSuccess}
                  className="w-full h-11 bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Entendido & Volver al Inicio
                </Button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
