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
        <p className="eyebrow">MALYK / Modern dressing</p>
        <h1 id="home-hero-title">A New Perspective on Modern Dressing.</h1>
        <p>
          Considered silhouettes. Timeless essentials. A wardrobe shaped by
          individuality.
        </p>
        <div className="home-hero__actions">
          <Button href="/collections/the-malyk-edit">Discover the Collection</Button>
          <Button href="/collections/new-arrivals" variant="secondary">
            Explore New Arrivals
          </Button>
        </div>
      </Container>
      <span className="home-hero__index" aria-hidden="true">
        01 — MALYK
      </span>
    </section>
  );
}
