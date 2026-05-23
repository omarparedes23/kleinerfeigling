import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      console.error("Webhook signature verification failed:", errorMsg);
      return NextResponse.json(
        { error: `Webhook Error: ${errorMsg}` },
        { status: 400 }
      );
    }
  } else {
    // Safe fallback for local development or testing environments when secret is not defined
    console.warn("Stripe Webhook Secret not configured. Parsing raw event payload directly.");
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      return NextResponse.json(
        { error: `Failed to parse event body: ${errorMsg}` },
        { status: 400 }
      );
    }
  }

  // Process the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const chargeId = paymentIntent.id;

    const adminClient = createAdminClient();

    // 1. Fetch current order to check payment status (Idempotency)
    const { data: order, error: fetchError } = await adminClient
      .from("kleiner_orders")
      .select("id, pago_estado")
      .eq("culqi_charge_id", chargeId)
      .maybeSingle();

    if (fetchError) {
      console.error("Error looking up order for webhook charge:", fetchError);
      return NextResponse.json(
        { error: "Order lookup failed" },
        { status: 500 }
      );
    }

    if (!order) {
      console.warn(`No order found associated with Stripe PaymentIntent ID: ${chargeId}`);
      return NextResponse.json({ received: true, status: "order_not_found" });
    }

    // 2. Idempotency safeguard check: skip processing if already successful
    if (order.pago_estado === "exitoso") {
      console.log(`Order ${order.id} is already processed and marked as exitoso. Skipping.`);
      return NextResponse.json({ received: true, status: "already_processed" });
    }

    // 3. Commit order update: pago_estado -> exitoso, pagado_en -> now
    const { error: updateError } = await adminClient
      .from("kleiner_orders")
      .update({
        pago_estado: "exitoso",
        pagado_en: new Date().toISOString(),
        pago_metadata: JSON.parse(JSON.stringify(paymentIntent)),
        estado: "confirmado",
      })
      .eq("id", order.id);

    if (updateError) {
      console.error(`Failed to update status for order ID ${order.id}:`, updateError);
      return NextResponse.json(
        { error: "Database update failed" },
        { status: 500 }
      );
    }

    console.log(`Successfully confirmed payment for order ID ${order.id} via webhook trigger.`);
  }

  return NextResponse.json({ received: true });
}
