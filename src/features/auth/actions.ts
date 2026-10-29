"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSiteUrl, safeRedirectPath } from "@/lib/auth/redirect";
import { requireUser } from "@/lib/auth/server";
import { SupabaseConfigurationError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  success?: string;
};

const emailSchema = z.email("Enter a valid email address.").max(254);
const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.");

async function getAuthClient() {
  try {
    return { client: await createClient(), error: null };
  } catch (error) {
    if (error instanceof SupabaseConfigurationError) {
      return { client: null, error: error.message };
    }
    console.error("MALYK authentication service could not be reached.", error);
    return {
      client: null,
      error: "Authentication is temporarily unavailable. Please try again.",
    };
  }
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const displayName = z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters for your name.")
    .max(100, "Name must be 100 characters or fewer.")
    .safeParse(formData.get("displayName"));
  const email = emailSchema.safeParse(
    String(formData.get("email") ?? "").trim().toLowerCase(),
  );
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmation = z
    .string()
    .safeParse(formData.get("confirmPassword"));
  const nextPath = safeRedirectPath(formData.get("next"), "/account");

  if (!displayName.success || !email.success || !password.success) {
    return {
      error:
        displayName.error?.issues[0]?.message ??
        email.error?.issues[0]?.message ??
        password.error?.issues[0]?.message ??
        "Check the form and try again.",
    };
  }
  if (!confirmation.success || confirmation.data !== password.data) {
    return { error: "Passwords do not match." };
  }

  let redirectTo: string;
  try {
    redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`;
  } catch (error) {
    console.error("Email authentication URL is not configured.", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Email authentication is not configured.",
    };
  }

  const { client: supabase, error: clientError } = await getAuthClient();
  if (!supabase) return { error: clientError ?? "Authentication is unavailable." };
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: {
      data: { display_name: displayName.data },
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    console.error("Supabase account registration failed.", error);
    return {
      error:
        "We could not create the account. Check your details or sign in if you already registered.",
    };
  }

  if (!data.session) {
    return {
      success:
        "Account created. Check your email to confirm your address before signing in. If no email arrives, verify Supabase email settings.",
    };
  }

  redirect(nextPath);
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = emailSchema.safeParse(
    String(formData.get("email") ?? "").trim().toLowerCase(),
  );
  const password = z.string().min(1, "Enter your password.").safeParse(
    formData.get("password"),
  );

  if (!email.success || !password.success) {
    return {
      error:
        email.error?.issues[0]?.message ??
        password.error?.issues[0]?.message ??
        "Enter your email and password.",
    };
  }

  const { client: supabase, error: clientError } = await getAuthClient();
  if (!supabase) return { error: clientError ?? "Authentication is unavailable." };
  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: password.data,
  });

  if (error) {
    console.error("Supabase sign-in failed.", error);
    return { error: "Email or password was not accepted." };
  }

  redirect(
    safeRedirectPath(formData.get("next"), "/account"),
  );
}

export async function signOutAction() {
  const { supabase } = await requireUser();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Supabase sign-out failed.", error);
    throw new Error("We could not sign you out. Please try again.");
  }
  redirect("/login");
}

const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters.")
    .max(100, "Name must be 100 characters or fewer."),
  phone: z.string().trim().max(40, "Phone number is too long.").default(""),
});

export async function updateProfileAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your name." };
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName, phone: parsed.data.phone })
    .eq("id", user.id);

  if (error) {
    console.error("MALYK profile update failed.", error);
    return { error: "Your profile could not be updated. Please try again." };
  }
  return { success: "Your profile has been updated." };
}
