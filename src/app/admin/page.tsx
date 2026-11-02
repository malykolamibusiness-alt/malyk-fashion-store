import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { formatPrice } from "@/data/products";
import { requireAdmin } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Studio overview | MALYK",
  description: "Secure MALYK product and inventory administration.",
};

async function AdminOverview() {
  const { supabase, isAdmin } = await requireAdmin("/admin");
  if (!isAdmin) redirect("/account?access=denied");

  const [productsResult, variantsResult, recentResult, ordersResult, customersResult] = await Promise.all([
    supabase.from("products").select("id, status", { count: "exact" }),
    supabase
      .from("product_variants")
      .select("id", { count: "exact", head: true })
      .eq("active", true)
      .lte("stock_quantity", 5),
    supabase
      .from("products")
      .select("id, name, slug, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase.from("orders").select("id, status, total_minor, currency_code", { count: "exact" }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  const failure = productsResult.error ?? variantsResult.error ?? recentResult.error ?? ordersResult.error ?? customersResult.error;
  if (failure) {
    console.error("MALYK admin overview queries failed.", failure);
  }

  const products = productsResult.data ?? [];
  const recentProducts = recentResult.data ?? [];
  const orders = ordersResult.data ?? [];
  const pendingOrders = orders.filter((order) => order.status === "pending" || order.status === "processing").length;
  const completedOrders = orders.filter((order) => order.status === "paid").length;
  const revenueByCurrency = orders.reduce<Record<string, number>>((totals, order) => {
    if (order.status !== "cancelled" && order.status !== "failed" && order.status !== "refunded") {
      totals[order.currency_code] = (totals[order.currency_code] ?? 0) + order.total_minor;
    }
    return totals;
  }, {});
  const publishedCount = products.filter(
    (product) => product.status === "published",
  ).length;
  const draftCount = products.filter(
    (product) => product.status === "draft",
  ).length;

  return (
    <main className="admin-page">
      <Container>
        <p className="eyebrow">MALYK / Studio</p>
        <h1 className="admin-title">Overview</h1>
        <p className="admin-intro">
          Product and variant counts from the connected catalog. Orders and
          revenue are not part of this phase.
        </p>
        {failure ? (
          <p className="form-message form-message--error" role="alert">
            The dashboard could not load its database figures. Check the
            Supabase connection and try again.
          </p>
        ) : null}
        <div className="admin-metrics">
          <article>
            <span>Total products</span>
            <strong>{productsResult.count ?? products.length}</strong>
          </article>
          <article>
            <span>Published</span>
            <strong>{publishedCount}</strong>
          </article>
          <article>
            <span>Draft</span>
            <strong>{draftCount}</strong>
          </article>
          <article><span>Low-stock variants</span><strong>{variantsResult.count ?? 0}</strong></article>
          <article><span>Total orders</span><strong>{ordersResult.count ?? orders.length}</strong></article>
          <article><span>Pending / processing</span><strong>{pendingOrders}</strong></article>
          <article><span>Completed orders</span><strong>{completedOrders}</strong></article>
          <article><span>Customer profiles</span><strong>{customersResult.count ?? 0}</strong></article>
        </div>
        {Object.entries(revenueByCurrency).length ? <section className="admin-revenue" aria-label="Recorded order value"><h2>Recorded sales value</h2>{Object.entries(revenueByCurrency).map(([currency, amount]) => <p key={currency}><span>{currency}</span><strong>{formatPrice(amount, currency)}</strong></p>)}</section> : null}
        <div className="admin-quick-actions">
          <Link className="button button--primary" href="/admin/products/new">
            Add a product
          </Link>
          <Link className="button button--secondary" href="/admin/products">
            Manage products
          </Link>
          <Link className="button button--secondary" href="/admin/orders">
            Manage orders
          </Link>
          <Link className="button button--secondary" href="/admin/inventory">
            Manage inventory
          </Link>
          <Link className="button button--secondary" href="/admin/shipping">
            Configure shipping
          </Link>
        </div>
        <section className="admin-recent" aria-labelledby="recent-title">
          <h2 id="recent-title">Recently updated</h2>
          {recentProducts.length ? (
            <ul>
              {recentProducts.map((product) => (
                <li key={product.id}>
                  <Link href={`/admin/products/${product.id}/edit`}>
                    {product.name}
                  </Link>
                  <span>{product.status}</span>
                  <time dateTime={product.updated_at}>
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                    }).format(new Date(product.updated_at))}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p>
              {failure
                ? "Recent updates are unavailable."
                : "No products yet. Create a draft to start building the catalog."}
            </p>
          )}
        </section>
      </Container>
    </main>
  );
}

export default function AdminPage() {
  return <AdminOverview />;
}
