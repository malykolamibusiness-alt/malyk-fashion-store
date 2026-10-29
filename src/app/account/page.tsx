import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AccountProfileForm } from "@/features/auth/AccountProfileForm";
import { signOutAction } from "@/features/auth/actions";
import { requireUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Your account | MALYK",
  description: "View and update your MALYK customer profile.",
};

type AccountPageProps = {
  searchParams: Promise<{ access?: string | string[] }>;
};

async function AccountContent({ searchParams }: AccountPageProps) {
  const params = await searchParams;
  const { supabase, user } = await requireUser("/account");
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("MALYK profile could not be loaded.", error);
  }

  return (
    <main id="main-content" className="account-page">
      <Container className="account-page__inner">
        <p className="eyebrow">MALYK / Account</p>
        <h1>Your account.</h1>
        <p className="account-page__email">{user.email}</p>
        {params.access === "denied" ? (
          <p className="form-message form-message--error" role="alert">
            This account does not have administrator access.
          </p>
        ) : null}
        {error || !profile ? (
          <p className="form-message form-message--error" role="alert">
            Your profile is not available yet. Please try again later.
          </p>
        ) : (
          <AccountProfileForm initialDisplayName={profile.display_name} initialPhone={profile.phone} />
        )}
        <nav className="account-links" aria-label="Account sections">
          <Link href="/account/orders">Order history</Link>
          <Link href="/account/addresses">Saved addresses</Link>
        </nav>
        <form action={signOutAction}>
          <button className="button button--secondary" type="submit">
            Sign out
          </button>
        </form>
      </Container>
    </main>
  );
}

export default function AccountPage(props: AccountPageProps) {
  return (
    <Suspense fallback={<p className="account-loading">Loading account…</p>}>
      <AccountContent {...props} />
    </Suspense>
  );
}
