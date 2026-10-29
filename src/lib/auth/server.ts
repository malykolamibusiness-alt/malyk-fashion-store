import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnvironment } from "@/lib/supabase/env";

export async function requireUser(nextPath = "/account") {
  if (!hasSupabaseEnvironment()) {
    redirect(
      `/login?message=supabase-not-configured&next=${encodeURIComponent(nextPath)}`,
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return { supabase, user: data.user };
}

export async function requireAdmin(nextPath = "/admin") {
  const { supabase, user } = await requireUser(nextPath);
  const { data: isAdmin, error } = await supabase.rpc("is_admin");

  if (error) {
    console.error("Could not verify MALYK admin authorization.", error);
    return { supabase, user, isAdmin: false as const, verificationError: true };
  }

  if (!isAdmin) {
    return {
      supabase,
      user,
      isAdmin: false as const,
      verificationError: false,
    };
  }

  return {
    supabase,
    user,
    isAdmin: true as const,
    verificationError: false,
  };
}
