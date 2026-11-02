import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { ForgotPasswordForm } from "@/features/auth/PasswordRecoveryForm";

export const metadata: Metadata = { title: "Forgot password | MALYK", description: "Reset your MALYK account password." };

export default function ForgotPasswordPage() {
  return <main id="main-content" className="account-page"><Container className="account-page__inner">
    <p className="eyebrow">MALYK / Account</p><h1>Reset your password.</h1>
    <p>Enter your email address and we will send reset instructions if an account exists.</p>
    <ForgotPasswordForm />
    <p className="account-form__switch"><Link href="/login">Return to sign in</Link></p>
  </Container></main>;
}
