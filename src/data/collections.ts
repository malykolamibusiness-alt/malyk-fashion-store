import { demoProducts } from "@/data/products";
import type { ProductCategory } from "@/types/product";

export type CollectionDefinition = {
  slug: string;
  title: string;
  description: string;
  productSlugs: string[];
  category?: ProductCategory;
  isDemo: boolean;
};

export const collections: CollectionDefinition[] = [
  {
    slug: "new-arrivals",
    title: "New Arrivals",
    description: "Discover the latest additions to the MALYK collection.",
    productSlugs: demoProducts
      .filter((product) => product.isNewArrival)
      .map((product) => product.slug),
    isDemo: true,
  },
  {
    slug: "the-malyk-edit",
    title: "The MALYK Edit",
    description:
      "A considered selection of contemporary silhouettes from the MALYK demonstration collection.",
    productSlugs: demoProducts
      .filter((product) => product.featured)
      .map((product) => product.slug),
    isDemo: true,
  },
  {
    slug: "men",
    title: "Men",
    description:
      "Explore contemporary silhouettes and considered essentials for men.",
    productSlugs: demoProducts
      .filter((product) => product.category === "men")
      .map((product) => product.slug),
    category: "men",
    isDemo: true,
  },
  {
    slug: "women",
    title: "Women",
    description:
      "Explore contemporary silhouettes and considered essentials for women.",
    productSlugs: demoProducts
      .filter((product) => product.category === "women")
      .map((product) => product.slug),
    category: "women",
    isDemo: true,
  },
  {
    slug: "accessories",
    title: "Accessories",
    description: "Considered finishing touches from the demonstration catalog.",
    productSlugs: demoProducts
      .filter((product) => product.category === "accessories")
      .map((product) => product.slug),
    category: "accessories",
    isDemo: true,
  },
];

export const collectionBySlug = new Map(
  collections.map((collection) => [collection.slug, collection]),
);
