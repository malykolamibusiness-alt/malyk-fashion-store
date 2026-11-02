"use client";

import { Minus, Plus } from "lucide-react";
import { useRef, useState } from "react";
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
  const addingRef = useRef(false);
  const { addItem, items } = useCart();
  const requiresSize = product.availableSizes.length > 0;
  const requiresColor = product.availableColors.length > 0;
  const selectedVariant =
    (!requiresSize || size) && (!requiresColor || colorId)
      ? findVariant(product, size, colorId)
      : undefined;
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
  const alreadyInBag = selectedVariant
    ? items.filter((item) => item.variantId === selectedVariant.id)
        .reduce((total, item) => total + item.quantity, 0)
    : 0;
  const remainingStock = selectedVariant
    ? Math.max(0, selectedVariant.stockQuantity - alreadyInBag)
    : 0;
  const maximumQuantity = Math.min(99, remainingStock);

  function handleAdd() {
    if (!selectedVariant) {
      const missing = [
        requiresSize && !size ? "size" : "",
        requiresColor && !colorId ? "color" : "",
      ].filter(Boolean).join(" and ");
      setMessage(`Choose an available ${missing || "option"} before adding this item.`);
      return;
    }
    if (quantity > remainingStock) {
      setMessage(`Only ${remainingStock} additional units are available for this option.`);
      return;
    }
    if (addingRef.current) return;
    addingRef.current = true;

    try {
      addItem({
        productId: product.id,
        variantId: selectedVariant.id,
        size,
        colorId,
        quantity,
      });
      const selection = [
        size,
        requiresColor
          ? product.availableColors.find((color) => color.id === colorId)?.name
          : "",
      ].filter(Boolean).join(" · ");
      setMessage(`${product.name}${selection ? ` (${selection})` : ""} added to your bag.`);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "This item could not be added to your bag.",
      );
    } finally {
      window.setTimeout(() => {
        addingRef.current = false;
      }, 350);
    }
  }

  return (
    <div className={`product-options${compact ? " product-options--compact" : ""}`}>
      {requiresSize ? (
      <fieldset className="product-options__fieldset">
        <legend>Size{size ? `: ${size}` : ""}</legend>
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
                  setQuantity(1);
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
      ) : null}

      {requiresColor ? (
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
                  setQuantity(1);
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
      ) : null}

      {selectedVariant ? (
        <p className="variant-stock" role="status">
          {remainingStock > 0
            ? `${remainingStock} additional units available.`
            : "This option is currently unavailable."}
        </p>
      ) : (
        <p className="variant-stock">Select the available options to check inventory.</p>
      )}

      <div className="quantity-label">
        <span id={`${product.id}-quantity-label`}>Quantity</span>
        <div className="quantity-control">
          <button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
            <Minus aria-hidden="true" />
          </button>
          <input
            aria-labelledby={`${product.id}-quantity-label`}
            max={maximumQuantity || 1}
            min={1}
            onChange={(event) => {
              const nextQuantity = Number(event.target.value);
              if (Number.isInteger(nextQuantity)) {
                setQuantity(Math.min(Math.max(1, nextQuantity), maximumQuantity || 1));
              }
            }}
            type="number"
            value={quantity}
          />
          <button type="button" aria-label="Increase quantity" disabled={!maximumQuantity || quantity >= maximumQuantity} onClick={() => setQuantity((current) => Math.min(maximumQuantity, current + 1))}>
            <Plus aria-hidden="true" />
          </button>
        </div>
      </div>

      <button
        className="button button--primary product-options__add"
        disabled={Boolean(selectedVariant && remainingStock < 1)}
        onClick={handleAdd}
        type="button"
      >
        {selectedVariant && remainingStock < 1 ? "Unavailable" : "Add to bag"}
      </button>
      <p className="product-option-message" role="status" aria-live="polite">
        {message}
      </p>
    </div>
  );
}
