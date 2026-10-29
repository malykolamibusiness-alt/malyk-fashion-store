export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { formatPrice } from "@/data/products";
import { requireUser } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Order history | MALYK", description: "View your MALYK order history." };

export default async function OrdersPage() {
  const { supabase, user } = await requireUser("/account/orders");
  const { data: orders, error } = await supabase.from("orders").select("id, created_at, total_minor, currency_code, payment_status, fulfilment_status").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
  return (
    <main id="main-content" className="account-page">
      <Container>
        <Link className="back-link" href="/account">← Account</Link>
        <p className="eyebrow">MALYK / Orders</p><h1>Order history.</h1>
        {error ? <p className="form-message form-message--error" role="alert">Orders could not be loaded.</p> : null}
        {orders?.length ? <div className="order-history-list">{orders.map((order) => (
          <article key={order.id} className="order-history-card">
            <div><span>Order</span><strong>#{order.id.slice(0, 8).toUpperCase()}</strong><time dateTime={order.created_at}>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(order.created_at))}</time></div>
            <div><span>Total</span><strong>{formatPrice(order.total_minor, order.currency_code)}</strong></div>
            <div><span>Status</span><strong>{order.payment_status} · {order.fulfilment_status}</strong></div>
            <Link className="button button--secondary" href={`/account/orders/${order.id}`}>View order</Link>
          </article>
        ))}</div> : !error ? <p className="account-empty">You have not placed an order yet.</p> : null}
      </Container>
    </main>
  );
}
