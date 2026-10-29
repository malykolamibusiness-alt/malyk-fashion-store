import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AdminLayoutGate } from "@/features/admin/AdminLayoutGate";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<p className="admin-loading">Verifying administrator access…</p>}
    >
      <AdminLayoutGate>{children}</AdminLayoutGate>
    </Suspense>
  );
}
