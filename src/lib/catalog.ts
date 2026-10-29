import "server-only";

import type { QueryData, SupabaseClient } from "@supabase/supabase-js";
import { collections as demoCollections } from "@/data/collections";
import { demoProducts } from "@/data/products";
import type { Product } from "@/types/product";
import type { Database } from "@/types/database";
import {
  hasSupabaseEnvironment,
  isDemoCatalogEnabled,
  SupabaseConfigurationError,
} from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type StoreCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

export type CatalogResult = {
  products: Product[];
  categories: StoreCategory[];
  source: "database" | "demo" | "unavailable";
  error: string | null;
};

export type StoreCollection = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category?: string;
  products: Product[];
};

type StorefrontClient = SupabaseClient<Database>;

function buildProductQuery(client: StorefrontClient) {
  return client
    .from("products")
    .select(
      "id, name, slug, description, status, currency_code, price_minor, featured, is_new_arrival, created_at, category:categories!inner(id, name, slug, active), images:product_images(id, storage_path, alt_text, display_order), variants:product_variants(id, size, color_name, color_code, stock_quantity, active)",
    )
    .eq("status", "published")
    .eq("category.active", true)
    .eq("variants.active", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
}

type StorefrontProductRow = QueryData<
  ReturnType<typeof buildProductQuery>
>[number];

async function mapProduct(
  client: StorefrontClient,
  row: StorefrontProductRow,
): Promise<Product | null> {
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  if (!category) return null;

  const variantRows = Array.isArray(row.variants)
    ? row.variants.filter((variant) => variant.active)
    : [];
  const variants = variantRows
    .map((variant) => ({
      id: variant.id,
      size: variant.size,
      colorId: `${variant.color_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${variant.color_code.slice(1).toLowerCase()}`,
      available: variant.stock_quantity > 0,
      stockQuantity: variant.stock_quantity,
    }));
  const colorById = new Map<string, { id: string; name: string; value: string }>();
  for (const variant of variantRows) {
    const colorId = `${variant.color_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${variant.color_code.slice(1).toLowerCase()}`;
    colorById.set(colorId, {
      id: colorId,
      name: variant.color_name,
      value: variant.color_code,
    });
  }

  const imageRows = Array.isArray(row.images) ? [...row.images] : [];
  imageRows.sort(
    (first, second) =>
      first.display_order - second.display_order ||
      first.id.localeCompare(second.id),
  );
  const images = await Promise.all(
    imageRows.map(async (image) => {
      const { data, error } = await client.storage
        .from("product-images")
        .createSignedUrl(image.storage_path, 3600);
      if (error || !data?.signedUrl) {
        console.error("Could not create a signed product image URL.", {
          productId: row.id,
          imageId: image.id,
          error,
        });
        return null;
      }
      return { src: data.signedUrl, alt: image.alt_text };
    }),
  );

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: category.slug,
    categoryName: category.name,
    collection: "",
    collections: [],
    priceMinor: Number(row.price_minor),
    currency: row.currency_code,
    images: images.filter((image): image is NonNullable<typeof image> => image !== null),
    availableSizes: [...new Set(variants.map((variant) => variant.size))],
    availableColors: [...colorById.values()],
    variants,
    featured: row.featured,
    isNewArrival: row.is_new_arrival,
    createdAt: row.created_at,
    isDemo: false,
  };
}

function demoResult(): CatalogResult {
  return {
    products: demoProducts.map((product) => ({ ...product, isDemo: true })),
    categories: [
      { id: "demo-men", slug: "men", name: "Men", description: "" },
      { id: "demo-women", slug: "women", name: "Women", description: "" },
      {
        id: "demo-accessories",
        slug: "accessories",
        name: "Accessories",
        description: "",
      },
    ],
    source: "demo",
    error: null,
  };
}

function unavailableResult(error: string): CatalogResult {
  return { products: [], categories: [], source: "unavailable", error };
}

