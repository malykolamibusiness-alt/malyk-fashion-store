import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { AuthForm } from "@/features/auth/AuthForm";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Sign in | MALYK",
  description: "Sign in to your MALYK customer account.",
};

type LoginPageProps = {
  searchParams: Promise<{
    next?: string | string[];
    message?: string | string[];
  }>;
};

async function LoginContent({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = safeRedirectPath(params.next);
  const callbackMessage =
    params.message === "confirmation-failed"
      ? "Your email confirmation could not be completed. Request a new confirmation email or try again."
      : params.message === "supabase-not-configured"
        ? "Customer accounts are not configured yet. Please try again later."
        : null;

  return (
    <main id="main-content" className="account-page">
      <Container className="account-page__inner">
        <p className="eyebrow">MALYK / Account</p>
        <h1>Welcome back.</h1>
        <p>Sign in to access your customer account.</p>
        {callbackMessage ? (
          <p className="form-message form-message--error" role="alert">
            {callbackMessage}
          </p>
        ) : null}
        <AuthForm mode="login" nextPath={nextPath} />
      </Container>
    </main>
  );
}

export default function LoginPage(props: LoginPageProps) {
  return (
    <Suspense fallback={<p className="account-loading">Loading sign in…</p>}>
      <LoginContent {...props} />
    </Suspense>
  );
}
