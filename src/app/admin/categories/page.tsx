import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { saveCategoryAction } from "@/features/admin/category-actions";
import { requireAdmin } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Categories | MALYK Studio" };

export default async function AdminCategoriesPage() {
  const { supabase, isAdmin } = await requireAdmin("/admin/categories");
  if (!isAdmin) redirect("/account?access=denied");
  const { data: categories, error } = await supabase.from("categories").select("id, name, slug, description, active").order("name");
  return <main className="admin-page"><Container>
    <p className="eyebrow">MALYK / Studio</p><h1 className="admin-title">Categories</h1>
    {error ? <p className="form-message form-message--error" role="alert">Categories could not be loaded.</p> : null}
    <div className="admin-category-grid">
      <section><h2>Existing categories</h2>{categories?.length ? categories.map((category) => <form key={category.id} action={saveCategoryAction} className="admin-category-card">
        <input type="hidden" name="id" value={category.id} />
        <label><span>Name</span><input name="name" defaultValue={category.name} required maxLength={100} /></label>
        <label><span>Slug</span><input name="slug" defaultValue={category.slug} required /></label>
        <label><span>Description</span><textarea name="description" defaultValue={category.description ?? ""} /></label>
        <label className="admin-checkbox"><input name="active" type="checkbox" defaultChecked={category.active} /> Visible</label>
        <button className="button button--secondary" type="submit">Save changes</button>
      </form>) : <p>No categories yet.</p>}</section>
      <section><h2>Add category</h2><form action={saveCategoryAction} className="admin-category-card">
        <label><span>Name</span><input name="name" required maxLength={100} /></label>
        <label><span>Slug</span><input name="slug" required /></label>
        <label><span>Description</span><textarea name="description" /></label>
        <label className="admin-checkbox"><input name="active" type="checkbox" defaultChecked /> Visible</label>
        <button className="button button--primary" type="submit">Create category</button>
      </form></section>
    </div>
  </Container></main>;
}
