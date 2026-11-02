import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { requireAdmin } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Customers | MALYK Studio" };

export default async function AdminCustomersPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { supabase, isAdmin } = await requireAdmin("/admin/customers");
  if (!isAdmin) redirect("/account?access=denied");
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  let query = supabase.from("profiles").select("id, display_name, phone, created_at").order("created_at", { ascending: false }).limit(100);
  if (search) query = query.ilike("display_name", `%${search}%`);
  const { data: customers, error } = await query;
  return <main className="admin-page"><Container>
    <p className="eyebrow">MALYK / Studio</p><h1 className="admin-title">Customers</h1>
    <form className="admin-search" method="get"><label><span>Search by name</span><input name="search" defaultValue={search} /></label><button className="button button--secondary">Search</button></form>
    {error ? <p className="form-message form-message--error" role="alert">Customer profiles could not be loaded.</p> : null}
    <div className="admin-customer-list">{customers?.map((customer) => <article key={customer.id}>
      <div><strong>{customer.display_name || "Unnamed customer"}</strong><span>{customer.phone || "No phone provided"}</span></div><time dateTime={customer.created_at}>{new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(customer.created_at))}</time>
    </article>)}</div>
    {!error && !customers?.length ? <div className="admin-empty"><h2>No customers found.</h2></div> : null}
  </Container></main>;
}
