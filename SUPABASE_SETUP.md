# Supabase setup

This guide connects the MALYK app to a Supabase project. Do not put a service-role
key in the app or expose it in browser code. The app uses the public
publishable/anon key, authenticated user sessions, database grants, and row-level
security (RLS).

## 1. Configure the app

1. Create a Supabase project, then copy `.env.example` to `.env.local`.
2. In the Supabase dashboard, open **Project Settings → API Keys** and copy the
   Project URL and publishable key into `.env.local`:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-project-publishable-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   MALYK_USE_DEMO_CATALOG=false
   ```

3. Keep `.env.local` private; it is ignored by git. Never add a service-role or
   secret key to a `NEXT_PUBLIC_` variable.

Without Supabase settings, the app shows an explicit catalog-unavailable
message. To view the local demonstration catalog instead, remove the Supabase
settings and set `MALYK_USE_DEMO_CATALOG=true` while running in development.
This setting has no effect in production.

## 2. Apply the database migration

Install the Supabase CLI following the
[Supabase CLI installation guide](https://supabase.com/docs/guides/cli), then
authenticate and link this folder to your project:

```bash
supabase login
supabase link --project-ref your-project-reference
supabase db push
```

`db push` applies the checked-in migrations to the linked project. Confirm that
the target project is the intended one before running it. The initial migration
creates customer profiles and roles, categories, collections, products, images,
variants, RLS policies, and a private `product-images` storage bucket. It seeds
only the starter categories and collections; it does not add sample products or
inventory.

For an isolated local database, start Supabase locally with Docker installed:

```bash
supabase start
supabase status
```

Use the local API URL and public anon/publishable key reported by the CLI in
`.env.local`, then start Next.js with `npm run dev`. Local database reset and
pgTAP test instructions are in the test section below.

## 3. Set authentication URLs

In the Supabase dashboard, open **Authentication → URL Configuration**:

- Set the Site URL to `http://localhost:3000` for local work.
- Add `http://localhost:3000/auth/callback` to the redirect URL allow list.
- Before deploying, set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin,
  set the matching production Site URL, and allow-list
  `https://your-domain.example/auth/callback`.

The app's registration flow supports email confirmation. Configure the desired
email confirmation policy and a working SMTP provider in Supabase before
launching publicly. The callback exchanges the one-time authorization code for
a session and rejects external redirect destinations.

## 4. Grant the first administrator

Register and confirm the account that should manage the catalog. In the
Supabase dashboard's SQL editor, look up its verified user UUID:

```sql
select id, email
from auth.users
where lower(email) = lower('admin@example.com');
```

After confirming the returned account is the intended one, promote exactly that
UUID using a project-owner SQL editor session:

```sql
update public.user_roles
set role = 'admin'
where user_id = 'PASTE-THE-VERIFIED-USER-UUID-HERE'::uuid
returning user_id, role;
```

Confirm that the returned role is `admin`, then sign in again and open
`/admin`. Do not expose this operation through an app route or give customers
access to the SQL editor. Customer role changes are blocked by RLS; admin status
is checked against the protected `user_roles` table on the server.

## 5. Add catalog products

1. Sign in with the administrator account and open `/admin/products`.
2. Create a product with its real name, description, category, price, and
   currency. New products default to draft; only publish when the product
   information is ready for customers.
3. Add each real SKU, size, color, and current stock quantity in the variants
   JSON field. A variant entry has this shape (replace every value with your
   actual product data):

   ```json
   [
     {
       "sku": "REPLACE-WITH-REAL-SKU",
       "size": "REPLACE",
       "color_name": "REPLACE",
       "color_code": "#171717",
       "stock_quantity": 0,
       "active": true
     }
   ]
   ```

   Use `0` until inventory has been verified; the app does not invent or seed
   stock.
4. Choose active collections if relevant. Upload JPEG, PNG, WebP, or AVIF
   product images (maximum 5 MB each) and provide descriptive alternative text.
5. Save, review the product, and publish it when ready. Published product images
   are served using short-lived signed URLs from the private storage bucket.

The editor intentionally validates image bytes as well as file name and declared
type. Admin changes are authorized by server-side checks and RLS.

## 6. Run checks

From the project directory:

```bash
npm test
npm run lint
npm run build
```

The Node.js unit tests cover redirect validation and environment configuration.
They use built-in TypeScript stripping and require Node.js 22.18 or newer.

For database policy tests, start the **local** Supabase stack and run:

```bash
supabase db reset
supabase test db
```

`supabase db reset` recreates the local database and removes its local data.
These pgTAP tests use rollback-protected fixtures; do not run a local reset
against a production project. No Supabase project credentials are included in
the repository.

## Current scope

The catalog, profiles, authentication, admin access, and product management are
implemented in this phase. Checkout, order creation, payments, stock reservation
or decrement, password recovery, and customer address management are not
implemented.
