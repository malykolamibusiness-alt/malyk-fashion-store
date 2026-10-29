export type ProductCategory = string;

export type ProductImage = {
  src: string;
  alt: string;
};

export type ProductColor = {
  id: string;
  name: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  size: string;
  colorId: string;
  available: boolean;
  stockQuantity: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  categoryName?: string;
  collections?: string[];
  collection: string;
  priceMinor: number;
  currency: string;
  images: ProductImage[];
  availableSizes: string[];
  availableColors: ProductColor[];
  variants: ProductVariant[];
  featured: boolean;
  isNewArrival: boolean;
  createdAt: string;
  isDemo?: boolean;
};

export type CartItem = {
  productId: string;
  variantId: string;
  size: string;
  colorId: string;
  quantity: number;
};
