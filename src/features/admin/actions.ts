"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/server";
import { priceToMinorUnits } from "@/lib/pricing";

export type AdminActionState = {
  error?: string;
  success?: string;
  savedProductId?: string;
};

const uuidSchema = z.uuid();
const variantSchema = z.object({
  id: z.uuid().optional(),
  sku: z.string().trim().min(2).max(64).regex(
    /^[A-Za-z0-9][A-Za-z0-9._-]*$/,
    "SKU may contain letters, numbers, periods, underscores, and hyphens.",
  ),
  size: z.string().trim().min(1).max(40),
  color_name: z.string().trim().min(1).max(80),
  color_code: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  stock_quantity: z.number().int().min(0).max(100000),
  active: z.boolean(),
});
const imageManifestSchema = z.array(
  z.object({
    id: z.uuid(),
    alt_text: z.string().trim().min(1).max(250),
    display_order: z.number().int().min(0).max(10000),
  }),
);
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase hyphenated slug.");

const allowedImages = {
  "image/jpeg": { extension: "jpg", signature: "jpeg" },
  "image/png": { extension: "png", signature: "png" },
  "image/webp": { extension: "webp", signature: "webp" },
  "image/avif": { extension: "avif", signature: "avif" },
} as const;

function isValidImageSignature(
  bytes: Uint8Array,
  signature: (typeof allowedImages)[keyof typeof allowedImages]["signature"],
) {
  if (signature === "jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (signature === "png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    );
  }
  if (signature === "webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }
  const brand = String.fromCharCode(...bytes.slice(8, 12));
  return (
    String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" &&
    (brand === "avif" || brand === "avis")
  );
}

