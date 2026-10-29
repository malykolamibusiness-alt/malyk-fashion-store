import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/home/ProductCard";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Product } from "@/types/product";

type ProductSectionProps = {
  title: string;
  description: string;
  products: Product[];
  href: string;
  linkLabel: string;
  id?: string;
  variant?: "standard" | "edit";
  prioritizeFirstImage?: boolean;
};

export function ProductSection({
  title,
  description,
  products,
  href,
  linkLabel,
  id,
  variant = "standard",
  prioritizeFirstImage = false,
}: ProductSectionProps) {
  return (
    <section
      className={`home-section product-section product-section--${variant}`}
      aria-labelledby={id}
    >
      <Container>
        <div className="product-section__heading">
          <SectionHeading
            id={id}
            eyebrow={variant === "edit" ? "Curated by MALYK" : "A considered selection"}
            title={title}
            description={description}
          />
          <Link className="section-link" href={href}>
            {linkLabel}
            <ArrowUpRight aria-hidden="true" size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {products.map((product, index) => (
            <ProductCard
              product={product}
              key={product.id}
              prioritizeImage={prioritizeFirstImage && index === 0}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
