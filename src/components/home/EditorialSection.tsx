import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { fashionImages } from "@/lib/images";

export function EditorialSection() {
  return (
    <section className="editorial-section" aria-labelledby="editorial-title">
      <Image
        src={fashionImages.editorial}
        alt="Fashion editorial scene with contemporary looks and expressive styling"
        fill
        sizes="100vw"
      />
      <div className="editorial-section__scrim" aria-hidden="true" />
      <Container className="editorial-section__content">
        <p className="eyebrow">An enduring perspective</p>
        <h2 id="editorial-title">Designed to Outlast the Moment.</h2>
        <p>
          An approach to dressing defined by thoughtful details, enduring
          silhouettes, and the freedom to make each piece your own.
        </p>
        <Button href="/collections/the-malyk-edit" variant="secondary">
          Explore the Edit
        </Button>
      </Container>
    </section>
  );
}
