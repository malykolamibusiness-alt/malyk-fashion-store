import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { getStorefrontCollection } from "@/lib/catalog";
import { ShopCatalog } from "@/features/catalog/ShopCatalog";

type CollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return [
    { slug: "men" },
    { slug: "women" },
    { slug: "accessories" },
    { slug: "new-arrivals" },
    { slug: "the-malyk-edit" },
  ];
}

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")} | MALYK`,
    description: "Explore published MALYK styles in this collection.",
  };
}

async function CollectionContent({ params }: CollectionPageProps) {
  const { slug } = await params;
  const result = await getStorefrontCollection(slug);
  if (!result.collection && result.source !== "unavailable") notFound();

  return (
    <ShopCatalog
      products={result.collection?.products ?? []}
      categories={result.categories}
      title={result.collection?.title ?? "The Collection"}
      description={
        result.collection?.description ??
        "Explore considered silhouettes and contemporary essentials from MALYK."
      }
      initialCategory={result.collection?.category ?? "all"}
      showCategoryFilter={!result.collection?.category}
      catalogError={result.error}
      demoCatalog={result.source === "demo"}
    />
  );
}

export default function CollectionPage({ params }: CollectionPageProps) {
  return (
    <Suspense
      fallback={
        <main id="main-content" className="catalog-page">
          <Container className="catalog-page__intro">
            <p className="eyebrow">MALYK / Collection</p>
            <h1 className="catalog-loading-title">Loading collection</h1>
          </Container>
        </main>
      }
    >
      <CollectionContent params={params} />
    </Suspense>
  );
}
