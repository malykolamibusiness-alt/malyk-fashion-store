import { NextResponse, type NextRequest } from "next/server";
import { getSiteUrl, safeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  let siteUrl: string;
  try {
    siteUrl = getSiteUrl();
  } catch (error) {
    console.error("Authentication callback origin is not configured.", error);
    return NextResponse.json(
      { error: "Authentication callback is not configured." },
      { status: 503 },
    );
  }
  if (!code) {
    return NextResponse.redirect(
      new URL("/login?message=confirmation-failed", siteUrl),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Supabase authentication callback failed.", error);
    return NextResponse.redirect(
      new URL("/login?message=confirmation-failed", siteUrl),
    );
  }

  const destination = safeRedirectPath(url.searchParams.get("next"), "/account");
  return NextResponse.redirect(new URL(destination, siteUrl));
}
