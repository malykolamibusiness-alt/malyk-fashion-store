import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";
import { Container } from "@/components/ui/Container";

async function moderateReview(formData: FormData) {
  "use server";
  const { supabase, isAdmin } = await requireAdmin("/admin/reviews");
  if (!isAdmin) redirect("/admin");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["approved", "rejected", "hidden", "pending"].includes(status)) return;
  const { error } = await supabase
    .from("product_reviews")
    .update({ status: status as "pending" | "approved" | "rejected" | "hidden" })
    .eq("id", id);
  if (error) throw new Error("The review status could not be updated.");
  revalidatePath("/admin/reviews");
}

export default async function AdminReviewsPage() {
  const { supabase, isAdmin } = await requireAdmin("/admin/reviews");
  if (!isAdmin) redirect("/admin");
  const { data: reviews, error } = await supabase
    .from("product_reviews")
    .select("id, product_id, rating, title, body, status, verified_purchase, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const productIds = [...new Set((reviews ?? []).map((review) => review.product_id))];
  const { data: products } = await supabase.from("products").select("id, name, slug").in("id", productIds);
  const productMap = new Map((products ?? []).map((product) => [product.id, product]));

  return (
    <main className="admin-page">
      <Container>
        <p className="eyebrow">Administration</p>
        <h1>Product reviews</h1>
        {error ? <p className="form-message form-message--error" role="alert">Reviews could not be loaded.</p> : null}
        <div className="admin-review-list">
          {(reviews ?? []).map((review) => {
            const product = productMap.get(review.product_id);
            return (
              <article className="admin-review" key={review.id}>
                <div>
                  <p className="admin-review__status">{review.status}</p>
                  <h2>{product?.name ?? "Unavailable product"}</h2>
                  <p>{review.rating}/5 {review.title ? `— ${review.title}` : ""}</p>
                  <p>{review.body}</p>
                  <small>{new Date(review.created_at).toLocaleString()}{review.verified_purchase ? " · Verified purchase" : ""}</small>
                </div>
                <form action={moderateReview} className="admin-review__actions">
                  <input type="hidden" name="id" value={review.id} />
                  {review.status !== "approved" ? <button name="status" value="approved" type="submit">Approve</button> : null}
                  {review.status !== "rejected" ? <button name="status" value="rejected" type="submit">Reject</button> : null}
                  {review.status !== "hidden" ? <button name="status" value="hidden" type="submit">Hide</button> : null}
                </form>
              </article>
            );
          })}
          {!reviews?.length ? <p>No reviews have been submitted.</p> : null}
        </div>
      </Container>
    </main>
  );
}
