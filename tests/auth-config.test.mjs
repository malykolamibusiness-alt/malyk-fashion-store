import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  getSupabaseEnvironment,
  hasSupabaseEnvironment,
} from "../src/lib/supabase/env-core.ts";
import { getSiteUrl, safeRedirectPath } from "../src/lib/auth/redirect.ts";

const originalEnvironment = { ...process.env };

afterEach(() => {
  for (const key of [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SITE_URL",
    "NODE_ENV",
  ]) {
    if (originalEnvironment[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnvironment[key];
  }
});

test("safe redirects allow only same-site relative paths", () => {
  assert.equal(safeRedirectPath("/admin/products"), "/admin/products");
  assert.equal(
    safeRedirectPath("/account?tab=profile#name"),
    "/account?tab=profile#name",
  );
  assert.equal(safeRedirectPath("//attacker.example"), "/account");
  assert.equal(safeRedirectPath("/\\attacker.example"), "/account");
  assert.equal(safeRedirectPath("https://attacker.example"), "/account");
  assert.equal(safeRedirectPath("/login"), "/account");
});

test("missing Supabase settings produce a clear configuration error", () => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  assert.equal(hasSupabaseEnvironment(), false);
  assert.throws(
    () => getSupabaseEnvironment(),
    /Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
  );
});

test("Supabase URL validation rejects insecure remote URLs", () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.example";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
  assert.throws(
    () => getSupabaseEnvironment(),
    /must use HTTPS outside local development/,
  );
});

test("production authentication requires an explicit canonical site URL", () => {
  process.env.NODE_ENV = "production";
  delete process.env.NEXT_PUBLIC_SITE_URL;
  assert.throws(
    () => getSiteUrl(),
    /Set NEXT_PUBLIC_SITE_URL to the canonical site origin/,
  );
});
