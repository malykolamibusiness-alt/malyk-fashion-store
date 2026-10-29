"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/home/ProductCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { demoProducts } from "@/data/products";
import { priceToMinorUnits } from "@/lib/pricing";
import type { Product, ProductCategory } from "@/types/product";

type SortOption = "featured" | "newest" | "price-asc" | "price-desc" | "name";

type ShopCatalogProps = {
  products?: Product[];
  title?: string;
  description?: string;
  initialCategory?: ProductCategory | "all";
  showCategoryFilter?: boolean;
  categories?: Array<{ slug: string; name: string }>;
  catalogError?: string | null;
  demoCatalog?: boolean;
};

const sizeLabels = ["XS", "S", "M", "L", "XL", "XXL", "30", "32", "34", "36"];
const defaultCategoryOptions: Array<{ value: string; label: string }> = [
  { value: "all", label: "All products" },
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "accessories", label: "Accessories" },
];

function getParam(params: Pick<URLSearchParams, "get">, key: string) {
  return params.get(key) ?? "";
}

function parseSortOption(value: string): SortOption {
  if (
    value === "newest" ||
    value === "price-asc" ||
    value === "price-desc" ||
    value === "name"
  ) {
    return value;
  }
  return "featured";
}

export function ShopCatalog({
  products = demoProducts,
  title = "The Collection",
  description = "Explore considered silhouettes and contemporary essentials from MALYK.",
  initialCategory = "all",
  showCategoryFilter = true,
  categories,
  catalogError = null,
  demoCatalog = false,
}: ShopCatalogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const latestQueryRef = useRef(currentQuery);
  const search = getParam(searchParams, "search");
  const category = getParam(searchParams, "category") || initialCategory;
  const size = getParam(searchParams, "size");
  const colorId = getParam(searchParams, "color");
  const requestedCurrency = getParam(searchParams, "currency");
  const sort = parseSortOption(getParam(searchParams, "sort"));
  const [priceError, setPriceError] = useState("");
  const appliedMinPrice = getParam(searchParams, "min");
  const appliedMaxPrice = getParam(searchParams, "max");
  const availableCurrencies = useMemo(
    () => [...new Set(products.map((product) => product.currency))].sort(),
    [products],
  );
  const currency = availableCurrencies.includes(requestedCurrency)
    ? requestedCurrency
    : "";
  const categoryOptions = useMemo(
    () =>
      categories
        ? [
            { value: "all", label: "All products" },
            ...categories.map((entry) => ({
              value: entry.slug,
              label: entry.name,
            })),
          ]
        : defaultCategoryOptions,
    [categories],
  );

  useEffect(() => {
    function syncQueryAfterHistoryNavigation() {
      latestQueryRef.current = window.location.search.slice(1);
    }
    window.addEventListener("popstate", syncQueryAfterHistoryNavigation);
    return () =>
      window.removeEventListener("popstate", syncQueryAfterHistoryNavigation);
  }, []);

  function updateUrl(updates: Record<string, string>) {
    const params = new URLSearchParams(latestQueryRef.current);
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    latestQueryRef.current = query;
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const availableSizes = useMemo(
    () =>
      sizeLabels.filter((label) =>
        products.some((product) => product.availableSizes.includes(label)),
      ),
    [products],
  );
  const availableColors = useMemo(
    () =>
      products
        .flatMap((product) => product.availableColors)
        .filter(
          (entry, index, all) =>
            all.findIndex((color) => color.id === entry.id) === index,
        ),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const minimum =
      appliedMinPrice === ""
        ? null
        : priceToMinorUnits(appliedMinPrice, currency);
    const maximum =
      appliedMaxPrice === ""
        ? null
        : priceToMinorUnits(appliedMaxPrice, currency);
    const hasPriceRange = appliedMinPrice !== "" || appliedMaxPrice !== "";
    const invalidPriceRange =
      hasPriceRange &&
      (!currency ||
        (appliedMinPrice !== "" && minimum === null) ||
        (appliedMaxPrice !== "" && maximum === null) ||
        (minimum !== null && maximum !== null && minimum > maximum));
    if (invalidPriceRange) return [];

    const result = products.filter((product) => {
      if (currency && product.currency !== currency) return false;
      const searchableText = [
        product.name,
        product.description,
        product.category,
        product.collection,
      ]
        .join(" ")
        .toLocaleLowerCase();
      if (normalizedSearch && !searchableText.includes(normalizedSearch)) {
        return false;
      }
      if (category !== "all" && product.category !== category) return false;
      if (size && !product.availableSizes.includes(size)) return false;
      if (
        colorId &&
        !product.availableColors.some((availableColor) => availableColor.id === colorId)
      ) {
        return false;
      }
      if (minimum !== null && product.priceMinor < minimum) return false;
      if (maximum !== null && product.priceMinor > maximum) return false;
      return true;
    });

    return [...result].sort((first, second) => {
      switch (sort) {
        case "newest":
          return second.createdAt.localeCompare(first.createdAt) || first.id.localeCompare(second.id);
        case "price-asc":
          return (
            first.currency.localeCompare(second.currency) ||
            first.priceMinor - second.priceMinor ||
            first.id.localeCompare(second.id)
          );
        case "price-desc":
          return (
            first.currency.localeCompare(second.currency) ||
            second.priceMinor - first.priceMinor ||
            first.id.localeCompare(second.id)
          );
        case "name":
          return first.name.localeCompare(second.name) || first.id.localeCompare(second.id);
        default:
          return (
            Number(second.featured) - Number(first.featured) ||
            second.createdAt.localeCompare(first.createdAt) ||
            first.id.localeCompare(second.id)
          );
      }
    });
  }, [
    appliedMaxPrice,
    appliedMinPrice,
    category,
    colorId,
    currency,
    products,
    search,
    size,
    sort,
  ]);

  function applyPriceRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const minValue = String(form.get("minimum") ?? "").trim();
    const maxValue = String(form.get("maximum") ?? "").trim();
    if ((minValue || maxValue) && !currency) {
      setPriceError("Choose a currency before applying a price range.");
      return;
    }
    const minimum =
      minValue === "" ? null : priceToMinorUnits(minValue, currency);
    const maximum =
      maxValue === "" ? null : priceToMinorUnits(maxValue, currency);
    if (
      (minValue !== "" && minimum === null) ||
      (maxValue !== "" && maximum === null)
    ) {
      setPriceError(
        currency === "JPY"
          ? "Enter whole-number prices with up to 9 digits in JPY."
          : "Enter prices with up to 9 whole-number digits and 2 decimal places.",
      );
      return;
    }
    if (minimum !== null && maximum !== null && minimum > maximum) {
      setPriceError("Minimum price cannot be greater than maximum price.");
      return;
    }
    setPriceError("");
    updateUrl({ min: minValue, max: maxValue });
  }

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateUrl({ search: String(form.get("search") ?? "").trim() });
  }

  function changeFilter(key: string, value: string) {
    updateUrl({ [key]: value });
  }

  function clearFilters() {
    setPriceError("");
    latestQueryRef.current = "";
    router.replace(pathname, { scroll: false });
  }

  const activeFilters = [
    ...(search.trim() ? [{ key: "search", value: search.trim(), label: `Search: ${search.trim()}` }] : []),
    ...(category !== "all" && category !== initialCategory
      ? [{ key: "category", value: category, label: category }]
      : []),
    ...(size ? [{ key: "size", value: size, label: `Size ${size}` }] : []),
    ...(colorId
      ? [{ key: "color", value: colorId, label: availableColors.find((entry) => entry.id === colorId)?.name ?? colorId }]
      : []),
    ...(currency
      ? [{ key: "currency", value: currency, label: currency }]
      : []),
    ...(appliedMinPrice || appliedMaxPrice
      ? [{
          key: "price",
          value: "price",
          label: `${currency} ${appliedMinPrice || "0"}–${appliedMaxPrice || "∞"}`,
        }]
      : []),
  ];

  return (
    <main id="main-content" className="catalog-page shop-page">
      <Container className="catalog-page__intro">
        <p className="eyebrow">MALYK / Shop</p>
        <h1 className="shop-page__title">{title}</h1>
        <p className="shop-page__description">{description}</p>
        {demoCatalog ? (
          <p className="demo-disclaimer">
            Development demonstration catalog only. This is not live
            inventory.
          </p>
        ) : (
          <p className="demo-disclaimer">
            Showing published styles from the current MALYK catalog. Stock is
            not reserved until checkout is implemented.
          </p>
        )}
        {catalogError ? (
          <p className="form-message form-message--error" role="alert">
            {catalogError}
          </p>
        ) : null}
      </Container>

      <Container>
        <div className="catalog-toolbar">
          <p className="catalog-result-count" aria-live="polite">
            {filteredProducts.length}{" "}
            {filteredProducts.length === 1 ? "style" : "styles"}
          </p>
          <label className="catalog-sort">
            <span>Sort by</span>
            <select
              value={sort}
              onChange={(event) => {
                const nextSort = parseSortOption(event.target.value);
                changeFilter("sort", nextSort === "featured" ? "" : nextSort);
              }}
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </label>
        </div>

        <div className="shop-layout">
          <aside className="catalog-filters" aria-label="Product filters">
            <div className="catalog-filter__heading">
              <h2>Refine</h2>
              <button type="button" onClick={clearFilters}>Clear all</button>
            </div>
            <form
              className="catalog-search"
              key={search}
              onSubmit={applySearch}
            >
              <label>
                <span>Search products</span>
                <input
                  defaultValue={search}
                  name="search"
                  placeholder="Name, category, collection"
                  type="search"
                />
              </label>
              <button className="button button--secondary" type="submit">
                Search
              </button>
            </form>

            {showCategoryFilter ? (
              <label className="catalog-select">
                <span>Category</span>
                <select
                  value={category}
                  onChange={(event) => {
                    changeFilter("category", event.target.value);
                  }}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            ) : null}

            <label className="catalog-select">
              <span>Currency</span>
              <select
                value={currency}
                onChange={(event) => {
                  setPriceError("");
                  changeFilter("currency", event.target.value);
                }}
              >
                <option value="">All currencies</option>
                {availableCurrencies.map((availableCurrency) => (
                  <option key={availableCurrency} value={availableCurrency}>
                    {availableCurrency}
                  </option>
                ))}
              </select>
            </label>

            <label className="catalog-select">
              <span>Size</span>
              <select
                value={size}
                onChange={(event) => {
                  changeFilter("size", event.target.value);
                }}
              >
                <option value="">All sizes</option>
                {availableSizes.map((availableSize) => (
                  <option key={availableSize} value={availableSize}>{availableSize}</option>
                ))}
              </select>
            </label>

            <label className="catalog-select">
              <span>Color</span>
              <select
                value={colorId}
                onChange={(event) => {
                  changeFilter("color", event.target.value);
                }}
              >
                <option value="">All colors</option>
                {availableColors.map((availableColor) => (
                  <option key={availableColor.id} value={availableColor.id}>{availableColor.name}</option>
                ))}
              </select>
            </label>

            <form
              className="price-filter"
              key={`${appliedMinPrice}|${appliedMaxPrice}`}
              onSubmit={applyPriceRange}
            >
              <p>Price range{currency ? ` (${currency})` : ""}</p>
              <div>
                <label>
                  <span>Minimum</span>
                  <input
                    min="0"
                    inputMode="decimal"
                    name="minimum"
                    step={currency === "JPY" ? "1" : "0.01"}
                    type="number"
                    defaultValue={appliedMinPrice}
                    placeholder="0"
                  />
                </label>
                <label>
                  <span>Maximum</span>
                  <input
                    min="0"
                    inputMode="decimal"
                    name="maximum"
                    step={currency === "JPY" ? "1" : "0.01"}
                    type="number"
                    defaultValue={appliedMaxPrice}
                    placeholder="No limit"
                  />
                </label>
              </div>
              <button className="button button--secondary" type="submit">Apply price</button>
              {(appliedMinPrice || appliedMaxPrice) && !currency ? (
                <p className="filter-error" role="alert">
                  Choose a currency to apply this price range.
                </p>
              ) : null}
              {((appliedMinPrice || appliedMaxPrice) &&
                ((appliedMinPrice !== "" &&
                  priceToMinorUnits(appliedMinPrice, currency) === null) ||
                  (appliedMaxPrice !== "" &&
                    priceToMinorUnits(appliedMaxPrice, currency) === null))) ? (
                <p className="filter-error" role="alert">
                  Enter a valid price range for the selected currency.
                </p>
              ) : null}
              {priceError ? <p className="filter-error" role="alert">{priceError}</p> : null}
            </form>
          </aside>

          <div className="catalog-results">
            {activeFilters.length ? (
              <div className="active-filters" aria-label="Active filters">
                {activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => {
                      if (filter.key === "price") {
                        updateUrl({ min: "", max: "" });
                      } else if (filter.key === "category" && initialCategory !== "all") {
                        updateUrl({ category: "" });
                      } else if (filter.key === "currency") {
                        updateUrl({ currency: "", min: "", max: "" });
                      } else {
                        updateUrl({ [filter.key]: "" });
                      }
                    }}
                  >
                    {filter.label} <span aria-hidden="true">×</span>
                  </button>
                ))}
                <button type="button" className="active-filters__clear" onClick={clearFilters}>
                  Clear all
                </button>
              </div>
            ) : null}
            {filteredProducts.length ? (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
            ) : (
              <div className="catalog-empty">
                <p className="eyebrow">
                  {catalogError
                    ? "Catalog unavailable"
                    : products.length === 0
                      ? "Nothing to display"
                      : "No styles found"}
                </p>
                <h2>
                  {catalogError
                    ? "The collection could not be loaded."
                    : products.length === 0
                      ? "No published styles yet."
                      : "Try a different combination."}
                </h2>
                <p>
                  {catalogError
                    ? "Please try again later."
                    : products.length === 0
                      ? "Published products will appear here when the catalog is ready."
                      : "Adjust your search or clear a filter to see more styles."}
                </p>
                {products.length > 0 && !catalogError ? (
                  <Button type="button" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </Container>
    </main>
  );
}
