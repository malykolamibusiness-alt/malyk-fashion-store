"use client";

import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import Link from "next/link";
import { BrandWordmark } from "@/components/BrandWordmark";
import { IconButton } from "@/components/ui/IconButton";
import { useCart } from "@/features/cart/CartProvider";
import { useWishlist } from "@/features/wishlist/WishlistProvider";
import { mainNavigation } from "@/lib/navigation";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cart = useCart();
  const wishlist = useWishlist();

  useEffect(() => {
    if (!menuOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  return (
    <header className="site-header" id="navigation">
      <div className="site-header__inner">
        <div className="site-header__mobile-control">
          <IconButton
            ariaLabel={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="mobile-menu-toggle"
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </IconButton>
        </div>

        <Link className="site-header__brand" href="/" aria-label="MALYK home">
          <BrandWordmark />
        </Link>

        <nav className="desktop-navigation" aria-label="Main navigation">
          {mainNavigation.map((item) => (
            <Link href={item.href} key={item.label}>
              {item.label}
            </Link>
          ))}
          <Link href="/shop">Shop all</Link>
        </nav>

        <div className="site-header__actions">
          <IconButton ariaLabel="Search products" href="/shop?search=">
            <Search aria-hidden="true" />
          </IconButton>
          <IconButton ariaLabel="Your account" href="/account">
            <UserRound aria-hidden="true" />
          </IconButton>
          <IconButton
            ariaLabel={`Wishlist, ${wishlist.productIds.length} saved items`}
            href="/wishlist"
          >
            <Heart aria-hidden="true" />
          </IconButton>
          <IconButton
            ariaLabel={`Shopping bag, ${cart.itemCount} items`}
            href="/cart"
            className="bag-control"
          >
            <ShoppingBag aria-hidden="true" />
            {cart.itemCount > 0 ? (
              <span className="bag-count" aria-hidden="true">
                {cart.itemCount}
              </span>
            ) : null}
          </IconButton>
        </div>
      </div>

      <nav
        className={`mobile-navigation${menuOpen ? " is-open" : ""}`}
        id="mobile-navigation"
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        {[...mainNavigation, { href: "/shop", label: "Shop all" }].map((item) => (
          <Link
            href={item.href}
            key={item.label}
            onClick={() => setMenuOpen(false)}
            tabIndex={menuOpen ? 0 : -1}
          >
            {item.label}
          </Link>
        ))}
        <p>Explore contemporary styles across our collections.</p>
      </nav>
    </header>
  );
}
