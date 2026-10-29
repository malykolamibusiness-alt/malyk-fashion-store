"use client";

import { useActionState } from "react";
import {
  archiveProductAction,
  type AdminActionState,
} from "@/features/admin/actions";

const initialState: AdminActionState = {};

export function ArchiveProductForm({ productId }: { productId: string }) {
  const [state, action, isPending] = useActionState(
    archiveProductAction,
    initialState,
  );
  return (
    <form className="admin-archive-form" action={action}>
      <input type="hidden" name="productId" value={productId} />
      <button className="button button--secondary" disabled={isPending}>
        {isPending ? "Archiving…" : "Archive product"}
      </button>
      {state.error ? (
        <p className="form-message form-message--error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="form-message" role="status">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}
