"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { formatPrice } from "@/data/products";
import { useCart } from "@/features/cart/CartProvider";
import type { Product } from "@/types/product";

type CartPageContentProps = {
  products: Product[];
  source: "database" | "demo" | "unavailable";
  catalogError: string | null;
};

export function CartPageContent({
  products,
  source,
  catalogError,
}: CartPageContentProps) {
  const cart = useCart();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [removedMessage, setRemovedMessage] = useState("");
  const quantityLock = useRef(false);
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const lines = cart.items.map((item) => {
    const product = productById.get(item.productId);
    const variant = product?.variants.find(
      (candidate) => candidate.id === item.variantId,
    );
    const color = product?.availableColors.find(
      (candidate) => candidate.id === item.colorId,
    );
    const image = product?.images[0];
    const availableStock = variant?.available ? variant.stockQuantity : 0;
    const hasValidColor =
      (product?.availableColors.length ?? 0) === 0 || Boolean(color);
    const isValid = Boolean(product && variant && variant.available && availableStock > 0 && hasValidColor);
    const stockIssue = availableStock < item.quantity ? availableStock : null;
    return product && variant
      ? {
          item,
          product,
          variant,
          color,
          image,
          isValid,
          stockIssue,
          lineTotalMinor: product.priceMinor * item.quantity,
        }
      : { item, product: null, variant: null, color: null, image: null, isValid: false, stockIssue: null };
  });
  const totals = lines.reduce<Map<string, number>>((accumulator, line) => {
    if (line.product && line.isValid && "lineTotalMinor" in line) {
      accumulator.set(
        line.product.currency,
        (accumulator.get(line.product.currency) ?? 0) + line.lineTotalMinor,
      );
    }
    return accumulator;
  }, new Map());

  const hasInvalidItems = lines.some((line) => !line.isValid);

  function changeQuantity(variantId: string, quantity: number) {
    if (quantityLock.current) return;
    quantityLock.current = true;
    try {
      cart.updateQuantity(variantId, quantity);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Quantity could not be updated.",
      );
    } finally {
      quantityLock.current = false;
    }
  }

  return (
    <main id="main-content" className="cart-page">
      <Container>
        <nav className="cart-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span>Your shopping bag</span>
        </nav>
        <div className="cart-page__heading">
          <div>
            <p className="eyebrow">MALYK / Your bag</p>
            <h1 className="shop-page__title">Your shopping bag.</h1>
          </div>
          <Link href="/shop" className="cart-continue-link">Continue shopping</Link>
        </div>
        <p className="cart-item-count" aria-live="polite">
          {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"}
        </p>
        <p className="demo-disclaimer">
          Your bag stores product and variant references only. Prices below
          come from the current catalog and are informational; the server
          confirms availability and calculates the final order total.
        </p>
        {source === "demo" ? (
          <p className="cart-feedback" role="status">
            This browser is using the explicitly enabled development demo
            catalog.
          </p>
        ) : null}
        {catalogError ? (
          <p className="form-message form-message--error" role="alert">
            {catalogError}
          </p>
        ) : null}
        {cart.recoveryMessage ? (
          <p className="cart-feedback" role="status">
            {cart.recoveryMessage}
          </p>
        ) : null}
        {cart.items.length ? (
          <div className="cart-layout">
            <div>
              <ul className="cart-lines">
                {lines.map((line) => (
                  <li className="cart-line" key={line.item.variantId}>
                    {line.product ? (
                      <Link
                        href={`/products/${line.product.slug}`}
                        className="cart-line__image-link"
                        aria-label={`View ${line.product.name}`}
                      >
                        {line.image ? (
                          <Image
                            src={line.image.src}
                            alt=""
                            width={160}
                            height={210}
                            sizes="160px"
                            unoptimized={line.product.isDemo === false}
                          />
                        ) : (
                          <span className="cart-image-placeholder">MALYK</span>
                        )}
                      </Link>
                    ) : (
                      <div className="cart-line__image-link cart-image-placeholder" aria-hidden="true">MALYK</div>
                    )}
                    <div className="cart-line__details">
                      {line.product ? (
                        <Link href={`/products/${line.product.slug}`}>
                          {line.product.name}
                        </Link>
                      ) : (
                        <strong>Item no longer available</strong>
                      )}
                      {line.product && line.color ? (
                        <p>
                          Size {line.item.size} · {line.color.name}
                        </p>
                      ) : (
                        <p>This option is not currently in the catalog.</p>
                      )}
                      {line.product ? (
                        <p>
                          {formatPrice(line.product.priceMinor, line.product.currency)} each
                        </p>
                      ) : null}
                      {line.product && line.variant && (!line.variant.available || line.stockIssue !== null) ? (
                        <p className="cart-line__warning" role="status">
                          {                          line.variant.available
                            ? `Only ${line.variant.stockQuantity} available. Reduce your quantity before checkout.`
                            : "This size and color combination is currently unavailable."}
                        </p>
                      ) : null}
                      {line.product && !line.variant ? (
                        <p className="cart-line__warning" role="status">This variant is no longer available.</p>
                      ) : null}
                      <div className="cart-line__actions">
                        {line.product && line.variant ? (
                          <div className="cart-quantity" aria-label="Quantity">
                            <span className="cart-quantity__label">Quantity</span>
                            <div className="cart-quantity__controls">
                              <button
                                type="button"
                                aria-label={`Decrease quantity of ${line.product.name}`}
                                disabled={line.item.quantity <= 1 || !line.variant.available}
                                onClick={() => changeQuantity(line.item.variantId, line.item.quantity - 1)}
                              >
                                <Minus size={14} aria-hidden="true" />
                              </button>
                              <span aria-live="polite">{line.item.quantity}</span>
                              <button
                                type="button"
                                aria-label={`Increase quantity of ${line.product.name}`}
                                disabled={!line.variant.available || line.item.quantity >= Math.min(line.variant.stockQuantity, 99)}
                                onClick={() => changeQuantity(line.item.variantId, line.item.quantity + 1)}
                              >
                                <Plus size={14} aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            cart.removeItem(line.item.variantId);
                            setRemovedMessage(`${line.product?.name ?? "Item"} removed from your bag.`);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {line.product && "lineTotalMinor" in line ? (
                      <strong className="cart-line__total">
                        {formatPrice(
                          line.lineTotalMinor,
                          line.product.currency,
                        )}
                      </strong>
                    ) : null}
                  </li>
                ))}
              </ul>
              {message ? (
                <p className="cart-feedback" role="alert">{message}</p>
              ) : null}
              {removedMessage ? (
                <p className="cart-feedback" role="status">{removedMessage}</p>
              ) : null}
              <button
                className="cart-clear"
                type="button"
                onClick={cart.clearCart}
              >
                Clear bag
              </button>
            </div>
            <aside className="cart-summary" aria-label="Bag summary">
              <h2>Summary</h2>
              {totals.size ? (
                [...totals.entries()].map(([currency, total]) => (
                  <p key={currency}>
                    <span>Catalog subtotal ({currency})</span>
                    <strong>{formatPrice(total, currency)}</strong>
                  </p>
                ))
              ) : (
                <p>No current catalog prices are available for this bag.</p>
              )}
              <p className="cart-summary__note">
                Shipping and tax are confirmed securely on the checkout
                server before payment.
              </p>
              {hasInvalidItems ? (
                <p className="cart-summary__warning" role="alert">
                  Remove unavailable items or adjust quantities before checkout.
                </p>
              ) : null}
              <Button
                disabled={cart.items.length === 0 || hasInvalidItems}
                onClick={() => router.push("/checkout")}
              >
                Proceed to checkout
              </Button>
              <Link href="/shop">Continue shopping</Link>
            </aside>
          </div>
        ) : (
          <div className="cart-empty">
            <h2>Your bag is currently empty.</h2>
            <p>
              Explore the catalog and choose a size and color to add a style.
            </p>
            <Button href="/shop">Explore the collection</Button>
          </div>
        )}
      </Container>
    </main>
  );
}
