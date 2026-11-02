import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/server";
import { AdminNavigation } from "@/features/admin/AdminNavigation";

export async function AdminLayoutGate({
  children,
}: {
  children: ReactNode;
}) {
  const { isAdmin, verificationError } = await requireAdmin("/admin");
  if (verificationError) {
    return (
      <main className="admin-access-error">
        <p className="eyebrow">MALYK / Studio</p>
        <h1>Administrator access could not be verified.</h1>
        <p>
          Check the Supabase connection and database migration, then try again.
        </p>
      </main>
    );
  }
  if (!isAdmin) redirect("/account?access=denied");

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar" aria-label="Administration">
        <Link className="brand-wordmark" href="/">
          MALYK
        </Link>
        <p className="eyebrow">Studio</p>
        <AdminNavigation />
        <Link className="admin-sidebar__storefront" href="/">
          Return to storefront
        </Link>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
