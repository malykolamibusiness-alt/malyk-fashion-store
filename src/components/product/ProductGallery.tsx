"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImage } from "@/types/product";

export function ProductGallery({
  images,
  productName,
  unoptimized = false,
}: {
  images: ProductImage[];
  productName: string;
  unoptimized?: boolean;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex] ?? images[0];
  if (!selectedImage) {
    return (
      <div className="product-gallery">
        <div className="product-gallery__placeholder" role="img" aria-label={`No image available for ${productName}`}>
          <span>MALYK</span>
          <small>Image unavailable</small>
        </div>
      </div>
    );
  }

  return (
    <div className="product-gallery">
      <div className="product-detail__image">
        <Image
          key={selectedImage.src}
          className="product-gallery__main-image"
          src={selectedImage.src}
          alt={selectedImage.alt}
          fill
          preload
          unoptimized={unoptimized}
          sizes="(max-width: 760px) 100vw, 58vw"
        />
      </div>
      {images.length > 1 ? (
        <div className="product-gallery__thumbnails" aria-label={`${productName} images`}>
          {images.map((image, index) => (
            <button
              aria-label={`Show image ${index + 1} of ${productName}`}
              aria-pressed={selectedIndex === index}
              className={selectedIndex === index ? "is-selected" : ""}
              key={`${image.src}-${index}`}
              onClick={() => setSelectedIndex(index)}
              type="button"
            >
              <Image
                src={image.src}
                alt=""
                width={88}
                height={112}
                sizes="88px"
                unoptimized={unoptimized}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
