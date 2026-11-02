import { Suspense } from "react";
import { ShopCatalog } from "@/features/catalog/ShopCatalog";
import { getStorefrontCatalog } from "@/lib/catalog";

export const metadata = {
  title: "Shop the Collection | MALYK",
  description:
    "Search and refine the MALYK demonstration catalog by category, size, color, or price.",
};

async function ShopContent() {
  const catalog = await getStorefrontCatalog();
  return (
    <ShopCatalog
      products={catalog.products}
      categories={catalog.categories}
      catalogError={catalog.error}
      demoCatalog={catalog.source === "demo"}
    />
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <main className="catalog-page" aria-busy="true" aria-label="Loading catalog">
          <div className="container catalog-loading">
            <h1 className="catalog-loading-title">Discover the Collection.</h1>
            <div className="catalog-loading__tabs" aria-hidden="true">
              {Array.from({ length: 5 }, (_, index) => <span key={index} />)}
            </div>
            <div className="catalog-loading__grid" aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => <span key={index} />)}
            </div>
          </div>
        </main>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
