import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function NotFoundContent() {
  return (
    <main id="main-content" className="not-found-page">
      <Container>
        <p className="eyebrow">MALYK / 404</p>
        <h1>Nothing here, for now.</h1>
        <p>
          The page you are looking for is not available. Explore the current
          demonstration collections or return to the MALYK homepage.
        </p>
        <div className="not-found-page__actions">
          <Button href="/">Return home</Button>
          <Link href="/collections/the-malyk-edit">Explore the MALYK Edit</Link>
        </div>
      </Container>
    </main>
  );
}
