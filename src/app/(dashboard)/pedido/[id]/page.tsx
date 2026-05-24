import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Truck, 
  User, 
  Sparkles, 
  CreditCard,
  CheckCircle2,
  Calendar,
  Gift
} from "lucide-react";
import { getFlavorTheme } from "@/types/product";

interface PedidoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PedidoPage({ params }: PedidoPageProps) {
  const resolvedParams = await params;
  const orderId = Number(resolvedParams.id);
  
  if (isNaN(orderId)) {
    redirect("/pedidos");
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Query specific order joined with its shipping district details
  const { data: order } = await supabase
    .from("kleiner_orders")
    .select(`
      *,
      distrito:kleiner_distritos(*)
    `)
    .eq("id", orderId)
    .single();

  if (!order || order.usuario_id !== user.id) {
    redirect("/pedidos");
  }

  // Query order items joined with their original product records
  const { data: items } = await supabase
    .from("kleiner_order_items")
    .select(`
      *,
      producto:kleiner_products(*)
    `)
    .eq("order_id", orderId);

  // Extract primary ordered product sabor to apply cohesive color styling matching that flavor
  const primarySabor = items?.[0]?.producto?.sabor || "original";
  const theme = getFlavorTheme(primarySabor);

  // Normalization logic to locate index pointer for the tracking progress stepper
  const getStepIndex = (estado: string | null): number => {
    const norm = (estado || "Pendiente").toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // strips accent marks
    if (norm === "pendiente") return 0;
    if (norm === "confirmado") return 1;
    if (norm === "en preparacion" || norm === "preparacion" || norm === "preparando") return 2;
    if (norm === "en camino" || norm === "despachado" || norm === "enviado") return 3;
    if (norm === "entregado" || norm === "completado" || norm === "finalizado") return 4;
    return 0;
  };

  const currentStepIndex = getStepIndex(order.estado);

  const stepperGradient = theme.text.includes("lime")
    ? "from-amber-400 to-emerald-400"
    : theme.text.includes("cyan")
    ? "from-cyan-400 to-teal-400"
    : theme.text.includes("pink")
    ? "from-pink-400 to-rose-400"
    : theme.text.includes("red")
    ? "from-red-400 to-rose-500"
    : "from-indigo-500 to-purple-500";

  const STEPS = [
    { label: "Pendiente", desc: "A la espera de pago" },
    { label: "Confirmado", desc: "Pago validado" },
    { label: "En Preparación", desc: "Congelando botellas" },
    { label: "En Camino", desc: "Courier KF despachado" },
    { label: "Entregado", desc: "¡Disfruta de la fiesta!" },
  ];

  return (
    <div className="space-y-8">
      {/* Return button */}
      <div>
        <Link 
          href="/pedidos"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-neutral-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver a mis pases
        </Link>
      </div>

      {/* Main Order Header Summary */}
      <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase text-amber-400 tracking-[0.2em] flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Live Order tracking
            </span>
            <span className="text-[10px] text-neutral-500 font-bold">•</span>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
              {order.codigo_pedido}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
            Pedido #{order.id}
          </h1>
          <p className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Creado el {new Date(order.creado_en).toLocaleString("es-PE")}
          </p>
        </div>

        <div className="flex flex-col md:items-end">
          <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Total Cancelado</span>
          <span className={`text-2xl sm:text-3xl font-black ${theme.text} tracking-tight`}>
            S/ {Number(order.total).toFixed(2)}
          </span>
        </div>
      </div>

      {/* RENDER STEPPER: Responsive Nightclub progress workflow */}
      <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl p-6 sm:p-8 space-y-8 shadow-xl relative overflow-hidden">
        <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-6">
          Estado del Delivery Express
        </h3>

        {/* Stepper Pipeline (Desktop Layout) */}
        <div className="hidden md:block relative pt-4 pb-8">
          {/* Connector base pipelines */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-neutral-900 rounded-full transform -translate-y-1/2" />
          <div 
            className={`absolute top-1/2 left-0 h-1 bg-gradient-to-r ${stepperGradient} rounded-full transform -translate-y-1/2 transition-all duration-1000`} 
            style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
          />

          <div className="relative flex justify-between">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isActive = index === currentStepIndex;
              const isMuted = index > currentStepIndex;

              return (
                <div key={index} className="flex flex-col items-center text-center space-y-3 w-36 relative z-10">
                  {/* Bubble node selector */}
                  <div 
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      isActive 
                        ? `${theme.border} bg-neutral-950 text-white animate-pulse shadow-[0_0_20px_${theme.glow.includes("99,102") ? "rgba(99,102,241,0.6)" : theme.glow.includes("132,204") ? "rgba(132,204,22,0.6)" : "rgba(34,211,238,0.6)"}] scale-110` 
                        : isCompleted
                        ? `bg-gradient-to-tr ${stepperGradient} border-transparent text-neutral-950 font-black shadow-[0_0_15px_rgba(163,230,53,0.3)]`
                        : "bg-neutral-900 border-neutral-800 text-neutral-600 opacity-50"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 stroke-[2.5px]" />
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>

                  <div className={isMuted ? "opacity-40" : "opacity-100"}>
                    <p className={`text-xs font-black uppercase tracking-wider ${isActive ? theme.text : "text-white"}`}>
                      {step.label}
                    </p>
                    <p className="text-[9px] text-neutral-500 font-medium mt-0.5 leading-tight">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stepper Pipeline (Mobile Layout - Vertical Stepper) */}
        <div className="md:hidden relative space-y-6 pl-8">
          {/* Connector Vertical Pipeline Line */}
          <div className="absolute top-4 bottom-4 left-[15px] w-1 bg-neutral-900 rounded-full" />
          <div 
            className={`absolute top-4 left-[15px] w-1 bg-gradient-to-b ${stepperGradient} rounded-full transition-all duration-1000`} 
            style={{ height: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex;
            const isMuted = index > currentStepIndex;

            return (
              <div key={index} className="relative flex gap-4 items-start">
                {/* Bubble selector node node */}
                <div 
                  className={`absolute -left-[28px] h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 z-10 ${
                    isActive 
                      ? `${theme.border} bg-neutral-950 text-white animate-pulse shadow-[0_0_15px_rgba(163,230,53,0.5)] scale-110` 
                      : isCompleted
                      ? `bg-gradient-to-tr ${stepperGradient} border-transparent text-neutral-950 font-black`
                      : "bg-neutral-900 border-neutral-800 text-neutral-600 opacity-50"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5px]" />
                  ) : (
                    <span className="text-[10px] font-bold">{index + 1}</span>
                  )}
                </div>

                <div className={`space-y-0.5 ${isMuted ? "opacity-30" : "opacity-100"}`}>
                  <p className={`text-xs font-black uppercase tracking-wider ${isActive ? theme.text : "text-white"}`}>
                    {step.label}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-semibold leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Products list inside pedestals */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl p-6 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">
              Items del Pedido
            </h3>
            
            <div className="divide-y divide-neutral-900 space-y-4">
              {items?.map((item) => (
                <div key={item.id} className="flex gap-4 pt-4 first:pt-0 items-center justify-between">
                  <div className="flex gap-4 items-center">
                    {/* Pedestal premium bottle showcase */}
                    <div className="relative h-16 w-16 rounded-xl bg-gradient-to-b from-white to-neutral-50/95 border border-neutral-200/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.06),0_4px_8px_-2px_rgba(0,0,0,0.2)] overflow-hidden flex items-center justify-center p-2 flex-shrink-0">
                      {item.producto?.imagen_url ? (
                        <img 
                          src={item.producto.imagen_url} 
                          alt={item.producto.nombre} 
                          className="object-contain max-h-full max-w-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] mix-blend-multiply" 
                        />
                      ) : (
                        <Gift className="h-6 w-6 text-neutral-400" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white tracking-wide">
                        {item.producto?.nombre || "KF Bottle"}
                      </h4>
                      <p className="text-xs text-neutral-500 font-semibold flex items-center gap-1.5">
                        <span>{item.producto?.volumen_ml || 250} ml</span>
                        <span>•</span>
                        <span>Sabor: {item.producto?.sabor || "Original"}</span>
                      </p>
                      <p className="text-xs text-neutral-400 font-semibold">
                        S/ {Number(item.precio_unitario).toFixed(2)} x {item.cantidad} u.
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-white">
                      S/ {Number(item.subtotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations summaries */}
            <div className="mt-6 pt-6 border-t border-neutral-900/60 space-y-2 text-xs font-semibold text-neutral-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>S/ {Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Costo de Envío ({order.distrito?.nombre || "Lima"})</span>
                <span>S/ {Number(order.tarifa_envio).toFixed(2)}</span>
              </div>
              {Number(order.descuento) > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Descuento Especial</span>
                  <span>- S/ {Number(order.descuento).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-neutral-900/40">
                <span className="uppercase tracking-wider">Total</span>
                <span className={theme.text}>S/ {Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Dispatch Details and Courier Assignment Card */}
        <div className="lg:col-span-4 space-y-6">
          {/* Dispatch address details */}
          <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 border-b border-neutral-900 pb-2">
              Datos de Despacho
            </h3>

            <div className="space-y-3.5">
              <div className="flex gap-3 items-start">
                <MapPin className="h-4.5 w-4.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Dirección de Entrega</span>
                  <p className="text-xs text-neutral-200 font-bold leading-relaxed">{order.direccion_envio}</p>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase">{order.distrito?.nombre || "Lima"}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <Clock className="h-4.5 w-4.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Tiempo Estimado Courier</span>
                  <p className="text-xs text-neutral-200 font-bold">{order.distrito?.tiempo_estimado || "Express (mismo día)"}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <CreditCard className="h-4.5 w-4.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Método de Pago</span>
                  <p className="text-xs text-neutral-200 font-bold uppercase">{order.metodo_pago || "Tarjeta"}</p>
                  <p className="text-[10px] text-neutral-500 font-bold uppercase">Estado: {order.pago_estado}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Courier Assignment Card */}
          {order.repartidor_asignado ? (
            <div className="rounded-2xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl p-5 space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-1.5 w-16 bg-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400 flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-amber-400" />
                Courier Asignado
              </h3>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-neutral-900 flex items-center justify-center text-sm font-black text-amber-400 border border-neutral-800 uppercase">
                  {order.repartidor_asignado[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{order.repartidor_asignado}</p>
                  <p className="text-[9px] text-neutral-500 font-black uppercase tracking-wider">Motorizado Oficial KF</p>
                </div>
              </div>

              {order.notas && (
                <div className="bg-neutral-900/40 p-3 rounded-xl border border-neutral-850 text-[11px] text-neutral-400 leading-relaxed">
                  <span className="font-black text-[8px] uppercase tracking-wider block mb-1 text-neutral-500">Notas de Despacho</span>
                  "{order.notas}"
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-900 border-dashed bg-neutral-950/20 p-6 text-center space-y-2">
              <User className="h-5 w-5 text-neutral-700 mx-auto" />
              <h4 className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Asignación Courier</h4>
              <p className="text-xs text-neutral-500 max-w-[200px] mx-auto leading-relaxed">
                El repartidor se asignará de inmediato una vez que el pedido pase a la fase de preparación en bodega.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
