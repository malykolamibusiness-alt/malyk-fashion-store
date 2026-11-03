import type { Metadata } from "next";
import { connection } from "next/server";
import { Container } from "@/components/ui/Container";
import { requireUser } from "@/lib/auth/server";
import { getStorefrontCatalog } from "@/lib/catalog";
import { CheckoutForm } from "@/features/checkout/CheckoutForm";

export const instant = false;

export const metadata: Metadata = {
  title: "Secure checkout | MALYK",
  description: "Complete your MALYK order securely.",
};

export default async function CheckoutPage() {
  await connection();
  await requireUser("/checkout");
  const catalog = await getStorefrontCatalog();
  return (
    <main id="main-content" className="checkout-page">
      <Container>
        <p className="eyebrow">MALYK / Secure checkout</p>
        <h1>Checkout</h1>
        {catalog.source === "demo" ? <p className="demo-disclaimer">Live checkout requires database products and cannot use the development demo catalog.</p> : null}
        <CheckoutForm
          products={catalog.products.filter((product) => !product.isDemo)}
          stripeEnabled={Boolean(process.env.STRIPE_SECRET_KEY?.trim())}
          paystackEnabled={Boolean(process.env.PAYSTACK_SECRET_KEY?.trim())}
        />
      </Container>
    </main>
  );
}
