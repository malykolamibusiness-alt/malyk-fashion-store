"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  const [message, setMessage] = useState("");
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
    return product && variant && color
      ? {
          item,
          product,
          variant,
          color,
          image,
          lineTotalMinor: product.priceMinor * item.quantity,
        }
      : { item, product: null, variant: null, color: null, image: null };
  });
  const totals = lines.reduce<Map<string, number>>((accumulator, line) => {
    if (line.product && "lineTotalMinor" in line) {
      accumulator.set(
        line.product.currency,
        (accumulator.get(line.product.currency) ?? 0) + line.lineTotalMinor,
      );
    }
    return accumulator;
  }, new Map());

  function changeQuantity(variantId: string, quantity: number) {
    try {
      cart.updateQuantity(variantId, quantity);
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Quantity could not be updated.",
      );
    }
  }

  return (
    <main id="main-content" className="cart-page">
      <Container>
        <p className="eyebrow">MALYK / Your bag</p>
        <h1 className="shop-page__title">Your shopping bag</h1>
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
                        ) : null}
                      </Link>
                    ) : (
                      <div className="cart-line__image-link" aria-hidden="true" />
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
                          {formatPrice(
                            line.product.priceMinor,
                            line.product.currency,
                          )}{" "}
                          each
                        </p>
                      ) : null}
                      <div className="cart-line__actions">
                        {line.product && line.variant ? (
                          <label>
                            <span>Quantity</span>
                            <select
                              value={line.item.quantity}
                              onChange={(event) =>
                                changeQuantity(
                                  line.item.variantId,
                                  Number(event.target.value),
                                )
                              }
                            >
                              {Array.from(
                                {
                                  length: Math.min(
                                    line.variant.stockQuantity,
                                    99,
                                  ),
                                },
                                (_, index) => index + 1,
                              ).map((quantity) => (
                                <option key={quantity} value={quantity}>
                                  {quantity}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                        <button
                          type="button"
                          onClick={() =>
                            cart.removeItem(line.item.variantId)
                          }
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
                <p className="cart-feedback" role="alert">
                  {message}
                </p>
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
              <Button href="/checkout">Proceed to checkout</Button>
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
