import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secretKey || !webhookSecret) return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = new Stripe(secretKey).webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed.", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== "paid") return NextResponse.json({ received: true });
      const orderId = session.metadata?.order_id;
      if (!orderId || typeof session.amount_total !== "number" || !session.currency) {
        return NextResponse.json({ error: "Invalid completed session metadata." }, { status: 400 });
      }
      const admin = createServiceRoleClient();
      const { error } = await admin.rpc("mark_payment_succeeded", {
        p_order_id: orderId,
        p_provider: "stripe",
        p_reference: session.id,
        p_amount_minor: session.amount_total,
        p_currency_code: session.currency,
        p_event_id: event.id,
      });
      if (error) throw error;
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed.", error);
    return NextResponse.json({ error: "Webhook could not be processed." }, { status: 500 });
  }
}
