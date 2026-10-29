import type { Metadata } from "next";
import type { Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CartProvider } from "@/features/cart/CartProvider";
import { WishlistProvider } from "@/features/wishlist/WishlistProvider";
import { siteConfig } from "@/lib/site";
import "@/styles/globals.css";

const editorialSerif = Cormorant_Garamond({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const interfaceSans = Manrope({
  variable: "--font-interface",
  subsets: ["latin"],
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: siteConfig.title, template: "%s | MALYK" },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image", title: siteConfig.title, description: siteConfig.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#111111",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${editorialSerif.variable} ${interfaceSans.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: siteConfig.name,
              url: siteUrl,
              description: siteConfig.description,
            }),
          }} />
        <CartProvider>
          <WishlistProvider>
            <a className="skip-link" href="#main-content">
              Skip to content
            </a>
            <AnnouncementBar />
            <SiteHeader />
            {children}
            <SiteFooter />
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
