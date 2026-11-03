"use server";

import { revalidatePath } from "next/cache";
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

export async function oauthSignInAction(
  provider: "google" | "discord" | "github" | "twitter",
  nextPath = "/account",
): Promise<never> {
  const { client, error } = await getAuthClient();
  if (!client) throw new Error(error ?? "Authentication is unavailable.");

  let redirectTo: string;
  try {
    redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(safeRedirectPath(nextPath, "/account"))}`;
  } catch (error) {
    throw error instanceof Error ? error : new Error("OAuth is not configured.");
  }

  const { data, error: oauthError } = await client.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (oauthError || !data.url) {
    console.error("MALYK OAuth sign-in failed.", oauthError, { provider });
    const providerName = {
      google: "Google",
      discord: "Discord",
      github: "GitHub",
      twitter: "X",
    }[provider];
    throw new Error(`Could not start ${providerName} sign-in.`);
  }
  redirect(data.url);
}

export async function googleOAuthAction(formData: FormData): Promise<never> {
  return oauthSignInAction("google", safeRedirectPath(formData.get("next"), "/account"));
}

export async function discordOAuthAction(formData: FormData): Promise<never> {
  return oauthSignInAction("discord", safeRedirectPath(formData.get("next"), "/account"));
}

export async function githubOAuthAction(formData: FormData): Promise<never> {
  return oauthSignInAction("github", safeRedirectPath(formData.get("next"), "/account"));
}

export async function twitterOAuthAction(formData: FormData): Promise<never> {
  return oauthSignInAction("twitter", safeRedirectPath(formData.get("next"), "/account"));
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = emailSchema.safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: email.error?.issues[0]?.message ?? "Enter a valid email address." };

  let redirectTo: string;
  try {
    redirectTo = `${getSiteUrl()}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
  } catch (error) {
    console.error("Password recovery URL is not configured.", error);
    return { error: "Password recovery is not configured yet." };
  }

  const { client: supabase, error: clientError } = await getAuthClient();
  if (!supabase) return { error: clientError ?? "Authentication is unavailable." };
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, { redirectTo });
  if (error) {
    console.error("Password recovery request failed.", error);
  }
  return { success: "If an account uses this email, you will receive password reset instructions shortly." };
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = passwordSchema.safeParse(formData.get("password"));
  const confirmation = String(formData.get("confirmPassword") ?? "");
  if (!password.success) return { error: password.error?.issues[0]?.message ?? "Enter a valid password." };
  if (confirmation !== password.data) return { error: "Passwords do not match." };

  const { client: supabase, error: clientError } = await getAuthClient();
  if (!supabase) return { error: clientError ?? "Authentication is unavailable." };
  const { error } = await supabase.auth.updateUser({ password: password.data });
  if (error) {
    console.error("Password reset failed.", error);
    return { error: "This reset link may be invalid or expired. Request a new link." };
  }
  return { success: "Your password has been updated. You can now sign in with your new password." };
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

export async function uploadAvatarAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { error: "Use a JPG, PNG, or WebP image." };
  }
  if (file.size > 2 * 1024 * 1024) return { error: "Avatar images must be 2 MB or smaller." };

  const { supabase, user } = await requireUser();
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${user.id}/avatar.${extension}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) {
    console.error("MALYK avatar upload failed.", uploadError);
    return { error: "Your avatar could not be uploaded. Please try again." };
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: data.publicUrl })
    .eq("id", user.id);
  if (error) return { error: "The avatar was uploaded, but your profile could not be updated." };
  revalidatePath("/account");
  return { success: "Your avatar has been updated." };
}

export async function removeAvatarAction(): Promise<void> {
  const { supabase, user } = await requireUser();
  const { data: files } = await supabase.storage.from("avatars").list(user.id);
  if (files?.length) {
    await supabase.storage.from("avatars").remove(files.map((file) => `${user.id}/${file.name}`));
  }
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) throw new Error("Your avatar could not be removed.");
  revalidatePath("/account");
  redirect("/account");
}

export async function deleteAccountAction(): Promise<never> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) throw new Error("Your account could not be deleted. Please try again.");
  await supabase.auth.signOut();
  redirect("/login?deleted=1");
}

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
  revalidatePath("/account");
  return { success: "Your profile has been updated." };
}
