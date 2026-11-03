export const instant = false;

import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { formatPrice } from "@/data/products";
import { Container } from "@/components/ui/Container";
import { AccountProfileForm } from "@/features/auth/AccountProfileForm";
import { signOutAction } from "@/features/auth/actions";
import { requireUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Your account | MALYK",
  description: "View and update your MALYK customer profile.",
};

type AccountPageProps = {
  searchParams: Promise<{ access?: string | string[] }>;
};

async function AccountContent({ searchParams }: AccountPageProps) {
  await connection();
  const params = await searchParams;
  const { supabase, user } = await requireUser("/account");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, phone, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("MALYK profile could not be loaded.", error);
  }
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("id, created_at, total_minor, currency_code, payment_status, fulfilment_status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3);
  const { count: orderCount } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <main id="main-content" className="account-page">
      <Container className="account-page__inner">
        <p className="eyebrow">MALYK / Account</p>
        <h1>Your account.</h1>
        <p className="account-page__email">{user.email}</p>
        <div className="account-dashboard-cards">
          <div><span>Member since</span><strong>{new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(user.created_at))}</strong></div>
          <div><span>Total orders</span><strong>{orderCount ?? 0}</strong></div>
        </div>
        <section className="account-recent-orders">
          <div className="account-section-heading"><h2>Recent orders</h2><Link href="/account/orders">View all</Link></div>
          {recentOrders?.length ? recentOrders.map((order) => (
            <Link key={order.id} className="account-order-row" href={`/account/orders/${order.id}`}>
              <span><strong>#{order.id.slice(0, 8).toUpperCase()}</strong><small>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(order.created_at))}</small></span>
              <span>{order.payment_status}</span>
              <strong>{formatPrice(order.total_minor, order.currency_code)}</strong>
            </Link>
          )) : <p className="account-empty">You have not placed an order yet.</p>}
        </section>
        {params.access === "denied" ? (
          <p className="form-message form-message--error" role="alert">
            This account does not have administrator access.
          </p>
        ) : null}
        {error || !profile ? (
          <p className="form-message form-message--error" role="alert">
            Your profile is not available yet. Please try again later.
          </p>
        ) : (
          <AccountProfileForm
            initialAvatarUrl={profile.avatar_url}
            initialDisplayName={profile.display_name}
            initialPhone={profile.phone}
          />
        )}
        <nav className="account-links" aria-label="Account sections">
          <Link href="/account/orders">Order history</Link>
          <Link href="/account/addresses">Saved addresses</Link>
        </nav>
        <form action={signOutAction}>
          <button className="button button--secondary" type="submit">
            Sign out
          </button>
        </form>
      </Container>
    </main>
  );
}

export default function AccountPage(props: AccountPageProps) {
  return (
    <Suspense fallback={<p className="account-loading">Loading account…</p>}>
      <AccountContent {...props} />
    </Suspense>
  );
}
