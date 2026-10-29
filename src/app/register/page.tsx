import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/Container";
import { AuthForm } from "@/features/auth/AuthForm";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Create an account | MALYK",
  description: "Create a MALYK customer account.",
};

type RegisterPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

async function RegisterContent({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  return (
    <main id="main-content" className="account-page">
      <Container className="account-page__inner">
        <p className="eyebrow">MALYK / Account</p>
        <h1>Create your account.</h1>
        <p>Save your details for a more considered shopping experience.</p>
        <AuthForm mode="register" nextPath={safeRedirectPath(params.next)} />
      </Container>
    </main>
  );
}

export default function RegisterPage(props: RegisterPageProps) {
  return (
    <Suspense fallback={<p className="account-loading">Loading registration…</p>}>
      <RegisterContent {...props} />
    </Suspense>
  );
}
