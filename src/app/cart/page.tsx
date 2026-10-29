import type { Metadata } from "next";
import { Suspense } from "react";
import { CartPageContent } from "@/features/cart/CartPageContent";
import { getStorefrontCatalog } from "@/lib/catalog";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Your Shopping Bag | MALYK",
  description: "Review your MALYK demonstration shopping bag.",
};

async function CartContent() {
  const catalog = await getStorefrontCatalog();
  return (
    <CartPageContent
      products={catalog.products}
      source={catalog.source}
      catalogError={catalog.error}
    />
  );
}

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <main className="cart-page">
          <Container>
            <h1 className="shop-page__title">Your shopping bag</h1>
            <p>Loading current catalog prices…</p>
          </Container>
        </main>
      }
    >
      <CartContent />
    </Suspense>
  );
}
