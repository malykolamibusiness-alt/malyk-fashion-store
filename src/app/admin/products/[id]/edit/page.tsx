import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { AdminProductForm } from "@/features/admin/AdminProductForm";
import { ArchiveProductForm } from "@/features/admin/ArchiveProductForm";
import { requireAdmin } from "@/lib/auth/server";
import { z } from "zod";

export const metadata: Metadata = {
  title: "Edit product | MALYK Studio",
  description: "Update a MALYK catalog product and its variants.",
};

type EditProductProps = {
  params: Promise<{ id: string }>;
};

async function EditProductContent({ params }: EditProductProps) {
  const { id } = await params;
  const parsedId = z.uuid().safeParse(id);
  if (!parsedId.success) notFound();

  const { supabase, isAdmin } = await requireAdmin(
    `/admin/products/${id}/edit`,
  );
  if (!isAdmin) redirect("/account?access=denied");
  const [
    productResult,
    categoriesResult,
    collectionsResult,
    membershipResult,
    variantsResult,
    imagesResult,
  ] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("id", parsedId.data)
        .maybeSingle(),
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
      supabase
        .from("collection_products")
        .select("collection_id")
        .eq("product_id", parsedId.data),
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", parsedId.data)
        .order("created_at"),
      supabase
        .from("product_images")
        .select("*")
        .eq("product_id", parsedId.data)
        .order("display_order"),
    ]);

  const error =
    productResult.error ??
    categoriesResult.error ??
    collectionsResult.error ??
    membershipResult.error ??
    variantsResult.error ??
    imagesResult.error;
  if (error) {
    console.error("MALYK product edit data could not be loaded.", error);
    return (
      <main className="admin-page">
        <Container>
          <h1 className="admin-title">Product unavailable</h1>
          <p className="form-message form-message--error" role="alert">
            Product details could not be loaded. Please try again.
          </p>
        </Container>
      </main>
    );
  }
  if (!productResult.data) notFound();

  return (
    <main className="admin-page">
      <Container>
        <div className="admin-heading-row">
          <div>
            <p className="eyebrow">MALYK / Studio</p>
            <h1 className="admin-title">Edit product</h1>
          </div>
          {productResult.data.status !== "archived" ? (
            <ArchiveProductForm productId={productResult.data.id} />
          ) : null}
        </div>
        <AdminProductForm
          categories={categoriesResult.data ?? []}
          collections={collectionsResult.data ?? []}
          selectedCollectionIds={(membershipResult.data ?? []).map(
            (membership) => membership.collection_id,
          )}
          product={productResult.data}
          variants={variantsResult.data ?? []}
          images={imagesResult.data ?? []}
        />
        <Link className="admin-back-link" href="/admin/products">
          Back to products
        </Link>
      </Container>
    </main>
  );
}

export default function EditProductPage(props: EditProductProps) {
  return (
    <Suspense fallback={<p className="admin-loading">Loading product…</p>}>
      <EditProductContent {...props} />
    </Suspense>
  );
}