function readJsonField<T>(
  value: FormDataEntryValue | null,
  schema: z.ZodType<T>,
): T | null {
  if (typeof value !== "string") return null;
  try {
    const parsed: unknown = JSON.parse(value);
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

function fileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

async function revalidateStorefront(slug?: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/cart");
  revalidatePath("/wishlist");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  if (slug) {
    revalidatePath(`/products/${slug}`);
    revalidatePath("/collections/[slug]", "page");
  }
}

export async function saveProductAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { supabase, isAdmin } = await requireAdmin(
    "/admin/products/new",
  );
  if (!isAdmin) {
    return {
      error: "Administrator access could not be verified for this request.",
    };
  }

  const productIdInput = String(formData.get("productId") ?? "");
  const productId = productIdInput
    ? uuidSchema.safeParse(productIdInput)
    : null;
  if (productIdInput && !productId?.success) {
    return { error: "This product reference is invalid. Reload and try again." };
  }

  const fields = z
    .object({
      name: z.string().trim().min(1).max(160),
      slug: slugSchema,
      description: z.string().max(10000),
      categoryId: z.uuid(),
      status: z.enum(["draft", "published", "archived"]),
      currency: z.enum(["USD", "EUR", "GBP", "JPY"]),
      featured: z.boolean(),
      isNewArrival: z.boolean(),
    })
    .safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: formData.get("description"),
      categoryId: formData.get("categoryId"),
      status: formData.get("status"),
      currency: formData.get("currency"),
      featured: formData.get("featured") === "on",
      isNewArrival: formData.get("isNewArrival") === "on",
    });

  if (!fields.success) {
    return {
      error: fields.error.issues[0]?.message ?? "Check the product details.",
    };
  }

  const priceValue = formData.get("price");
  const priceMinor =
    typeof priceValue === "string"
      ? priceToMinorUnits(priceValue, fields.data.currency)
      : null;
  if (priceMinor === null) {
    return {
      error:
        fields.data.currency === "JPY"
          ? "Enter a whole-number price for JPY."
          : "Enter a non-negative price with up to two decimal places.",
    };
  }

  const variantRows = readJsonField(
    formData.get("variants"),
    z.array(variantSchema).max(100),
  );
  if (!variantRows) {
    return {
      error:
        "Variants must be valid JSON with SKU, size, color name, hex color, non-negative stock, and active fields.",
    };
  }
  const skuList = variantRows.map((variant) => variant.sku.toLowerCase());
  if (new Set(skuList).size !== skuList.length) {
    return { error: "Each variant must have a unique SKU." };
  }

  const imageManifest = readJsonField(
    formData.get("imageManifest"),
    imageManifestSchema,
  );
  if (!imageManifest) {
    return { error: "Existing image details are invalid. Reload and try again." };
  }
  if (
    new Set(imageManifest.map((image) => image.id)).size !==
    imageManifest.length
  ) {
    return { error: "An image appears more than once in the image list." };
  }
  if (
    new Set(imageManifest.map((image) => image.display_order)).size !==
    imageManifest.length
  ) {
    return { error: "Each product image must have a unique display order." };
  }
  const imageOrderBase = z.coerce
    .number()
    .int()
    .min(0)
    .max(10000)
    .safeParse(formData.get("imageOrderBase") ?? 0);
  if (!imageOrderBase.success) {
    return { error: "Image order must be a non-negative whole number." };
  }
  const collectionIds = z.array(z.uuid()).max(50).safeParse(
    formData.getAll("collectionIds"),
  );
  if (!collectionIds.success) {
    return { error: "Select valid collections for this product." };
  }
  if (new Set(collectionIds.data).size !== collectionIds.data.length) {
    return { error: "A collection can only be selected once." };
  }

  const files = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length > 10) {
    return { error: "Upload no more than 10 images at a time." };
  }
  const altTextValue = formData.get("imageAltTexts");
  const altTexts =
    typeof altTextValue === "string"
      ? altTextValue.split(/\r?\n/).map((text) => text.trim())
      : [];
  if (
    files.length > 0 &&
    (altTexts.length !== files.length ||
      altTexts.some((text) => text.length < 1 || text.length > 250))
  ) {
    return {
      error:
        "Provide one descriptive alternative text line per selected image.",
    };
  }

  const [categoryResult, collectionsResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id")
      .eq("id", fields.data.categoryId)
      .eq("active", true)
      .maybeSingle(),
    collectionIds.data.length
      ? supabase
          .from("collections")
          .select("id")
          .eq("active", true)
          .in("id", collectionIds.data)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (categoryResult.error || collectionsResult.error) {
    console.error("Could not verify product categories and collections.", {
      category: categoryResult.error,
      collections: collectionsResult.error,
    });
    return {
      error: "Product categories and collections could not be verified.",
    };
  }
  if (!categoryResult.data) {
    return { error: "Select an active product category." };
  }
  if ((collectionsResult.data?.length ?? 0) !== collectionIds.data.length) {
    return { error: "Select only active product collections." };
  }

  let existingVariants: Array<{ id: string }> = [];
  let existingImages: Array<{
    id: string;
    storage_path: string;
    display_order: number;
  }> = [];
  if (productId?.success) {
    const [{ data: product, error: productError }, variantsResult, imagesResult] =
      await Promise.all([
        supabase
          .from("products")
          .select("id, slug")
          .eq("id", productId.data)
          .maybeSingle(),
        supabase
          .from("product_variants")
          .select("id")
          .eq("product_id", productId.data),
        supabase
          .from("product_images")
          .select("id, storage_path, display_order")
          .eq("product_id", productId.data),
      ]);
    if (productError || !product) {
      if (productError) {
        console.error("Could not verify product before update.", productError);
      }
      return { error: "This product could not be found. Reload and try again." };
    }
    if (variantsResult.error || imagesResult.error) {
      console.error("Could not load product options for update.", {
        variants: variantsResult.error,
        images: imagesResult.error,
      });
      return { error: "Product options could not be loaded. Please try again." };
    }
    existingVariants = variantsResult.data ?? [];
    existingImages = imagesResult.data ?? [];

    const existingVariantIds = new Set(
      existingVariants.map((variant) => variant.id),
    );
    if (
      variantRows.some(
        (variant) => variant.id && !existingVariantIds.has(variant.id),
      )
    ) {
      return {
        error: "A variant does not belong to this product. Reload and try again.",
      };
    }
    const existingImageIds = new Set(existingImages.map((image) => image.id));
    if (imageManifest.some((image) => !existingImageIds.has(image.id))) {
      return {
        error: "An image does not belong to this product. Reload and try again.",
      };
    }
    if (
      files.length > 0 &&
      imageOrderBase.data <=
        Math.max(-1, ...imageManifest.map((image) => image.display_order))
    ) {
      return {
        error: "New image order must follow the existing product images.",
      };
    }
  } else if (variantRows.some((variant) => variant.id)) {
    return { error: "New products cannot include existing variant IDs." };
  }

  const productValues = {
    name: fields.data.name,
    slug: fields.data.slug,
    description: fields.data.description,
    category_id: fields.data.categoryId,
    status: fields.data.status,
    currency_code: fields.data.currency,
    price_minor: priceMinor,
    featured: fields.data.featured,
    is_new_arrival: fields.data.isNewArrival,
  };
  const productWrite = productId?.success
    ? supabase
        .from("products")
        .update(productValues)
        .eq("id", productId.data)
        .select("id")
        .single()
    : supabase.from("products").insert(productValues).select("id").single();
  const { data: savedProduct, error: productWriteError } = await productWrite;
  if (productWriteError || !savedProduct) {
    if (productWriteError) {
      console.error("MALYK product save failed.", productWriteError);
    }
    return {
      error:
        productWriteError?.code === "23505"
          ? "That product slug is already in use."
          : "The product could not be saved. Check the details and try again.",
    };
  }

  const { error: removeCollectionLinksError } = await supabase
    .from("collection_products")
    .delete()
    .eq("product_id", savedProduct.id);
  if (removeCollectionLinksError) {
    console.error(
      "Existing product collection links could not be updated.",
      removeCollectionLinksError,
    );
    return {
      error:
        "Product details were saved, but collection assignments could not be updated.",
      savedProductId: savedProduct.id,
    };
  }
  if (collectionIds.data.length > 0) {
    const { error: collectionInsertError } = await supabase
      .from("collection_products")
      .insert(
        collectionIds.data.map((collectionId, displayOrder) => ({
          collection_id: collectionId,
          product_id: savedProduct.id,
          display_order: displayOrder,
        })),
      );
    if (collectionInsertError) {
      console.error("Product collections could not be assigned.", collectionInsertError);
      return {
        error:
          "Product details were saved, but collection assignments could not be updated.",
        savedProductId: savedProduct.id,
      };
    }
  }

  const variantsToWrite = variantRows.map((variant) => ({
    ...(variant.id ? { id: variant.id } : {}),
    product_id: savedProduct.id,
    sku: variant.sku,
    size: variant.size,
    color_name: variant.color_name,
    color_code: variant.color_code.toUpperCase(),
    stock_quantity: variant.stock_quantity,
    active: variant.active,
  }));
  if (variantsToWrite.length > 0) {
    const { error: variantWriteError } = await supabase
      .from("product_variants")
      .upsert(variantsToWrite, { onConflict: "id" });
    if (variantWriteError) {
      console.error("MALYK variant save failed.", variantWriteError);
      return {
        error:
          variantWriteError.code === "23505"
            ? "A variant SKU or size/color combination is already in use."
            : "Product details were saved, but its variants could not be saved.",
        savedProductId: savedProduct.id,
      };
    }
  }

  const retainedVariantIds = variantRows.flatMap((variant) =>
    variant.id ? [variant.id] : [],
  );
  const omittedVariantIds = existingVariants
    .map((variant) => variant.id)
    .filter((id) => !retainedVariantIds.includes(id));
  if (omittedVariantIds.length > 0) {
    const { error: deleteVariantsError } = await supabase
      .from("product_variants")
      .delete()
      .eq("product_id", savedProduct.id)
      .in("id", omittedVariantIds);
    if (deleteVariantsError) {
      console.error("MALYK removed variants could not be deleted.", deleteVariantsError);
      return {
        error:
          "Product details were saved, but removed variants could not be cleared.",
        savedProductId: savedProduct.id,
      };
    }
  }

  for (const image of imageManifest) {
    const { error: imageUpdateError } = await supabase
      .from("product_images")
      .update({
        alt_text: image.alt_text,
        display_order: image.display_order,
      })
      .eq("id", image.id)
      .eq("product_id", savedProduct.id);
    if (imageUpdateError) {
      console.error("MALYK product image metadata update failed.", imageUpdateError);
      return {
        error:
          "Product details were saved, but image metadata could not be updated.",
        savedProductId: savedProduct.id,
      };
    }
  }

  const imageRows = [];
  for (const [index, file] of files.entries()) {
    const imageType =
      allowedImages[file.type as keyof typeof allowedImages];
    const ext = fileExtension(file.name);
    if (
      !imageType ||
      (ext !== imageType.extension &&
        !(imageType.signature === "jpeg" && ext === "jpeg")) ||
      file.size > 5 * 1024 * 1024
    ) {
      return {
        error:
          "Use JPEG, PNG, WebP, or AVIF images smaller than 5 MB each.",
        savedProductId: savedProduct.id,
      };
    }

    const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
    if (!isValidImageSignature(bytes, imageType.signature)) {
      return {
        error: "An uploaded image did not match its declared file type.",
        savedProductId: savedProduct.id,
      };
    }

    const storagePath = `${savedProduct.id}/${crypto.randomUUID()}.${imageType.extension}`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });
    if (uploadError) {
      console.error("MALYK product image upload failed.", uploadError);
      return {
        error:
          "Product details were saved, but an image upload failed. Check Storage setup and try again.",
        savedProductId: savedProduct.id,
      };
    }
    imageRows.push({
      product_id: savedProduct.id,
      storage_path: storagePath,
      alt_text: altTexts[index],
      display_order: imageOrderBase.data + index,
    });
  }

  if (imageRows.length > 0) {
    const { error: imageInsertError } = await supabase
      .from("product_images")
      .insert(imageRows);
    if (imageInsertError) {
      console.error("MALYK product image records could not be saved.", imageInsertError);
      const { error: removeError } = await supabase.storage
        .from("product-images")
        .remove(imageRows.map((image) => image.storage_path));
      if (removeError) {
        console.error("Orphaned MALYK product images could not be removed.", removeError);
      }
      return {
        error:
          "Product details were saved, but image records could not be saved.",
        savedProductId: savedProduct.id,
      };
    }
  }

  await revalidateStorefront(fields.data.slug);
  return {
    success: "Product and variant details have been saved.",
    savedProductId: savedProduct.id,
  };
}

export async function archiveProductAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const { supabase, isAdmin, verificationError } =
    await requireAdmin("/admin/products");
  if (!isAdmin) {
    return {
      error: verificationError
        ? "Administrator access could not be verified for this request."
        : "Administrator access is required.",
    };
  }
  const productId = uuidSchema.safeParse(formData.get("productId"));
  if (!productId.success) {
    return { error: "This product reference is invalid." };
  }
  const { data, error } = await supabase
    .from("products")
    .update({ status: "archived" })
    .eq("id", productId.data)
    .select("id, slug")
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("MALYK product archive failed.", error);
    return { error: "This product could not be archived." };
  }
  await revalidateStorefront(data.slug);
  return { success: "Product archived." };
}
