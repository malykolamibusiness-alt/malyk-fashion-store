"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  registerAction,
  signInAction,
  type AuthActionState,
} from "@/features/auth/actions";

type AuthFormProps = {
  mode: "login" | "register";
  nextPath?: string;
};

const initialState: AuthActionState = {};

export function AuthForm({ mode, nextPath = "/account" }: AuthFormProps) {
  const action = mode === "register" ? registerAction : signInAction;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isRegister = mode === "register";

  return (
    <form className="account-form" action={formAction}>
      {isRegister ? (
        <label>
          <span>Name</span>
          <input
            autoComplete="name"
            maxLength={100}
            name="displayName"
            required
          />
        </label>
      ) : null}
      <label>
        <span>Email</span>
        <input
          autoComplete="email"
          maxLength={254}
          name="email"
          required
          type="email"
        />
      </label>
      <label>
        <span>Password</span>
        <input
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={isRegister ? 8 : undefined}
          maxLength={72}
          name="password"
          required
          type="password"
        />
      </label>
      {isRegister ? (
        <label>
          <span>Confirm password</span>
          <input
            autoComplete="new-password"
            maxLength={72}
            name="confirmPassword"
            required
            type="password"
          />
        </label>
      ) : null}
      <input type="hidden" name="next" value={nextPath} />
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
      <button
        className="button button--primary"
        disabled={isPending}
        type="submit"
      >
        {isPending
          ? "Please wait…"
          : isRegister
            ? "Create account"
            : "Sign in"}
      </button>
      <p className="account-form__switch">
        {isRegister ? "Already have an account?" : "New to MALYK?"}{" "}
        <Link
          href={
            isRegister
              ? `/login?next=${encodeURIComponent(nextPath)}`
              : `/register?next=${encodeURIComponent(nextPath)}`
          }
        >
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
