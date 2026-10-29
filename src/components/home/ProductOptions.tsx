"use client";

import { useState } from "react";
import { findVariant } from "@/data/products";
import { useCart } from "@/features/cart/CartProvider";
import type { Product } from "@/types/product";

type ProductOptionsProps = {
  product: Product;
  compact?: boolean;
};

export function ProductOptions({
  product,
  compact = false,
}: ProductOptionsProps) {
  const [size, setSize] = useState("");
  const [colorId, setColorId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const { addItem } = useCart();
  const selectedVariant =
    size && colorId ? findVariant(product, size, colorId) : undefined;
  const sizesInSelectedColor = new Set(
    product.variants
      .filter(
        (variant) =>
          variant.available &&
          variant.stockQuantity > 0 &&
          (!colorId || variant.colorId === colorId),
      )
      .map((variant) => variant.size),
  );
  const colorsInSelectedSize = new Set(
    product.variants
      .filter(
        (variant) =>
          variant.available &&
          variant.stockQuantity > 0 &&
          (!size || variant.size === size),
      )
      .map((variant) => variant.colorId),
  );

  function handleAdd() {
    if (!selectedVariant) {
      setMessage("Choose an available size and color before adding this item.");
      return;
    }
    if (quantity > selectedVariant.stockQuantity) {
      setMessage(
        `Only ${selectedVariant.stockQuantity} units are currently listed for this option.`,
      );
      return;
    }

    try {
      addItem({
        productId: product.id,
        variantId: selectedVariant.id,
        size,
        colorId,
        quantity,
      });
      setMessage(`${product.name} (${size}) added to your bag.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "This demonstration option could not be added.",
      );
    }
  }

  return (
    <div className={`product-options${compact ? " product-options--compact" : ""}`}>
      <fieldset className="product-options__fieldset">
        <legend>Size</legend>
        <div className="variant-options">
          {product.availableSizes.map((availableSize) => {
            const unavailable = !sizesInSelectedColor.has(availableSize);
            return (
              <button
                aria-pressed={size === availableSize}
                className={`variant-chip${size === availableSize ? " is-selected" : ""}`}
                disabled={unavailable}
                key={availableSize}
                onClick={() => {
                  setSize(availableSize);
                  setMessage("");
                }}
                type="button"
              >
                {availableSize}
                {unavailable ? <span className="sr-only"> unavailable</span> : null}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="product-options__fieldset">
        <legend>
          Color{colorId ? `: ${product.availableColors.find((color) => color.id === colorId)?.name ?? ""}` : ""}
        </legend>
        <div className="variant-colors">
          {product.availableColors.map((color) => {
            const unavailable = !colorsInSelectedSize.has(color.id);
            return (
              <button
                aria-label={`${color.name}${unavailable ? ", unavailable" : ""}`}
                aria-pressed={colorId === color.id}
                className={`variant-color${colorId === color.id ? " is-selected" : ""}`}
                disabled={unavailable}
                key={color.id}
                onClick={() => {
                  setColorId(color.id);
                  setMessage("");
                }}
                style={{ backgroundColor: color.value }}
                type="button"
              >
                <span className="sr-only">{color.name}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {selectedVariant ? (
        <p className="variant-stock" role="status">
          {selectedVariant.stockQuantity} units currently listed for this option.
          Availability is checked again before checkout.
        </p>
      ) : null}

      <label className="quantity-label">
        <span>Quantity</span>
        <input
          aria-label={`Quantity for ${product.name}`}
          max={selectedVariant?.stockQuantity ?? 1}
          min={1}
          onChange={(event) => {
            const nextQuantity = Number(event.target.value);
            if (Number.isInteger(nextQuantity) && nextQuantity >= 1) {
              setQuantity(nextQuantity);
            }
          }}
          type="number"
          value={quantity}
        />
      </label>

      <button
        className="button button--primary product-options__add"
        disabled={!selectedVariant}
        onClick={handleAdd}
        type="button"
      >
        Add to bag
      </button>
      <p className="product-option-message" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
