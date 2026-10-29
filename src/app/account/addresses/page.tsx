export const instant = false;

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AddressManager, type SavedAddress } from "@/features/account/AddressManager";
import { requireUser } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Addresses | MALYK", description: "Manage your saved MALYK delivery addresses." };

export default async function AddressesPage() {
  const { supabase } = await requireUser("/account/addresses");
  const { data, error } = await supabase.from("customer_addresses").select("*").order("is_default", { ascending: false }).order("created_at", { ascending: true });
  return (
    <main id="main-content" className="account-page">
      <Container>
        <Link className="back-link" href="/account">← Account</Link>
        <p className="eyebrow">MALYK / Addresses</p>
        <h1>Saved addresses.</h1>
        {error ? <p className="form-message form-message--error" role="alert">Addresses could not be loaded.</p> : null}
        <AddressManager addresses={(data ?? []) as SavedAddress[]} />
      </Container>
    </main>
  );
}
