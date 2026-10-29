# MALYK Deployment Audit

Status: **Preview deployment is not yet ready for live payment activation.**

## Verified locally

- Framework: Next.js 16.4.3, React 19.3.0, TypeScript
- Git branch: `main`
- Git remote: `malykolamibusiness-alt/malyk-fashion-store`
- Working tree checked before changes
- ESLint: passed
- Automated tests: 6 passed
- TypeScript check: passed
- Production build: passed
- Production dependency audit: 0 vulnerabilities
- `.env.local` is excluded by Git
- No tracked secret/key files were found
- Supabase publishable URL and key are configured locally
- Supabase API is reachable

## Critical launch blockers

1. The Supabase catalog tables were not found in the connected project (`PGRST205`).
   Apply the versioned migrations to the intended production project before launch.
2. Production Supabase environment variables, secret-key boundaries, and database
   migrations have not been verified against one intended production project.
3. Server-only payment credentials are not configured locally: Stripe, Stripe
   webhook signing secret, Supabase service role, and Paystack are required only for
   their corresponding live flows.
4. GitHub CLI authentication is incomplete; the remote exists, but the latest local
   changes must not be considered published until authentication is completed and the
   push succeeds.
5. Stripe and Paystack webhook endpoints must be registered against the final HTTPS
   domain and tested in provider test mode.

## High-priority configuration

- Set `NEXT_PUBLIC_SITE_URL` to the canonical deployed HTTPS origin.
- Add production values in Vercel, never in source control.
- Configure Supabase Auth Site URL and callback URLs to the deployed domain.
- Provision the initial administrator through the secured database procedure documented
  in `SUPABASE_SETUP.md`; customer registrations must not receive admin rights.
- Configure the production Supabase storage bucket and product-image policies.
- Supply real shipping rates, tax rules, currency support, and verified provider currency
  capabilities. Test mode is required before any live activation.

## Environment variables used

Public configuration:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Server-only integration configuration:
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYSTACK_SECRET_KEY`

Optional local development:
- `MALYK_USE_DEMO_CATALOG=true`

## Manual deployment steps

1. Apply the Supabase migrations using the intended linked project.
2. Complete GitHub CLI authentication and push the verified commit.
3. Import the GitHub repository into Vercel as a Next.js project.
4. Add the environment variables above in Vercel production settings.
5. Deploy the preview and verify the assigned HTTPS URL.
6. Update Supabase Auth redirect URLs and provider webhooks to that URL.
7. Run provider test-mode and webhook tests.
8. Add a custom domain only after the deployment URL and DNS values are available.

## Not yet verified

- Remote Supabase migrations and RLS behavior
- Supabase storage bucket policies
- Stripe test checkout and webhook delivery
- Paystack test checkout and webhook delivery
- Deployed authentication callbacks
- Deployed cart, account, checkout, admin, and inventory flows
- Custom domain and HTTPS
- Transactional email delivery
- Lighthouse, accessibility, and deployed responsive testing
