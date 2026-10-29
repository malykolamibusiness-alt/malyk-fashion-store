"use client";

import { useState, useTransition } from "react";
import { updateAdminOrderFulfilment } from "./admin-order-actions";

export function AdminOrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(formData: FormData) { startTransition(async () => { const result = await updateAdminOrderFulfilment(formData); setError(result.error ?? ""); }); }
  return <form className="admin-action-form" action={submit}>
    <input type="hidden" name="orderId" value={orderId} />
    <label><span>Fulfilment status</span><select name="status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="pending">Pending</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option><option value="cancelled">Cancelled</option><option value="refund_initiated">Refund initiated</option><option value="refunded">Refunded</option></select></label>
    <label><span>Carrier</span><input name="carrier" /></label>
    <label><span>Tracking number</span><input name="trackingNumber" /></label>
    <label><span>Tracking URL</span><input name="trackingUrl" type="url" /></label>
    <label><span>Admin note</span><textarea name="note" maxLength={2000} /></label>
    {error ? <p className="form-message form-message--error" role="alert">{error}</p> : null}
    <button className="button button--primary" disabled={pending}>{pending ? "Saving…" : "Update order"}</button>
  </form>;
}
