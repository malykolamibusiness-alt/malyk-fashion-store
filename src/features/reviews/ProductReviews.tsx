"use client";

import { useActionState } from "react";
import Link from "next/link";
import { submitProductReview, type ReviewActionState } from "./actions";

export type ProductReview = {
  id: string;
  rating: number;
  title: string;
  body: string;
  verified_purchase: boolean;
  created_at: string;
};

const initialState: ReviewActionState = { success: false, message: "" };

export function ProductReviews({
  productId,
  productSlug,
  reviews,
  signedIn,
  eligible,
}: {
  productId: string;
  productSlug: string;
  reviews: ProductReview[];
  signedIn: boolean;
  eligible: boolean;
}) {
  const [state, formAction, pending] = useActionState(submitProductReview, initialState);
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return (
    <section className="product-reviews" aria-labelledby="reviews-title">
      <div className="product-reviews__summary">
        <p className="eyebrow">Customer notes</p>
        <h2 id="reviews-title">Reviews</h2>
        <p className="product-reviews__average" aria-label={`${average.toFixed(1)} out of 5 stars`}>
          <span aria-hidden="true">{average ? "★".repeat(Math.round(average)) : "☆☆☆☆☆"}</span>
          <strong>{average ? average.toFixed(1) : "No rating yet"}</strong>
          <span>{reviews.length} {reviews.length === 1 ? "review" : "reviews"}</span>
        </p>
      </div>

      {reviews.length ? (
        <div className="product-reviews__list">
          {reviews.map((review) => (
            <article className="product-review" key={review.id}>
              <div className="product-review__meta">
                <span className="product-review__stars" aria-label={`${review.rating} out of 5 stars`}>
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </span>
                <time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString()}</time>
              </div>
              {review.title ? <h3>{review.title}</h3> : null}
              <p>{review.body}</p>
              {review.verified_purchase ? <span className="product-review__verified">Verified purchase</span> : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="product-reviews__empty">
          <p>Be the first to review this piece.</p>
        </div>
      )}

      <div className="product-review-form-wrap">
        {!signedIn ? (
          <p><Link href={`/login?next=/products/${encodeURIComponent(productSlug)}`}>Sign in</Link> to write a review after purchasing this piece.</p>
        ) : eligible ? (
          <form action={formAction} className="product-review-form">
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="productSlug" value={productSlug} />
            <fieldset>
              <legend>Rating</legend>
              <div className="product-review-form__rating">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <label key={rating}><input required type="radio" name="rating" value={rating} /><span>{rating} star{rating === 1 ? "" : "s"}</span></label>
                ))}
              </div>
            </fieldset>
            <label>Review title <span>(optional)</span><input name="title" maxLength={120} /></label>
            <label>Your review<textarea name="body" required minLength={1} maxLength={2000} rows={5} /></label>
            <button className="button button--primary" type="submit" disabled={pending}>{pending ? "Submitting…" : "Submit review"}</button>
            {state.message ? <p className={state.success ? "form-message" : "form-message form-message--error"} role="status">{state.message}</p> : null}
          </form>
        ) : (
          <p className="product-reviews__eligibility">Reviews are available to customers who have purchased this piece.</p>
        )}
      </div>
    </section>
  );
}
