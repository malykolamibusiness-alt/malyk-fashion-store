import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { WishlistPageContent } from "@/features/wishlist/WishlistPageContent";
import { getStorefrontCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Wishlist | MALYK",
  description: "View styles saved in this browser's MALYK demonstration wishlist.",
};

async function WishlistContent() {
  const catalog = await getStorefrontCatalog();
  return (
    <WishlistPageContent
      products={catalog.products}
      catalogError={catalog.error}
    />
  );
}

export default function WishlistPage() {
  return (
    <Suspense
      fallback={
        <main className="wishlist-page">
          <Container>
            <h1 className="shop-page__title">Your wishlist</h1>
            <p>Loading current catalog…</p>
          </Container>
        </main>
      }
    >
      <WishlistContent />
    </Suspense>
  );
}
