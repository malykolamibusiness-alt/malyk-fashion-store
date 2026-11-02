import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/home/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { WishlistToggle } from "@/components/product/WishlistToggle";
import { ProductOptions } from "@/components/home/ProductOptions";
import { Container } from "@/components/ui/Container";
import { demoProducts, formatPrice } from "@/data/products";
import { getStorefrontProduct } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";
import { ProductReviews, type ProductReview } from "@/features/reviews/ProductReviews";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return demoProducts.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getStorefrontProduct(slug);
  const product = result.product;
  if (!product) return { title: "Product unavailable", robots: { index: false, follow: false } };
  return {
    title: product.name,
    description: product.description || `Discover ${product.name} by MALYK.`,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: product.name,
      description: product.description || `Discover ${product.name} by MALYK.`,
      images: product.images.map((image) => ({ url: image.src, alt: image.alt })),
    },
  };
}

async function ProductContent({ params }: ProductPageProps) {
  const { slug } = await params;
  const result = await getStorefrontProduct(slug);
  const product = result.product;
  if (!product && result.source !== "unavailable") notFound();
  if (!product) {
    return (
      <main id="main-content" className="product-detail-page">
        <Container>
          <p className="eyebrow">MALYK / Product</p>
          <h1>Product details are unavailable.</h1>
          <p className="form-message form-message--error" role="alert">
            {result.error ??
              "This style is not currently published in the catalog."}
          </p>
        </Container>
      </main>
    );
  }
  const relatedProducts = result.products
    .filter((candidate) => candidate.id !== product.id && candidate.category === product.category)
    .slice(0, 4);

  let reviews: ProductReview[] = [];
  let signedIn = false;
  let eligible = false;
  if (hasSupabaseEnvironment()) {
    try {
      const supabase = await createClient();
      const { data: reviewsData } = await supabase
        .from("product_reviews")
        .select("id, rating, title, body, verified_purchase, created_at")
        .eq("product_id", product.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(20);
      reviews = reviewsData ?? [];
      const { data: userData } = await supabase.auth.getUser();
      signedIn = Boolean(userData.user);
      if (userData.user) {
        const { data: eligibleData } = await supabase.rpc("product_has_verified_purchase", { p_product_id: product.id });
        eligible = eligibleData === true;
      }
    } catch (error) {
      console.warn("MALYK product reviews could not be loaded.", error);
    }
  }

  return (
    <main id="main-content" className="product-detail-page">
      <Container>
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/collections/${product.category}`}>
            {product.category}
          </Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>
        <div className="product-detail">
          <ProductGallery
            images={product.images}
            productName={product.name}
            unoptimized={product.isDemo === false}
          />
          <div className="product-detail__copy">
            <p className="eyebrow">
              MALYK / {product.categoryName ?? product.category}
              {product.isNewArrival ? " / New arrival" : ""}
            </p>
            <h1>{product.name}</h1>
            <p className="product-detail__price">
              {formatPrice(product.priceMinor, product.currency)}
            </p>
            {product.isDemo ? (
              <p className="demo-disclaimer">
                Development demonstration product. This is not live inventory.
              </p>
            ) : null}
            <ProductOptions product={product} />
            {product.description ? (
              <details className="product-detail__accordion" open>
                <summary>Description</summary>
                <p>{product.description}</p>
              </details>
            ) : null}
            <WishlistToggle productId={product.id} productName={product.name} />
            <p className="product-detail__footnote">
              Availability comes from the current catalog and may change.
              Inventory will be revalidated when checkout is implemented.
            </p>
          </div>
        </div>
        <ProductReviews
          productId={product.id}
          productSlug={product.slug}
          reviews={reviews}
          signedIn={signedIn}
          eligible={eligible}
        />
      </Container>
      {relatedProducts.length ? (
        <section className="related-products" aria-labelledby="related-title">
          <Container>
            <p className="eyebrow">Continue exploring</p>
            <h2 id="related-title">Related styles</h2>
            <div className="product-grid">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard product={relatedProduct} key={relatedProduct.id} />
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </main>
  );
}

export default function ProductPage({ params }: ProductPageProps) {
  return (
    <Suspense
      fallback={
        <main id="main-content" className="product-detail-page">
          <Container className="product-detail__fallback">
            <p className="eyebrow">MALYK / Product</p>
            <h1 className="catalog-loading-title">Loading product</h1>
          </Container>
        </main>
      }
    >
      <ProductContent params={params} />
    </Suspense>
  );
}
