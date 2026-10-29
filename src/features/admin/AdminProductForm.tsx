"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  saveProductAction,
  type AdminActionState,
} from "@/features/admin/actions";
import type { Database } from "@/types/database";

type Category = Pick<
  Database["public"]["Tables"]["categories"]["Row"],
  "id" | "name"
>;
type Collection = Pick<
  Database["public"]["Tables"]["collections"]["Row"],
  "id" | "name"
>;
type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type VariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type ImageRow = Database["public"]["Tables"]["product_images"]["Row"];

type AdminProductFormProps = {
  categories: Category[];
  collections: Collection[];
  selectedCollectionIds?: string[];
  product?: ProductRow;
  variants?: VariantRow[];
  images?: ImageRow[];
};

const initialState: AdminActionState = {};

export function AdminProductForm({
  categories,
  collections,
  selectedCollectionIds = [],
  product,
  variants = [],
  images = [],
}: AdminProductFormProps) {
  const [state, action, isPending] = useActionState(
    saveProductAction,
    initialState,
  );
  const digits = product?.currency_code === "JPY" ? 0 : 2;
  const amount = product
    ? (product.price_minor / 10 ** digits).toFixed(digits)
    : "";
  const imageManifest = images.map((image) => ({
    id: image.id,
    alt_text: image.alt_text,
    display_order: image.display_order,
  }));
  const variantValues = variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    color_name: variant.color_name,
    color_code: variant.color_code,
    stock_quantity: variant.stock_quantity,
    active: variant.active,
  }));

  return (
    <form className="admin-product-form" action={action}>
      {product ? (
        <input type="hidden" name="productId" value={product.id} />
      ) : null}
      <div className="admin-form-grid">
        <label>
          <span>Product name</span>
          <input
            defaultValue={product?.name ?? ""}
            maxLength={160}
            name="name"
            required
          />
        </label>
        <label>
          <span>Slug</span>
          <input
            defaultValue={product?.slug ?? ""}
            maxLength={160}
            name="slug"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            required
          />
        </label>
        <label>
          <span>Category</span>
          <select
            defaultValue={product?.category_id ?? categories[0]?.id ?? ""}
            name="categoryId"
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option value={category.id} key={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Status</span>
          <select defaultValue={product?.status ?? "draft"} name="status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label>
          <span>Currency</span>
          <select
            defaultValue={product?.currency_code ?? "USD"}
            name="currency"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
        </label>
        <label>
          <span>Price in selected currency</span>
          <input
            defaultValue={amount}
            inputMode="decimal"
            min="0"
            name="price"
            required
            step={digits === 0 ? "1" : "0.01"}
            type="number"
          />
        </label>
      </div>
      <label>
        <span>Description</span>
        <textarea
          defaultValue={product?.description ?? ""}
          maxLength={10000}
          name="description"
          rows={5}
        />
      </label>
      <div className="admin-checkbox-row">
        <label>
          <input
            defaultChecked={product?.featured ?? false}
            name="featured"
            type="checkbox"
          />
          <span>Featured</span>
        </label>
        <label>
          <input
            defaultChecked={product?.is_new_arrival ?? false}
            name="isNewArrival"
            type="checkbox"
          />
          <span>New arrival</span>
        </label>
      </div>
      <fieldset className="admin-collection-fieldset">
        <legend>Collections</legend>
        <div className="admin-checkbox-row">
          {collections.map((collection) => (
            <label key={collection.id}>
              <input
                defaultChecked={selectedCollectionIds.includes(collection.id)}
                name="collectionIds"
                type="checkbox"
                value={collection.id}
              />
              <span>{collection.name}</span>
            </label>
          ))}
        </div>
        {collections.length === 0 ? (
          <span className="admin-help">
            No active collections yet. The category and featured/new arrival
            flags can still organize this product.
          </span>
        ) : null}
      </fieldset>

      <label>
        <span>Variants (JSON)</span>
        <textarea
          defaultValue={JSON.stringify(variantValues, null, 2)}
          name="variants"
          required
          rows={Math.max(8, variantValues.length * 3)}
          spellCheck={false}
        />
        <span className="admin-help">
          Each entry uses sku, size, color_name, color_code (hex), stock_quantity
          (zero or greater), and active. Keep existing variant IDs when editing.
        </span>
      </label>

      {images.length ? (
        <section className="admin-existing-images" aria-labelledby="images-title">
          <h2 id="images-title">Current product images</h2>
          {images.map((image) => (
            <p key={image.id}>
              Order {image.display_order}: {image.alt_text}
            </p>
          ))}
          <label>
            <span>Image order and alt text (JSON)</span>
            <textarea
              defaultValue={JSON.stringify(imageManifest, null, 2)}
              name="imageManifest"
              rows={Math.max(5, images.length * 3)}
              spellCheck={false}
            />
            <span className="admin-help">
              Edit alt_text and display_order. Keep each existing image ID.
            </span>
          </label>
        </section>
      ) : (
        <input type="hidden" name="imageManifest" value="[]" />
      )}

      <section className="admin-image-upload" aria-labelledby="upload-title">
        <h2 id="upload-title">Add product images</h2>
        <label>
          <span>Images (JPEG, PNG, WebP, or AVIF; up to 5 MB each)</span>
          <input
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            name="images"
            type="file"
          />
        </label>
        <label>
          <span>Alternative text, one line per selected image</span>
          <textarea
            name="imageAltTexts"
            placeholder={"Front view of the tailored jacket\nDetail of the jacket fabric"}
            rows={3}
          />
        </label>
        <label>
          <span>Image order begins after current images</span>
          <input
            defaultValue={
              Math.max(-1, ...images.map((image) => image.display_order)) + 1
            }
            min="0"
            name="imageOrderBase"
            type="number"
          />
        </label>
      </section>

      {state.error ? (
        <p className="form-message form-message--error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="form-message" role="status">
          {state.success}{" "}
          {state.savedProductId ? (
            <Link href={`/admin/products/${state.savedProductId}/edit`}>
              Continue editing this product
            </Link>
          ) : null}
        </p>
      ) : null}
      <div className="admin-form-actions">
        <button className="button button--primary" disabled={isPending}>
          {isPending ? "Saving…" : "Save product"}
        </button>
        <Link href="/admin/products">Cancel</Link>
      </div>
    </form>
  );
}
