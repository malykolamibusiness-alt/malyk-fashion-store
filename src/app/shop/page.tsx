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
        <main className="catalog-page">
          <h1 className="catalog-loading-title">The Collection</h1>
        </main>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
