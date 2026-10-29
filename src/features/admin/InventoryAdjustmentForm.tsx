"use client";

import { useState, useTransition } from "react";
import { adjustInventoryAction } from "./admin-inventory-actions";

export function InventoryAdjustmentForm({ variantId, stock }: { variantId: string; stock: number }) {
  const [error, setError] = useState(""); const [success, setSuccess] = useState(""); const [pending, startTransition] = useTransition();
  return <form className="inventory-adjustment" action={(formData) => startTransition(async () => { const result = await adjustInventoryAction(formData); setError(result.error ?? ""); setSuccess(result.error ? "" : "Stock updated."); })}>
    <input type="hidden" name="variantId" value={variantId} />
    <span>{stock} in stock</span>
    <label><span className="sr-only">Adjustment</span><input name="adjustment" type="number" step="1" required placeholder="+ / − units" /></label>
    <label><span className="sr-only">Reason</span><select name="reason" defaultValue="manual_correction"><option value="stock_received">Stock received</option><option value="manual_correction">Manual correction</option><option value="damaged">Damaged</option><option value="returned">Returned</option><option value="other">Other</option></select></label>
    <label><span className="sr-only">Note</span><input name="note" maxLength={2000} placeholder="Reason note" /></label>
    <button className="button button--secondary" disabled={pending}>{pending ? "Saving…" : "Adjust"}</button>
    {error ? <p className="form-message form-message--error" role="alert">{error}</p> : null}{success ? <p className="form-message" role="status">{success}</p> : null}
  </form>;
}
