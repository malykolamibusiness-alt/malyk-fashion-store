"use client";

import { Heart } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useWishlist } from "@/features/wishlist/WishlistProvider";

export function WishlistToggle({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const { productIds, toggleWishlist } = useWishlist();
  const saved = productIds.includes(productId);
  return (
    <IconButton
      ariaLabel={saved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      aria-pressed={saved}
      onClick={() => toggleWishlist(productId)}
      className="product-detail__wishlist"
    >
      <Heart aria-hidden="true" fill={saved ? "currentColor" : "none"} />
      <span>{saved ? "Saved to wishlist" : "Add to wishlist"}</span>
    </IconButton>
  );
}
