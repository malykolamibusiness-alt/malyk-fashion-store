"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReviewActionState = {
  message: string;
  success: boolean;
};

export async function submitProductReview(
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { success: false, message: "Please sign in before writing a review." };
  }

  const productId = String(formData.get("productId") ?? "");
  const productSlug = String(formData.get("productSlug") ?? "");
  const rating = Number(formData.get("rating") ?? 0);
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!productId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { success: false, message: "Choose a rating from 1 to 5 stars." };
  }
  if (body.length < 1 || body.length > 2000) {
    return { success: false, message: "Write a review between 1 and 2000 characters." };
  }
  if (title.length > 120) {
    return { success: false, message: "Keep the review title to 120 characters or fewer." };
  }

  const { data: eligible, error: eligibilityError } = await supabase.rpc(
    "product_has_verified_purchase",
    { p_product_id: productId },
  );
  if (eligibilityError) {
    console.error("Could not check review eligibility.", eligibilityError);
    return { success: false, message: "We could not verify your review eligibility. Please try again." };
  }
  if (!eligible) {
    return { success: false, message: "Only customers with a completed purchase of this piece can write a review." };
  }

  const { error } = await supabase.from("product_reviews").insert({
    product_id: productId,
    user_id: userData.user.id,
    rating,
    title,
    body,
    status: "pending",
  });
  if (error) {
    if (error.code === "23505") {
      return { success: false, message: "You have already submitted a review for this piece." };
    }
    console.error("Could not submit review.", error);
    return { success: false, message: "Your review could not be submitted. Please try again." };
  }

  revalidatePath(productSlug ? `/products/${productSlug}` : "/products");
  return {
    success: true,
    message: eligible
      ? "Thank you. Your review is awaiting moderation. Your verified purchase will be shown when approved."
      : "Thank you. Your review is awaiting moderation.",
  };
}
