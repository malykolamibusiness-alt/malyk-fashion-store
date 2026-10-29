import { fashionImages } from "@/lib/images";
import type { Product, ProductColor } from "@/types/product";

const color = (id: string, name: string, value: string): ProductColor => ({
  id,
  name,
  value,
});

const obsidian = color("obsidian", "Obsidian", "#252525");
const sand = color("sand", "Sand", "#b5a38a");
const ivory = color("ivory", "Ivory", "#e9e4d9");
const white = color("white", "White", "#ffffff");
const stone = color("stone", "Stone", "#b7ad9d");
const charcoal = color("charcoal", "Charcoal", "#484744");
const espresso = color("espresso", "Espresso", "#51433a");
const oat = color("oat", "Oat", "#c8bca8");
const camel = color("camel", "Camel", "#ad9070");

function makeVariants(
  productId: string,
  sizes: string[],
  colors: ProductColor[],
): Product["variants"] {
  return sizes.flatMap((size, sizeIndex) =>
    colors.map((availableColor, colorIndex) => ({
      id: `${productId}-${size.toLowerCase()}-${availableColor.id}`,
      size,
      colorId: availableColor.id,
      available: true,
      stockQuantity: 2 + ((sizeIndex + colorIndex) % 4),
    })),
  );
}

function product(
  details: Omit<Product, "variants">,
): Product {
  return {
    ...details,
    variants: makeVariants(
      details.id,
      details.availableSizes,
      details.availableColors,
    ),
  };
}

// All prices and stock quantities below are demonstration data, not live inventory.
export const demoProducts: Product[] = [
  product({
    id: "malyk-demo-001",
    slug: "tailored-wool-blazer",
    name: "Tailored Wool Blazer",
    description:
      "A considered single-breasted silhouette with a clean shoulder and a refined, versatile shape.",
    category: "men",
    collection: "The MALYK Edit",
    priceMinor: 48500,
    currency: "USD",
    images: [
      { src: fashionImages.blazer, alt: "Tailored dark blazer in an editorial setting" },
    ],
    availableSizes: ["XS", "S", "M", "L", "XL"],
    availableColors: [obsidian, sand],
    featured: true,
    isNewArrival: true,
    createdAt: "2026-10-10",
  }),
  product({
    id: "malyk-demo-002",
    slug: "relaxed-cotton-shirt",
    name: "Relaxed Cotton Shirt",
    description:
      "An easy, modern shirt with a relaxed fit designed for considered everyday dressing.",
    category: "men",
    collection: "New Arrivals",
    priceMinor: 19500,
    currency: "USD",
    images: [
      { src: fashionImages.shirt, alt: "Relaxed neutral cotton shirt styled for everyday wear" },
    ],
    availableSizes: ["S", "M", "L", "XL"],
    availableColors: [ivory, white],
    featured: false,
    isNewArrival: true,
    createdAt: "2026-10-08",
  }),
  product({
    id: "malyk-demo-003",
    slug: "structured-knit-polo",
    name: "Structured Knit Polo",
    description:
      "A tactile knit polo with a neat collar and a quietly structured finish.",
    category: "men",
    collection: "The MALYK Edit",
    priceMinor: 22500,
    currency: "USD",
    images: [
      { src: fashionImages.polo, alt: "Textured knit polo in a muted neutral tone" },
    ],
    availableSizes: ["S", "M", "L", "XL"],
    availableColors: [stone, obsidian],
    featured: true,
    isNewArrival: true,
    createdAt: "2026-10-06",
  }),
  product({
    id: "malyk-demo-004",
    slug: "modern-straight-leg-trousers",
    name: "Modern Straight-Leg Trousers",
    description:
      "Straight-leg tailoring with a balanced proportion for a contemporary wardrobe.",
    category: "men",
    collection: "New Arrivals",
    priceMinor: 26500,
    currency: "USD",
    images: [
      { src: fashionImages.trousers, alt: "Contemporary straight-leg tailored trousers" },
    ],
    availableSizes: ["30", "32", "34", "36"],
    availableColors: [charcoal, sand],
    featured: false,
    isNewArrival: true,
    createdAt: "2026-10-03",
  }),
  product({
    id: "malyk-demo-005",
    slug: "sculpted-midi-dress",
    name: "Sculpted Midi Dress",
    description:
      "A fluid midi silhouette with sculptural lines and an understated finish.",
    category: "women",
    collection: "The MALYK Edit",
    priceMinor: 39500,
    currency: "USD",
    images: [
      { src: fashionImages.dress, alt: "Sculptural midi dress in an editorial setting" },
    ],
    availableSizes: ["XS", "S", "M", "L"],
    availableColors: [espresso, ivory],
    featured: true,
    isNewArrival: true,
    createdAt: "2026-10-01",
  }),
  product({
    id: "malyk-demo-006",
    slug: "tailored-wide-leg-pants",
    name: "Tailored Wide-Leg Pants",
    description:
      "An elongated wide-leg silhouette with crisp lines and a considered drape.",
    category: "women",
    collection: "The MALYK Edit",
    priceMinor: 28500,
    currency: "USD",
    images: [
      { src: fashionImages.pants, alt: "Tailored wide-leg trousers in a soft neutral color" },
    ],
    availableSizes: ["XS", "S", "M", "L", "XL"],
    availableColors: [ivory, obsidian],
    featured: true,
    isNewArrival: true,
    createdAt: "2026-09-28",
  }),
  product({
    id: "malyk-demo-007",
    slug: "minimal-knit-top",
    name: "Minimal Knit Top",
    description:
      "A clean-lined knit layer designed to pair naturally with modern tailoring.",
    category: "women",
    collection: "New Arrivals",
    priceMinor: 16500,
    currency: "USD",
    images: [
      { src: fashionImages.knitTop, alt: "Minimal knit top with a clean silhouette" },
    ],
    availableSizes: ["XS", "S", "M", "L"],
    availableColors: [oat, obsidian],
    featured: false,
    isNewArrival: true,
    createdAt: "2026-09-25",
  }),
  product({
    id: "malyk-demo-008",
    slug: "refined-oversized-coat",
    name: "Refined Oversized Coat",
    description:
      "An oversized outer layer with a calm proportion and a timeless presence.",
    category: "women",
    collection: "The MALYK Edit",
    priceMinor: 62500,
    currency: "USD",
    images: [
      { src: fashionImages.coat, alt: "Oversized coat in a warm neutral shade" },
    ],
    availableSizes: ["XS", "S", "M", "L"],
    availableColors: [camel, charcoal],
    featured: true,
    isNewArrival: false,
    createdAt: "2026-08-20",
  }),
];

export const productById = new Map(
  demoProducts.map((product) => [product.id, product]),
);

export const productBySlug = new Map(
  demoProducts.map((product) => [product.slug, product]),
);

export function findVariant(
  product: Product,
  size: string,
  colorId: string,
) {
  return product.variants.find(
    (variant) =>
      variant.size === size &&
      variant.colorId === colorId &&
      variant.available &&
      variant.stockQuantity > 0,
  );
}

export function formatPrice(priceMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  });
  const fractionDigits =
    formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(priceMinor / 10 ** fractionDigits);
}
