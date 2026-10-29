import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function CheckoutCancelPage() {
  return <main id="main-content" className="checkout-page"><Container>
    <p className="eyebrow">MALYK / Checkout</p>
    <h1>Payment cancelled</h1>
    <p>No payment has been confirmed. Your bag has been preserved.</p>
    <Link className="button button--primary" href="/checkout">Return to checkout</Link>
  </Container></main>;
}
