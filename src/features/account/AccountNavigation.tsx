"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "My orders" },
  { href: "/account/addresses", label: "Addresses" },
];

export function AccountNavigation() {
  const pathname = usePathname();
  return <nav className="account-navigation" aria-label="Account navigation">
    {links.map((link) => {
      const active = link.href === "/account" ? pathname === link.href : pathname.startsWith(link.href);
      return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}>{link.label}</Link>;
    })}
  </nav>;
}
