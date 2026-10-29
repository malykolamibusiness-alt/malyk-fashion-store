import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) return NextResponse.json({ error: "Paystack webhook is not configured." }, { status: 503 });
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", secretKey).update(rawBody).digest("hex");
  if (signature !== expected) return NextResponse.json({ error: "Invalid signature." }, { status: 400 });

  try {
    const event = JSON.parse(rawBody) as { event?: string; data?: { reference?: string } };
    if (event.event !== "charge.success" || !event.data?.reference) return NextResponse.json({ received: true });
    const verification = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(event.data.reference)}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const result = await verification.json() as { status?: boolean; data?: { status?: string; amount?: number; currency?: string; reference?: string; metadata?: { order_id?: string } } };
    const data = result.data;
    if (!verification.ok || !result.status || data?.status !== "success" || !data.reference || !data.metadata?.order_id) {
      return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
    }
    const admin = createServiceRoleClient();
    const amountMinor = data.amount as number;
    const currency = data.currency as string;
    const { error } = await admin.rpc("mark_payment_succeeded", {
      p_order_id: data.metadata.order_id,
      p_provider: "paystack",
      p_reference: data.reference,
      p_amount_minor: amountMinor,
      p_currency_code: currency,
      p_event_id: `${event.event}-${data.reference}`,
    });
    if (error) throw error;
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook processing failed.", error);
    return NextResponse.json({ error: "Webhook could not be processed." }, { status: 500 });
  }
}
