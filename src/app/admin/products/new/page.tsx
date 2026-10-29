import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { AdminProductForm } from "@/features/admin/AdminProductForm";
import { requireAdmin } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Add product | MALYK Studio",
  description: "Create a MALYK catalog product.",
};

async function NewProductForm() {
  const { supabase, isAdmin } = await requireAdmin("/admin/products/new");
  if (!isAdmin) redirect("/account?access=denied");
  const [categoriesResult, collectionsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("active", true)
      .order("name"),
    supabase
      .from("collections")
      .select("id, name")
      .eq("active", true)
      .order("name"),
  ]);
  const error = categoriesResult.error ?? collectionsResult.error;
  if (error) console.error("MALYK product form options could not be loaded.", error);

  return (
    <main className="admin-page">
      <Container>
        <p className="eyebrow">MALYK / Studio</p>
        <h1 className="admin-title">Add a product</h1>
        {error ? (
          <p className="form-message form-message--error" role="alert">
            Categories could not be loaded. Please try again later.
          </p>
        ) : categoriesResult.data?.length ? (
          <AdminProductForm
            categories={categoriesResult.data}
            collections={collectionsResult.data ?? []}
          />
        ) : (
          <div className="admin-empty">
            <h2>No active categories.</h2>
            <p>
              Add or activate a category in Supabase before creating a product.
            </p>
          </div>
        )}
        <Link className="admin-back-link" href="/admin/products">
          Back to products
        </Link>
      </Container>
    </main>
  );
}

export default function NewProductPage() {
  return <NewProductForm />;
}
