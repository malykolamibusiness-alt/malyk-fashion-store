"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, X } from "lucide-react";
import { ProductOptions } from "@/components/home/ProductOptions";
import { IconButton } from "@/components/ui/IconButton";
import { formatPrice } from "@/data/products";
import { useWishlist } from "@/features/wishlist/WishlistProvider";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
  prioritizeImage?: boolean;
};

export function ProductCard({
  product,
  prioritizeImage = false,
}: ProductCardProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { productIds, toggleWishlist } = useWishlist();
  const wishlisted = productIds.includes(product.id);
  const image = product.images[0];

  function openQuickAdd() {
    dialogRef.current?.showModal();
  }

  return (
    <article className="product-card">
      <div className="product-card__image-wrap">
        <Link
          className="product-card__image-link"
          href={`/products/${product.slug}`}
          aria-label={`View ${product.name}`}
        >
          {image ? (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              loading={prioritizeImage ? "eager" : "lazy"}
              fetchPriority={prioritizeImage ? "high" : "auto"}
              unoptimized={product.isDemo === false}
              sizes="(max-width: 560px) 50vw, (max-width: 900px) 33vw, 25vw"
            />
          ) : (
            <span className="product-card__image-placeholder" role="img" aria-label={`${product.name} image coming soon`}>
              MALYK
            </span>
          )}
        </Link>
        {product.isNewArrival ? (
          <span className="product-card__badge">New arrival</span>
        ) : null}
        <IconButton
          className="product-card__wishlist"
          ariaLabel={
            wishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          aria-pressed={wishlisted}
          onClick={() => toggleWishlist(product.id)}
        >
          <Heart aria-hidden="true" fill={wishlisted ? "currentColor" : "none"} />
        </IconButton>
        <button
          className="product-card__quick-add"
          type="button"
          onClick={openQuickAdd}
        >
          Quick add
        </button>
      </div>
      <div className="product-card__details">
        <div className="product-card__title-row">
          <div>
            <Link href={`/products/${product.slug}`}>{product.name}</Link>
            <p>{product.categoryName ?? product.category}</p>
          </div>
          <span>{formatPrice(product.priceMinor, product.currency)}</span>
        </div>
        <p className="product-card__colors">
          {product.availableColors.map((color) => color.name).join(" · ")}
        </p>
      </div>
      <dialog
        className="quick-add-dialog"
        aria-labelledby={`quick-add-title-${product.id}`}
        ref={dialogRef}
      >
        <div className="quick-add-dialog__heading">
          <div>
            <p className="eyebrow">Quick add</p>
            <h2 id={`quick-add-title-${product.id}`}>{product.name}</h2>
          </div>
          <IconButton
            ariaLabel={`Close ${product.name} options`}
            onClick={() => dialogRef.current?.close()}
          >
            <X aria-hidden="true" />
          </IconButton>
        </div>
        <ProductOptions product={product} compact />
      </dialog>
    </article>
  );
}
