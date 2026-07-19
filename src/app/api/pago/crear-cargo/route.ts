import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const cartItemSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  slug: z.string(),
  cantidad: z.number().min(1),
  precio: z.number().min(0),
  volumen_ml: z.number(),
  imagen_url: z.string().optional().nullable(),
});

const crearCargoSchema = z.object({
  payment_method: z.string({ message: "Método de pago es requerido" }),
  email: z.string({ message: "Email es requerido" }).email({ message: "Email inválido" }),
  subtotal: z.number({ message: "Subtotal inválido" }).min(0),
  tarifa_envio: z.number({ message: "Tarifa de envío inválida" }).min(0),
  total: z.number({ message: "Total inválido" }).min(0),
  distrito_id: z.number({ message: "ID de distrito es requerido" }),
  direccion_envio: z.string({ message: "Dirección de envío es requerida" }).min(1),
  notas: z.string().optional().nullable(),
  items: z.array(cartItemSchema).min(1, { message: "El carrito no puede estar vacío" }),
});

export async function POST(request: Request) {
  try {
    // 1. Authenticate user session
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para continuar." },
        { status: 401 }
      );
    }

    // 2. Validate input schema
    const body = await request.json();
    const validation = crearCargoSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Datos inválidos";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const data = validation.data;

    // 3. Reserve stock in series using Postgres RPC decrementar_stock_seguro
    const reservedItems: { productId: number; cantidad: number }[] = [];
    let stockSufficient = true;
    let errorMessage = "";

    for (const item of data.items) {
      // Decode composite ID (productId * 10000 + volume) to get the original product ID
      const productId = Math.floor(item.id / 10000);
      
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        "decrementar_stock_seguro",
        {
          p_product_id: productId,
          p_cantidad: item.cantidad,
        }
      );

      if (rpcError) {
        stockSufficient = false;
        errorMessage = `Error al verificar stock para ${item.nombre}: ${rpcError.message}`;
        break;
      }

      // Format response as RPC returns Table
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      
      if (!row || !row.exitoso) {
        stockSufficient = false;
        errorMessage = row?.mensaje || `Stock insuficiente para ${item.nombre}`;
        break;
      }

      reservedItems.push({ productId, cantidad: item.cantidad });
    }

    // Abort if stock is insufficient
    if (!stockSufficient) {
      // Rollback already reserved stock using negative quantities (reverts decrements)
      for (const reserved of reservedItems) {
        await supabase.rpc("decrementar_stock_seguro", {
          p_product_id: reserved.productId,
          p_cantidad: -reserved.cantidad,
        });
      }
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // 4. Create and confirm Stripe PaymentIntent
    let paymentIntent: Stripe.PaymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.total * 100), // convert to cents
        currency: "pen",
        payment_method: data.payment_method,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        return_url: `${request.headers.get("origin") || "http://localhost:3000"}/carrito`,
      });
    } catch (stripeError) {
      const errorMsg = stripeError instanceof Error ? stripeError.message : "Error desconocido";
      // Rollback reserved stock
      for (const reserved of reservedItems) {
        await supabase.rpc("decrementar_stock_seguro", {
          p_product_id: reserved.productId,
          p_cantidad: -reserved.cantidad,
        });
      }
      return NextResponse.json(
        { error: `Pago rechazado: ${errorMsg}` },
        { status: 400 }
      );
    }

    // 5. Insert rows into database using Admin Client
    const adminClient = createAdminClient();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `KF-${dateStr}-${randomSuffix}`;

    const { data: order, error: orderError } = await adminClient
      .from("kleiner_orders")
      .insert({
        usuario_id: user.id,
        codigo_pedido: orderCode,
        estado: "confirmado",
        subtotal: data.subtotal,
        tarifa_envio: data.tarifa_envio,
        total: data.total,
        distrito_id: data.distrito_id,
        direccion_envio: data.direccion_envio,
        notas: data.notas,
        culqi_charge_id: paymentIntent.id, // Save Stripe PaymentIntent ID
        metodo_pago: "tarjeta",
        pago_estado: paymentIntent.status === "succeeded" ? "exitoso" : "procesando",
        pagado_en: paymentIntent.status === "succeeded" ? new Date().toISOString() : null,
        pago_metadata: JSON.parse(JSON.stringify(paymentIntent)),
        estado_delivery: "pendiente",
        origen: "web",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order insertion failed:", orderError);
      // Revert reserved stock
      for (const reserved of reservedItems) {
        await supabase.rpc("decrementar_stock_seguro", {
          p_product_id: reserved.productId,
          p_cantidad: -reserved.cantidad,
        });
      }
      return NextResponse.json(
        { error: `Error al registrar el pedido: ${orderError.message}` },
        { status: 500 }
      );
    }

    // Insert order items
    const orderItemsInsert = data.items.map((item) => ({
      order_id: order.id,
      product_id: Math.floor(item.id / 10000),
      cantidad: item.cantidad,
      precio_unitario: item.precio,
      subtotal: item.precio * item.cantidad,
    }));

    const { error: itemsError } = await adminClient
      .from("kleiner_order_items")
      .insert(orderItemsInsert);

    if (itemsError) {
      console.error("Order items insertion failed:", itemsError);
      // Delete order to avoid orphan row
      await adminClient.from("kleiner_orders").delete().eq("id", order.id);
      // Revert reserved stock
      for (const reserved of reservedItems) {
        await supabase.rpc("decrementar_stock_seguro", {
          p_product_id: reserved.productId,
          p_cantidad: -reserved.cantidad,
        });
      }
      return NextResponse.json(
        { error: `Error al registrar los items del pedido: ${itemsError.message}` },
        { status: 500 }
      );
    }

    // Desactivar el carrito activo del usuario — el pedido ya quedó registrado en kleiner_orders/kleiner_order_items.
    // Sin esto, kleiner_cart_items sigue mostrando los productos ya pagados (riesgo de pedido duplicado).
    const { error: cartDeactivateError } = await adminClient
      .from("kleiner_cart_sessions")
      .update({ activo: false, actualizado_en: new Date().toISOString() })
      .eq("usuario_id", user.id)
      .eq("activo", true);

    if (cartDeactivateError) {
      console.error("Error desactivando carrito tras el pago:", cartDeactivateError);
    }

    return NextResponse.json({
      success: true,
      orderCode,
      orderId: order.id,
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error desconocido";
    console.error("Server checkout error:", err);
    return NextResponse.json(
      { error: `Error interno de servidor: ${errorMsg}` },
      { status: 500 }
    );
  }
}
