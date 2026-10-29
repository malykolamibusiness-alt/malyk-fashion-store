"use client";

import { useActionState, useState } from "react";
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction, type AddressActionState } from "./address-actions";

export type SavedAddress = {
  id: string; full_name: string; phone: string; country: string; address_line1: string; address_line2: string;
  city: string; state: string; postal_code: string; is_default: boolean;
};

const initialState: AddressActionState = {};

export function AddressManager({ addresses }: { addresses: SavedAddress[] }) {
  const [editing, setEditing] = useState<SavedAddress | null>(null);
  const [state, action, pending] = useActionState(saveAddressAction, initialState);
  return (
    <div className="addresses-layout">
      <form className="account-form" action={action}>
        <input name="id" type="hidden" value={editing?.id ?? ""} />
        <label><span>Full name</span><input name="fullName" required defaultValue={editing?.full_name ?? ""} maxLength={160} autoComplete="name" /></label>
        <label><span>Phone</span><input name="phone" defaultValue={editing?.phone ?? ""} maxLength={40} autoComplete="tel" /></label>
        <label><span>Country</span><input name="country" required defaultValue={editing?.country ?? ""} maxLength={80} autoComplete="country-name" /></label>
        <label><span>Address line 1</span><input name="addressLine1" required defaultValue={editing?.address_line1 ?? ""} maxLength={240} autoComplete="address-line1" /></label>
        <label><span>Address line 2</span><input name="addressLine2" defaultValue={editing?.address_line2 ?? ""} maxLength={240} autoComplete="address-line2" /></label>
        <label><span>City</span><input name="city" required defaultValue={editing?.city ?? ""} maxLength={120} autoComplete="address-level2" /></label>
        <label><span>State or region</span><input name="state" defaultValue={editing?.state ?? ""} maxLength={120} autoComplete="address-level1" /></label>
        <label><span>Postal code</span><input name="postalCode" defaultValue={editing?.postal_code ?? ""} maxLength={32} autoComplete="postal-code" /></label>
        <label className="checkbox-label"><input name="isDefault" type="checkbox" defaultChecked={editing?.is_default ?? addresses.length === 0} /> Use as default address</label>
        {state.error ? <p className="form-message form-message--error" role="alert">{state.error}</p> : null}
        {state.success ? <p className="form-message" role="status">{state.success}</p> : null}
        <button className="button button--primary" disabled={pending}>{pending ? "Saving…" : editing ? "Update address" : "Add address"}</button>
        {editing ? <button className="button button--secondary" type="button" onClick={() => setEditing(null)}>Cancel editing</button> : null}
      </form>
      <section className="saved-addresses" aria-label="Saved addresses">
        {addresses.length ? addresses.map((address) => (
          <article className="saved-address" key={address.id}>
            {address.is_default ? <span className="status-badge">Default</span> : null}
            <h2>{address.full_name}</h2>
            <p>{address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ""}<br />{address.city}{address.state ? `, ${address.state}` : ""} {address.postal_code}<br />{address.country}</p>
            <div className="saved-address__actions">
              <button className="text-button" type="button" onClick={() => setEditing(address)}>Edit</button>
              {!address.is_default ? <form action={setDefaultAddressAction.bind(null, address.id)}><button className="text-button" type="submit">Make default</button></form> : null}
              <form action={deleteAddressAction.bind(null, address.id)}><button className="text-button" type="submit">Delete</button></form>
            </div>
          </article>
        )) : <p>No saved addresses yet.</p>}
      </section>
    </div>
  );
}
