export const instant = false;

import Stripe from "stripe";
import { Container } from "@/components/ui/Container";
import { requireUser } from "@/lib/auth/server";
import { ClearPaidCart } from "@/features/checkout/ClearPaidCart";

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase, user } = await requireUser("/checkout/success");
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : "";
  const provider = typeof params.provider === "string" ? params.provider : "";
  let verified = false;
  let providerAmountMinor = 0;
  let providerCurrency = "";
  let orderId = "";

  try {
    if (sessionId && process.env.STRIPE_SECRET_KEY) {
      const session = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(sessionId);
      orderId = session.metadata?.order_id ?? "";
      verified = session.payment_status === "paid" && Boolean(orderId);
      providerAmountMinor = session.amount_total ?? 0;
      providerCurrency = (session.currency ?? "").toUpperCase();
    } else if (provider === "paystack" && typeof params.reference === "string" && process.env.PAYSTACK_SECRET_KEY) {
      const reference = params.reference;
      const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });
      const result = await response.json() as { status?: boolean; data?: { status?: string; amount?: number; currency?: string; reference?: string; metadata?: { order_id?: string } } };
      orderId = result.data?.metadata?.order_id ?? "";
      verified = response.ok && Boolean(result.status) && result.data?.status === "success" && Boolean(orderId);
      providerAmountMinor = result.data?.amount ?? 0;
      providerCurrency = (result.data?.currency ?? "").toUpperCase();
    }
  } catch (error) {
    console.error("Checkout payment verification failed.", error);
  }

  let order: { id: string; payment_status: string; total_minor: number; currency_code: string } | null = null;
  if (orderId) {
    const result = await supabase
      .from("orders")
      .select("id, payment_status, total_minor, currency_code")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();
    order = result.data;
  }
  if (!order) verified = false;
  const providerMatchesOrder = Boolean(
    order && verified && providerAmountMinor === order.total_minor && providerCurrency === order.currency_code,
  );
  const confirmed = order?.payment_status === "succeeded" || providerMatchesOrder;
  return (
    <main id="main-content" className="checkout-page"><Container>
      <p className="eyebrow">MALYK / Confirmation</p>
      {confirmed ? <ClearPaidCart /> : null}
      <h1>{confirmed ? "Payment confirmed" : "Payment is being confirmed"}</h1>
      <p>{confirmed && order ? `Thank you. Your order reference is ${order.id}.` : "Your provider is processing the payment. You will receive an email when confirmation is complete; this page is not payment proof."}</p>
    </Container></main>
  );
}
