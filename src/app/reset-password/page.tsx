export const instant = false;

import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { ResetPasswordForm } from "@/features/auth/PasswordRecoveryForm";
import { requireUser } from "@/lib/auth/server";

export const metadata: Metadata = { title: "Choose a new password | MALYK", description: "Set a new password for your MALYK account." };

export default async function ResetPasswordPage() {
  await requireUser("/reset-password");
  return <main id="main-content" className="account-page"><Container className="account-page__inner">
    <p className="eyebrow">MALYK / Account</p><h1>Choose a new password.</h1>
    <p>Use at least 8 characters for your new password.</p>
    <ResetPasswordForm />
  </Container></main>;
}
