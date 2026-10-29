import Link from "next/link";
import { BrandWordmark } from "@/components/BrandWordmark";
import { CurrentYear } from "@/components/layout/CurrentYear";
import { Container } from "@/components/ui/Container";
import { footerNavigation } from "@/lib/navigation";
import { siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer" id="footer-links">
      <Container className="site-footer__inner">
        <div className="site-footer__brand">
          <Link href="/" aria-label="MALYK home">
            <BrandWordmark />
          </Link>
          <p>{siteConfig.tagline}</p>
        </div>

        <nav aria-label="Customer information">
          <p className="eyebrow">Information</p>
          {footerNavigation.map((item) => (
            <a href={item.href} key={item.label}>
              {item.label}
            </a>
          ))}
          <p className="site-footer__note">
            Information pages will be added in a future phase.
          </p>
        </nav>

        <div className="site-footer__newsletter">
          <p className="eyebrow">MALYK notes</p>
          <p>Thoughtful updates, when the time is right.</p>
          <span className="newsletter-status">Newsletter coming soon</span>
        </div>

        <div className="site-footer__bottom">
          <p>
            © <CurrentYear /> MALYK. All rights reserved.
          </p>
          <p>Modern Expression. Timeless Presence.</p>
        </div>
      </Container>
    </footer>
  );
}
