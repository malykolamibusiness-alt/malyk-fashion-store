"use client";

import { useActionState } from "react";
import {
  updateProfileAction,
  type AuthActionState,
} from "@/features/auth/actions";

const initialState: AuthActionState = {};

export function AccountProfileForm({
  initialDisplayName,
  initialPhone = "",
}: {
  initialDisplayName: string;
  initialPhone?: string;
}) {
  const [state, action, isPending] = useActionState(
    updateProfileAction,
    initialState,
  );

  return (
    <form className="account-form" action={action}>
      <label>
        <span>Name</span>
        <input
          autoComplete="name"
          defaultValue={initialDisplayName}
          maxLength={100}
          name="displayName"
          required
        />
      </label>
      <label>
        <span>Phone number</span>
        <input
          autoComplete="tel"
          defaultValue={initialPhone}
          maxLength={40}
          name="phone"
        />
      </label>
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
      <button className="button button--primary" disabled={isPending} type="submit">
        {isPending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
