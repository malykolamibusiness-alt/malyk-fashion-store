import type { Metadata } from "next";
import { Suspense } from "react";
import { BrandStatement } from "@/components/home/BrandStatement";
import { CategorySection } from "@/components/home/CategorySection";
import { EditorialSection } from "@/components/home/EditorialSection";
import { HeroSection } from "@/components/home/HeroSection";
import { ProductSection } from "@/components/home/ProductSection";
import { Container } from "@/components/ui/Container";
import { getStorefrontCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "MALYK — Modern Expression. Timeless Presence.",
  description:
    "Discover contemporary fashion shaped by individuality, considered silhouettes, and timeless essentials.",
};

async function HomeContent() {
  const catalog = await getStorefrontCatalog();
  const newArrivals = catalog.products.filter((product) => product.isNewArrival);
  const featuredEdit = catalog.products.filter((product) => product.featured);

  return (
    <>
      <HeroSection />
      <CategorySection categories={catalog.categories} />
      {catalog.error || catalog.products.length === 0 ? (
        <section className="home-section">
          <Container>
            <p className="eyebrow">{catalog.error ? "Catalog unavailable" : "Coming into view"}</p>
            <h2 className="section-heading">{catalog.error ? "The collection is not available yet." : "The first collection is taking shape."}</h2>
            <p className="section-description">{catalog.error ?? "Published styles will appear here when the catalog is ready."}</p>
          </Container>
        </section>
      ) : (
        <>
          <ProductSection id="new-arrivals-title" title="New Arrivals" description="The latest additions to the MALYK collection." products={newArrivals} href="/collections/new-arrivals" linkLabel="View all new arrivals" prioritizeFirstImage />
          <ProductSection id="malyk-edit-title" title="The MALYK Edit" description="A considered selection of contemporary pieces." products={featuredEdit} href="/collections/the-malyk-edit" linkLabel="Explore the edit" variant="edit" />
        </>
      )}
      <EditorialSection />
      <BrandStatement />
    </>
  );
}

export default function Home() {
  return (
    <main id="main-content" className="home-page">
      <Suspense fallback={<p className="catalog-loading-title">Loading collection…</p>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}
