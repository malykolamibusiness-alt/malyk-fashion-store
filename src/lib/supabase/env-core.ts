export type SupabaseEnvironment = {
  url: string;
  publishableKey: string;
};

export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigurationError";
  }
}

export function getSupabaseEnvironment(): SupabaseEnvironment {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new SupabaseConfigurationError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local.",
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new SupabaseConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid absolute URL.",
    );
  }

  if (
    parsedUrl.protocol !== "https:" &&
    parsedUrl.hostname !== "localhost" &&
    parsedUrl.hostname !== "127.0.0.1"
  ) {
    throw new SupabaseConfigurationError(
      "Supabase must use HTTPS outside local development.",
    );
  }

  return { url: parsedUrl.origin, publishableKey };
}

export function hasSupabaseEnvironment() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
  );
}

export function isDemoCatalogEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.MALYK_USE_DEMO_CATALOG === "true"
  );
}
