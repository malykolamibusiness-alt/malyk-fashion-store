import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { fashionImages } from "@/lib/images";
import type { StoreCategory } from "@/lib/catalog";

type CategorySectionProps = {
  categories: StoreCategory[];
};

const categoryImages = {
  men: fashionImages.men,
  women: fashionImages.women,
  accessories: fashionImages.blazer,
  shoes: fashionImages.trousers,
  bags: fashionImages.coat,
};

export function CategorySection({ categories }: CategorySectionProps) {
  const preferredOrder = ["men", "women", "shoes", "bags", "accessories"];
  const availableCategories = preferredOrder
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is StoreCategory => Boolean(category));

  if (availableCategories.length === 0) return null;

  return (
    <section className="home-section category-section" aria-labelledby="category-title">
      <Container>
        <div className="home-section__heading">
          <div>
            <p className="eyebrow">The world of MALYK</p>
            <h2 id="category-title">Shop by Category</h2>
          </div>
        </div>
        <div className="category-grid">
          {availableCategories.map((category) => {
            const image = categoryImages[category.slug as keyof typeof categoryImages] ?? fashionImages.editorial;
            return (
              <Link
                className="category-card"
                href={`/collections/${category.slug}`}
                key={category.id}
                aria-label={`Explore ${category.name}`}
              >
                <Image src={image} alt={`${category.name} collection`} fill sizes="(max-width: 760px) 100vw, 50vw" />
                <span className="category-card__scrim" aria-hidden="true" />
                <span className="category-card__content">
                  <span className="category-card__title">{category.name}</span>
                  <span className="category-card__description">{category.description || `Explore the MALYK ${category.name.toLowerCase()} collection.`}</span>
                  <span className="category-card__cta">
                    Explore {category.name}
                    <ArrowUpRight aria-hidden="true" size={17} />
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
