import { NextResponse } from "next/server";
import { getSupabaseEnvironment } from "@/lib/supabase/env";

export async function GET() {
  try {
    const { url, publishableKey } = getSupabaseEnvironment();
    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    const reachable = response.status > 0;
    const publishableKeyAccepted = response.status === 200;

    return NextResponse.json(
      {
        connected: reachable && publishableKeyAccepted,
        reachable,
        publishableKeyAccepted,
      },
      { status: reachable && publishableKeyAccepted ? 200 : 503 },
    );
  } catch (error) {
    console.error("Supabase connection test failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { connected: false, reachable: false, publishableKeyAccepted: false },
      { status: 503 },
    );
  }
}
