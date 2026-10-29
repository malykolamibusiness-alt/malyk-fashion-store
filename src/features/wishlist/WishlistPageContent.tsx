"use client";

import { ProductCard } from "@/components/home/ProductCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { useWishlist } from "@/features/wishlist/WishlistProvider";
import type { Product } from "@/types/product";

type WishlistPageContentProps = {
  products: Product[];
  catalogError: string | null;
};

export function WishlistPageContent({
  products,
  catalogError,
}: WishlistPageContentProps) {
  const { productIds } = useWishlist();
  const currentProducts = new Map(
    products.map((product) => [product.id, product]),
  );
  const savedProducts = productIds.flatMap((id) => {
    const product = currentProducts.get(id);
    return product ? [product] : [];
  });

  return (
    <main id="main-content" className="wishlist-page">
      <Container>
        <p className="eyebrow">MALYK / Saved</p>
        <h1 className="shop-page__title">Your wishlist</h1>
        <p className="demo-disclaimer">
          Saved in this browser only. Wishlist items are not synchronized
          between devices or accounts.
        </p>
        {catalogError ? (
          <p className="form-message form-message--error" role="alert">
            {catalogError}
          </p>
        ) : null}
        {savedProducts.length ? (
          <div className="product-grid wishlist-grid">
            {savedProducts.map((product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        ) : (
          <div className="cart-empty">
            <h2>
              {productIds.length
                ? "Saved styles are not currently available."
                : "Your wishlist is empty."}
            </h2>
            <p>
              {productIds.length
                ? "Some saved styles may have been unpublished or removed from the current catalog."
                : "Save styles as you explore the MALYK catalog."}
            </p>
            <Button href="/shop">Explore the collection</Button>
          </div>
        )}
      </Container>
    </main>
  );
}
