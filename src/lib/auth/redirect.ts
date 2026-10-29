const LOCAL_SITE_URL = "http://localhost:3000";

export function safeRedirectPath(
  value: unknown,
  fallback = "/account",
): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://malyk.invalid");
    if (parsed.origin !== "https://malyk.invalid") return fallback;
    if (parsed.pathname === "/login" || parsed.pathname === "/register") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === "development") return LOCAL_SITE_URL;
    throw new Error(
      "Set NEXT_PUBLIC_SITE_URL to the canonical site origin before using email authentication in production.",
    );
  }

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute URL.");
  }

  if (
    url.protocol !== "https:" &&
    url.hostname !== "localhost" &&
    url.hostname !== "127.0.0.1"
  ) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS outside local development.");
  }

  return url.origin;
}
