import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { AccountNavigation } from "@/features/account/AccountNavigation";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <>
    <Container><AccountNavigation /></Container>
    {children}
  </>;
}
