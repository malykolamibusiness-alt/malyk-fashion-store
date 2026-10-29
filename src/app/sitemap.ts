import type { MetadataRoute } from "next";
import { getStorefrontCatalog } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getStorefrontCatalog();
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const products = catalog.source === "database" ? catalog.products : [];
  const entries: MetadataRoute.Sitemap = [
    "",
    "/shop",
    "/collections/men",
    "/collections/women",
    "/collections/accessories",
    "/collections/new-arrivals",
    "/collections/the-malyk-edit",
  ].map((path) => ({ url: `${origin}${path}`, changeFrequency: path === "" ? "daily" : "weekly", priority: path === "" ? 1 : 0.7 }));

  return [
    ...entries,
    ...products.map((product) => ({
      url: `${origin}/products/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
