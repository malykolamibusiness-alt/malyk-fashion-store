export const instant = false;

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { InventoryAdjustmentForm } from "@/features/admin/InventoryAdjustmentForm";
import { requireAdmin } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Inventory | MALYK Studio", description: "Manage MALYK variant inventory." };
export default async function AdminInventoryPage() {
  const { supabase, isAdmin } = await requireAdmin("/admin/inventory");
  if (!isAdmin) redirect("/account?access=denied");
  const { data: variants, error } = await supabase.from("product_variants").select("id, sku, size, color_name, stock_quantity, products(name)").order("stock_quantity", { ascending: true });
  return <main className="admin-page"><Container><p className="eyebrow">MALYK / Studio</p><h1 className="admin-title">Inventory</h1>
    {error ? <p className="form-message form-message--error" role="alert">Inventory could not be loaded.</p> : null}
    <div className="inventory-list">{variants?.map((variant) => {
      const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
      return <article key={variant.id}><div><strong>{product?.name ?? "Product"}</strong><p>{variant.sku} · {variant.size} · {variant.color_name}</p></div><InventoryAdjustmentForm variantId={variant.id} stock={variant.stock_quantity} /></article>;
    })}</div>
  </Container></main>;
}
