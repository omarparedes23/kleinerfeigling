import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  CreditCard, 
  ChevronRight, 
  Sparkles,
  ShoppingBag
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function PedidosPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch orders descending by date
  const { data: orders } = await supabase
    .from("kleiner_orders")
    .select("*")
    .eq("usuario_id", user.id)
    .order("creado_en", { ascending: false });

  // Format date helper in Spanish style
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-PE", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).toUpperCase();
  };

  // Helper for delivery status badge styles
  const getDeliveryStatusDetails = (status: string | null) => {
    const normalized = (status || "Pendiente").toLowerCase();
    switch (normalized) {
      case "entregado":
        return { text: "Entregado", classes: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" };
      case "en camino":
        return { text: "En Camino 🚀", classes: "bg-blue-500/10 border-blue-500/30 text-blue-400" };
      case "en preparacion":
      case "en preparación":
        return { text: "En Preparación", classes: "bg-purple-500/10 border-purple-500/30 text-purple-400" };
      case "confirmado":
        return { text: "Confirmado", classes: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" };
      default:
        return { text: "Pendiente", classes: "bg-amber-500/10 border-amber-500/30 text-amber-400" };
    }
  };

  // Helper for payment status badge styles
  const getPaymentStatusDetails = (status: string | null) => {
    const normalized = (status || "pendiente").toLowerCase();
    if (normalized === "aprobado" || normalized === "pagado") {
      return { text: "PAGADO", classes: "bg-emerald-500 text-neutral-950 font-black" };
    }
    if (normalized === "rechazado" || normalized === "fallido") {
      return { text: "FALLIDO", classes: "bg-rose-500 text-white font-black" };
    }
    return { text: "PENDIENTE", classes: "bg-amber-400 text-neutral-950 font-black animate-pulse" };
  };

  return (
    <div className="space-y-8">
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
          <Ticket className="h-6 w-6 text-amber-400 rotate-[-10deg]" />
          Mis Pases de Fiesta (Pedidos)
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Historial de compras y accesos VIP de Kleiner Feigling. Haz clic en cualquier pase para ver el tracking en tiempo real.
        </p>
      </div>

      {/* Orders List / Tickets */}
      {!orders || orders.length === 0 ? (
        <div className="rounded-2xl border border-neutral-900 border-dashed bg-neutral-950/20 p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-neutral-900/60 flex items-center justify-center text-neutral-700">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No tienes pases de fiesta activos</h3>
            <p className="text-xs text-neutral-500 max-w-[300px]">
              Tus compras se registrarán aquí como pases premium con tracking en vivo.
            </p>
          </div>
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 h-10 text-xs font-black text-neutral-950 hover:bg-amber-300 transition-all uppercase tracking-wider"
          >
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const delivery = getDeliveryStatusDetails(order.estado);
            const payment = getPaymentStatusDetails(order.pago_estado);
            const dateFormatted = formatDate(order.creado_en);

            return (
              <div 
                key={order.id}
                className="relative group overflow-hidden rounded-3xl border border-neutral-900 bg-neutral-950/40 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/20 hover:shadow-[0_0_30px_rgba(163,230,53,0.05)]"
              >
                {/* Background decorative glow on hover */}
                <div className="absolute -right-20 -bottom-20 w-44 h-44 rounded-full bg-amber-400/5 filter blur-[50px] group-hover:bg-amber-400/10 transition-all duration-500" />
                
                <div className="flex flex-col md:flex-row items-stretch">
                  
                  {/* Left Side: Ticket Main Pass Details */}
                  <div className="flex-1 p-6 md:p-8 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-amber-400 tracking-[0.2em] flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          KF Nightclub Pass
                        </span>
                        <h3 className="text-xl font-black text-white tracking-wide uppercase">
                          CÓDIGO: {order.codigo_pedido}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${delivery.classes} uppercase tracking-wider font-extrabold text-[8px] px-2 py-0.5 border`}>
                          {delivery.text}
                        </Badge>
                        <Badge className={`${payment.classes} uppercase tracking-wider font-black text-[8px] px-2 py-0.5 border border-transparent`}>
                          {payment.text}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-900/60">
                      {/* Date details */}
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-500 group-hover:text-amber-400 transition-colors">
                          <Calendar className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Fecha Pase</span>
                          <span className="text-[11px] font-bold text-neutral-200 block truncate">{dateFormatted}</span>
                        </div>
                      </div>

                      {/* Shipping details */}
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-500 group-hover:text-amber-400 transition-colors">
                          <MapPin className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Destino Envío</span>
                          <span className="text-[11px] font-bold text-neutral-200 block truncate max-w-[150px]">{order.direccion_envio}</span>
                        </div>
                      </div>

                      {/* Payment method */}
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-neutral-900 flex items-center justify-center text-neutral-500 group-hover:text-amber-400 transition-colors">
                          <CreditCard className="h-4.5 w-4.5" />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-black uppercase text-neutral-500 tracking-wider">Método Pago</span>
                          <span className="text-[11px] font-bold text-neutral-200 block uppercase">{order.metodo_pago || "MercadoPago"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Horizontal/Vertical Tear-off strip decorative line */}
                  <div className="relative flex items-center justify-center py-2 md:py-0">
                    <div className="absolute left-0 right-0 top-0 bottom-0 flex md:flex-col items-center justify-between pointer-events-none">
                      <div className="h-4 w-4 md:h-6 md:w-6 rounded-full bg-black -ml-2 md:-mt-3 border-r border-neutral-900" />
                      <div className="hidden md:block flex-1 border-r border-dashed border-neutral-800 my-4" />
                      <div className="md:hidden flex-1 border-b border-dashed border-neutral-800 mx-4 w-full" />
                      <div className="h-4 w-4 md:h-6 md:w-6 rounded-full bg-black -mr-2 md:-mb-3 border-l border-neutral-900" />
                    </div>
                  </div>

                  {/* Right Side: Ticket Stub Tear-off Coupon */}
                  <div className="w-full md:w-60 p-6 md:p-8 bg-neutral-900/10 flex flex-col justify-center items-center md:items-end text-center md:text-right border-t md:border-t-0 md:border-l border-neutral-900/50 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[8px] font-black uppercase text-neutral-500 tracking-[0.2em] block">
                        Costo Total
                      </span>
                      <span className="text-2xl font-black text-amber-400 block tracking-tight">
                        S/ {Number(order.total).toFixed(2)}
                      </span>
                    </div>

                    {/* Barcode representation */}
                    <div className="hidden sm:flex flex-col items-center opacity-30 select-none">
                      <div className="flex h-6 items-end gap-[1px]">
                        {[2,1,3,1,2,4,1,2,3,1,1,2,3,4,1,2,1,3,2,1].map((w, i) => (
                          <div 
                            key={i} 
                            className="bg-white h-full" 
                            style={{ width: `${w}px` }} 
                          />
                        ))}
                      </div>
                      <span className="text-[6px] tracking-[0.4em] text-white mt-1">*{order.id}*</span>
                    </div>

                    <Link
                      href={`/pedido/${order.id}`}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-white text-neutral-950 font-black h-10 px-4 text-[10px] uppercase tracking-wider hover:bg-amber-400 transition-all cursor-pointer shadow-md shadow-white/5 active:scale-95"
                    >
                      Ver Tracking
                      <ChevronRight className="h-3.5 w-3.5 stroke-[3px]" />
                    </Link>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