export async function getStorefrontCatalog(): Promise<CatalogResult> {
  if (!hasSupabaseEnvironment()) {
    if (isDemoCatalogEnabled()) return demoResult();
    return unavailableResult(
      "The store catalog is not configured yet. Add the Supabase project settings or explicitly enable the development demo catalog.",
    );
  }

  try {
    const client = await createClient();
    const [productsQuery, categoriesQuery] = await Promise.all([
      buildProductQuery(client),
      client
        .from("categories")
        .select("id, slug, name, description")
        .eq("active", true)
        .order("name"),
    ]);

    if (productsQuery.error) throw productsQuery.error;
    if (categoriesQuery.error) throw categoriesQuery.error;

    const products = (
      await Promise.all(
        productsQuery.data.map((row) => mapProduct(client, row)),
      )
    ).filter((product): product is Product => product !== null);

    return {
      products,
      categories: categoriesQuery.data,
      source: "database",
      error: null,
    };
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return unavailableResult(error.message);
    }
    const catalogError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    console.error("Storefront catalog query failed.", {
      name: error instanceof Error ? error.name : typeof error,
      message: catalogError.message ?? "Unknown catalog query error",
      details: catalogError.details ?? undefined,
      hint: catalogError.hint ?? undefined,
      code: catalogError.code ?? undefined,
    });
    if (process.env.NODE_ENV === "development" && catalogError.code === "PGRST205") {
      return demoResult();
    }
    return unavailableResult(
      "The store catalog could not be loaded. Please try again later.",
    );
  }
}

export async function getStorefrontProduct(slug: string) {
  const catalog = await getStorefrontCatalog();
  return {
    ...catalog,
    product: catalog.products.find((product) => product.slug === slug) ?? null,
  };
}

export async function getStorefrontCollection(slug: string) {
  const catalog = await getStorefrontCatalog();
  if (catalog.source === "unavailable") {
    return { ...catalog, collection: null };
  }

  if (catalog.source === "demo") {
    const definition = demoCollections.find((entry) => entry.slug === slug);
    if (!definition) return { ...catalog, collection: null };
    const bySlug = new Map(catalog.products.map((product) => [product.slug, product]));
    return {
      ...catalog,
      collection: {
        id: slug,
        slug,
        title: definition.title,
        description: definition.description,
        category: definition.category,
        products: definition.productSlugs.flatMap((productSlug) => {
          const product = bySlug.get(productSlug);
          return product ? [product] : [];
        }),
      } satisfies StoreCollection,
    };
  }

  try {
    const client = await createClient();
    const { data: category, error: categoryError } = await client
      .from("categories")
      .select("id, slug, name, description")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (categoryError) throw categoryError;

    if (category) {
      return {
        ...catalog,
        collection: {
          id: category.id,
          slug: category.slug,
          title: category.name,
          description: category.description,
          category: category.slug,
          products: catalog.products.filter(
            (product) => product.category === category.slug,
          ),
        } satisfies StoreCollection,
      };
    }

    const { data: collection, error: collectionError } = await client
      .from("collections")
      .select("id, slug, name, description")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();
    if (collectionError) throw collectionError;
    if (!collection) return { ...catalog, collection: null };

    const { data: links, error: linksError } = await client
      .from("collection_products")
      .select("product_id, display_order")
      .eq("collection_id", collection.id)
      .order("display_order");
    if (linksError) throw linksError;
    const productsById = new Map(
      catalog.products.map((product) => [product.id, product]),
    );
    const products = (links ?? []).flatMap((link) => {
      const product = productsById.get(link.product_id);
      return product ? [product] : [];
    });

    return {
      ...catalog,
      collection: {
        id: collection.id,
        slug: collection.slug,
        title: collection.name,
        description: collection.description,
        products,
      } satisfies StoreCollection,
    };
  } catch (error) {
    console.error("Storefront collection query failed.", { slug, error });
    return {
      ...catalog,
      error: "This collection could not be loaded. Please try again later.",
      collection: null,
    };
  }
}
