import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { formatPrice } from "@/data/products";
import { ArchiveProductForm } from "@/features/admin/ArchiveProductForm";
import { requireAdmin } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Products | MALYK Studio",
  description: "Manage MALYK product drafts and published styles.",
};

async function ProductList({ searchParams }: { searchParams: Promise<{ search?: string; status?: string }> }) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const { supabase, isAdmin } = await requireAdmin("/admin/products");
  if (!isAdmin) redirect("/account?access=denied");

  let productQuery = supabase
    .from("products")
    .select("id, name, slug, status, currency_code, price_minor, updated_at")
    .order("updated_at", { ascending: false });
  if (search) productQuery = productQuery.ilike("name", `%${search}%`);
  if (["draft", "published", "archived"].includes(status)) productQuery = productQuery.eq("status", status as "draft" | "published" | "archived");
  const { data: products, error } = await productQuery;
  if (error) console.error("MALYK product list query failed.", error);

  return (
    <main className="admin-page">
      <Container>
        <div className="admin-heading-row">
          <div>
            <p className="eyebrow">MALYK / Studio</p>
            <h1 className="admin-title">Products</h1>
          </div>
          <Link className="button button--primary" href="/admin/products/new">
            Add product
          </Link>
        </div>
        <form className="admin-product-filters" method="get">
          <label><span>Search</span><input name="search" defaultValue={search} /></label>
          <label><span>Status</span><select name="status" defaultValue={status}><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
          <button className="button button--secondary" type="submit">Apply</button>
        </form>
        {error ? (
          <p className="form-message form-message--error" role="alert">
            Products could not be loaded. Check the database connection.
          </p>
        ) : products?.length ? (
          <ul className="admin-product-list">
            {products.map((product) => (
              <li key={product.id}>
                <div>
                  <Link href={`/admin/products/${product.id}/edit`}>
                    {product.name}
                  </Link>
                  <p>
                    /{product.slug} ·{" "}
                    {formatPrice(product.price_minor, product.currency_code)}
                  </p>
                </div>
                <span className={`admin-status admin-status--${product.status}`}>
                  {product.status}
                </span>
                <Link
                  className="admin-product-list__edit"
                  href={`/admin/products/${product.id}/edit`}
                >
                  Edit
                </Link>
                {product.status !== "archived" ? (
                  <ArchiveProductForm productId={product.id} />
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="admin-empty">
            <h2>No products yet.</h2>
            <p>Create a draft product, add its variant options, then publish it.</p>
            <Link className="button button--primary" href="/admin/products/new">
              Create the first product
            </Link>
          </div>
        )}
      </Container>
    </main>
  );
}

export default function AdminProductsPage(props: { searchParams: Promise<{ search?: string; status?: string }> }) {
  return <ProductList {...props} />;
}
