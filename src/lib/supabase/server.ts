import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabaseEnvironment } from "./env";

export async function createClient() {
  const { url, publishableKey } = getSupabaseEnvironment();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          console.warn(
            "Supabase session cookies could not be updated during server rendering; proxy refresh will handle them.",
            error,
          );
        }
      },
    },
  });
}
