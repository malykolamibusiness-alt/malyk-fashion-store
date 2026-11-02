"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";

export async function saveCategoryAction(formData: FormData): Promise<void> {
  const { supabase, isAdmin } = await requireAdmin("/admin/categories");
  if (!isAdmin) throw new Error("Administrator access required.");
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const active = formData.get("active") === "on";
  if (!name || name.length > 100) throw new Error("Enter a category name of 100 characters or fewer.");
  const slug = String(formData.get("slug") ?? name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!slug) throw new Error("Enter a valid category slug.");
  const values = { name, slug, description, active };
  const { error } = id
    ? await supabase.from("categories").update(values).eq("id", id)
    : await supabase.from("categories").insert(values);
  if (error) throw new Error("The category could not be saved.");
  redirect("/admin/categories");
}
