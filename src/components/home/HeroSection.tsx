import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { fashionImages } from "@/lib/images";

export function HeroSection() {
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <Image
        className="home-hero__image"
        src={fashionImages.hero}
        alt="Contemporary fashion campaign portrait in a sculptural silhouette"
        fill
        priority
        sizes="100vw"
      />
      <div className="home-hero__scrim" aria-hidden="true" />
      <Container className="home-hero__content">
        <p className="eyebrow">MALYK / The new collection</p>
        <h1 id="home-hero-title">Modern Expression.<br />Timeless Presence.</h1>
        <p>
          Refined silhouettes and exacting details, composed for a confident
          international wardrobe.
        </p>
        <div className="home-hero__actions">
          <Button href="/collections/men">Shop Men</Button>
          <Button href="/collections/women" variant="secondary">
            Shop Women
          </Button>
        </div>
      </Container>
      <span className="home-hero__index" aria-hidden="true">
        01 — MALYK
      </span>
    </section>
  );
}
