import { Container } from "@/components/ui/Container";

export function BrandStatement() {
  return (
    <section className="brand-statement" aria-labelledby="brand-statement-title">
      <Container>
        <p className="eyebrow">The MALYK point of view</p>
        <h2 id="brand-statement-title">Less, But Considered.</h2>
        <p>
          MALYK brings together modern silhouettes and thoughtful design for a
          wardrobe that moves confidently across seasons.
        </p>
      </Container>
    </section>
  );
}
