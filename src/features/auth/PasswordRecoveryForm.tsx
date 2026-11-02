"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  requestPasswordResetAction,
  resetPasswordAction,
  type AuthActionState,
} from "@/features/auth/actions";

const initialState: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);
  return (
    <form className="account-form" action={formAction}>
      <label><span>Email address</span><input autoComplete="email" name="email" required type="email" maxLength={254} /></label>
      {state.error ? <p className="form-message form-message--error" role="alert">{state.error}</p> : null}
      {state.success ? <p className="form-message" role="status">{state.success}</p> : null}
      <button className="button button--primary" disabled={isPending} type="submit">{isPending ? "Sending…" : "Send reset link"}</button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPasswordAction, initialState);
  const [visible, setVisible] = useState(false);
  return (
    <form className="account-form" action={formAction}>
      <label className="account-password-field"><span>New password</span><span className="account-password-control">
        <input autoComplete="new-password" minLength={8} maxLength={72} name="password" required type={visible ? "text" : "password"} />
        <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
      </span></label>
      <label><span>Confirm new password</span><input autoComplete="new-password" maxLength={72} name="confirmPassword" required type={visible ? "text" : "password"} /></label>
      {state.error ? <p className="form-message form-message--error" role="alert">{state.error}</p> : null}
      {state.success ? <p className="form-message" role="status">{state.success}</p> : null}
      <button className="button button--primary" disabled={isPending} type="submit">{isPending ? "Updating…" : "Update password"}</button>
    </form>
  );
}
