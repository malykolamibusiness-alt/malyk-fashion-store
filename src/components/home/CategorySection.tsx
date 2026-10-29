import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { fashionImages } from "@/lib/images";

const categories = [
  {
    title: "Men",
    description: "Modern essentials, considered for every day.",
    href: "/collections/men",
    image: fashionImages.men,
    imageAlt: "Contemporary menswear with a relaxed tailored silhouette",
  },
  {
    title: "Women",
    description: "Expressive silhouettes with a timeless point of view.",
    href: "/collections/women",
    image: fashionImages.women,
    imageAlt: "Contemporary womenswear in a refined editorial setting",
  },
];

export function CategorySection() {
  return (
    <section className="home-section category-section" aria-labelledby="category-title">
      <Container>
        <div className="home-section__heading">
          <p className="eyebrow">Find your point of view</p>
          <h2 id="category-title">Shop by category</h2>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              className="category-card"
              href={category.href}
              key={category.title}
              aria-label={`Explore ${category.title}`}
            >
              <Image
                src={category.image}
                alt={category.imageAlt}
                fill
                sizes="(max-width: 760px) 100vw, 50vw"
              />
              <span className="category-card__scrim" aria-hidden="true" />
              <span className="category-card__content">
                <span className="category-card__title">{category.title}</span>
                <span className="category-card__description">
                  {category.description}
                </span>
                <span className="category-card__cta">
                  Explore {category.title}
                  <ArrowUpRight aria-hidden="true" size={17} />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
