export const instant = false;

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { createShippingMethodAction, createShippingZoneAction } from "@/features/admin/shipping-actions";
import { requireAdmin } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Shipping | MALYK Studio", description: "Configure MALYK shipping zones and methods." };
export default async function AdminShippingPage() {
  const { supabase, isAdmin } = await requireAdmin("/admin/shipping");
  if (!isAdmin) redirect("/account?access=denied");
  const { data: zones } = await supabase.from("shipping_zones").select("id, name, country_codes, active").order("name");
  const { data: methods } = await supabase.from("shipping_methods").select("id, zone_id, name, base_fee_minor, currency_code, free_shipping_min_minor, active").order("name");
  return <main className="admin-page"><Container><p className="eyebrow">MALYK / Studio</p><h1 className="admin-title">Shipping configuration</h1>
    <div className="admin-config-grid"><section><h2>Add zone</h2><form action={createShippingZoneAction} className="admin-action-form"><label><span>Zone name</span><input name="name" required maxLength={120} /></label><label><span>Country codes</span><input name="countries" required placeholder="US, GB, CA" /></label><button className="button button--primary">Create zone</button></form></section>
    <section><h2>Add method</h2><form action={createShippingMethodAction} className="admin-action-form"><label><span>Zone</span><select name="zoneId" required>{zones?.map((zone)=><option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label><label><span>Name</span><input name="name" required maxLength={120} /></label><label><span>Description</span><textarea name="description" maxLength={2000} /></label><label><span>Currency</span><input name="currency" defaultValue="USD" maxLength={3} /></label><label><span>Fee in minor units</span><input name="baseFee" type="number" min="0" step="1" defaultValue="0" required /></label><label><span>Free shipping threshold (minor units, optional)</span><input name="freeThreshold" type="number" min="0" step="1" /></label><button className="button button--primary">Create method</button></form></section></div>
    <section><h2>Configured zones</h2>{zones?.length ? <ul className="admin-simple-list">{zones.map((zone)=><li key={zone.id}><strong>{zone.name}</strong><span>{zone.country_codes.join(", ")} · {zone.active ? "Active" : "Inactive"}</span></li>)}</ul> : <p>No shipping zones configured.</p>}</section>
    <section><h2>Configured methods</h2>{methods?.length ? <ul className="admin-simple-list">{methods.map((method)=><li key={method.id}><strong>{method.name}</strong><span>{method.base_fee_minor} {method.currency_code}{method.free_shipping_min_minor !== null ? ` · free from ${method.free_shipping_min_minor}` : ""}</span></li>)}</ul> : <p>No shipping methods configured.</p>}</section>
  </Container></main>;
}
