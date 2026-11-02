# MALYK

MALYK is a contemporary international fashion storefront for men and women,
built with the Next.js App Router, TypeScript, Tailwind CSS, and an editorial
design system.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To browse the clearly labeled development catalog without Supabase, set
`MALYK_USE_DEMO_CATALOG=true` in `.env.local`. The demo catalog is development
only; it is not live inventory and is never used as a fallback when a configured
database is empty or unavailable.

For Supabase authentication, database migrations, the first administrator, and
product management, follow [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

## Routes

- `/shop` — published styles with search and catalog filters
- `/collections/[slug]` — active catalog categories and collections
- `/products/[slug]` — published product details and live variant availability
- `/login`, `/register`, `/account` — customer authentication and profile
- `/admin` — administrator dashboard
- `/admin/products` — administrator product management
- `/cart`, `/wishlist` — browser-persisted product and variant references
- `/checkout` — checkout preview; orders and payments are not enabled
- `/design-system` — internal design-system preview

The browser cart stores product/variant identifiers and quantities only.
Product prices and availability come from the current catalog; checkout and
inventory reservation are not implemented.

## Quality checks

```bash
npm test
npm run lint
npm run build
```

`npm test` requires Node.js 22.18 or newer for Node's built-in TypeScript
stripping used by the small configuration/redirect tests.

## Project structure

- `src/app/` — App Router pages and layouts
- `src/components/` — shared layout, editorial, product, and UI components
- `src/features/` — catalog, cart, wishlist, authentication, and admin flows
- `src/data/` — clearly labeled local demonstration catalog
- `src/lib/` — Supabase clients, catalog access, and shared utilities
- `src/styles/` — global styles and design tokens
- `src/types/` — shared TypeScript and database types
- `supabase/migrations/` — versioned database schema, policies, and storage
- `supabase/tests/` — pgTAP row-level security tests
- `tests/` — Node.js unit tests

Orders, checkout, payment processing, and stock reservation are intentionally
not part of this phase.
