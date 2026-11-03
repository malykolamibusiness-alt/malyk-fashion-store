"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  discordOAuthAction,
  githubOAuthAction,
  googleOAuthAction,
  twitterOAuthAction,
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  return (
    <>
      <div className="account-oauth">
        <form action={googleOAuthAction}>
          <input type="hidden" name="next" value={nextPath} />
          <button className="button button--secondary" type="submit">
            Continue with Google
          </button>
        </form>
        <form action={discordOAuthAction}>
          <input type="hidden" name="next" value={nextPath} />
          <button className="button button--secondary" type="submit">
            Continue with Discord
          </button>
        </form>
        <form action={githubOAuthAction}>
          <input type="hidden" name="next" value={nextPath} />
          <button className="button button--secondary" type="submit">
            <span aria-hidden="true" className="account-oauth__github">GH</span> Continue with GitHub
          </button>
        </form>
        <form action={twitterOAuthAction}>
          <input type="hidden" name="next" value={nextPath} />
          <button className="button button--secondary" type="submit">
            <span aria-hidden="true" className="account-oauth__x">X</span> Continue with X
          </button>
        </form>
      </div>
      <p className="account-form__divider"><span>or continue with email</span></p>
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
      <label className="account-password-field">
        <span>Password</span>
        <span className="account-password-control">
          <input
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={isRegister ? 8 : undefined}
            maxLength={72}
            name="password"
            required
            type={showPassword ? "text" : "password"}
          />
          <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>
      {isRegister ? (
        <label className="account-password-field">
          <span>Confirm password</span>
          <span className="account-password-control">
            <input autoComplete="new-password" maxLength={72} name="confirmPassword" required type={showConfirmation ? "text" : "password"} />
            <button type="button" onClick={() => setShowConfirmation((visible) => !visible)} aria-label={showConfirmation ? "Hide confirmation password" : "Show confirmation password"} aria-pressed={showConfirmation}>
              {showConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
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
      {!isRegister ? <Link className="account-form__forgot" href="/forgot-password">Forgot password?</Link> : null}
      <p className="account-form__switch">
        {isRegister ? "Already have an account?" : "New to MALYK?"} {" "}
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
    </>
  );
}
