create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 1000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null check (char_length(name) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 10000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  currency_code text not null default 'USD' check (currency_code ~ '^[A-Z]{3}$'),
  price_minor bigint not null check (price_minor >= 0),
  featured boolean not null default false,
  is_new_arrival boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) <= 500),
  alt_text text not null check (char_length(alt_text) between 1 and 250),
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  sku text not null unique check (sku ~ '^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$'),
  size text not null check (char_length(size) between 1 and 40),
  color_name text not null check (char_length(color_name) between 1 and 80),
  color_code text not null check (color_code ~ '^#[0-9A-Fa-f]{6}$'),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, color_name)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 2000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  display_order integer not null default 0 check (display_order >= 0),
  primary key (collection_id, product_id)
);

create index products_public_listing_idx
  on public.products (status, featured desc, created_at desc);
create index products_category_status_idx
  on public.products (category_id, status);
create index product_images_product_order_idx
  on public.product_images (product_id, display_order);
create index product_variants_public_idx
  on public.product_variants (product_id, active, stock_quantity);
create index collection_products_order_idx
  on public.collection_products (collection_id, display_order);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();
create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();
create trigger collections_set_updated_at
before update on public.collections
for each row execute function public.set_updated_at();

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 100)
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'customer')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.collections enable row level security;
alter table public.collection_products enable row level security;

create policy "Profiles are readable by their owner and admins"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));
create policy "Customers update only their own profile"
on public.profiles for update to authenticated
using (id = (select auth.uid()) or (select public.is_admin()))
with check (id = (select auth.uid()) or (select public.is_admin()));

create policy "Admins manage user roles"
on public.user_roles for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Active categories are public"
on public.categories for select to anon, authenticated
using (active or (select public.is_admin()));
create policy "Admins manage categories"
on public.categories for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Published products are public"
on public.products for select to anon, authenticated
using (status = 'published' or (select public.is_admin()));
create policy "Admins manage products"
on public.products for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Published product images are public"
on public.product_images for select to anon, authenticated
using (
  (select public.is_admin())
  or exists (
    select 1 from public.products
    where products.id = product_images.product_id
      and products.status = 'published'
  )
);
create policy "Admins manage product images"
on public.product_images for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Available variants of published products are public"
on public.product_variants for select to anon, authenticated
using (
  (active and exists (
    select 1 from public.products
    where products.id = product_variants.product_id
      and products.status = 'published'
  ))
  or (select public.is_admin())
);
create policy "Admins manage product variants"
on public.product_variants for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Active collections are public"
on public.collections for select to anon, authenticated
using (active or (select public.is_admin()));
create policy "Admins manage collections"
on public.collections for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Public collections include published products"
on public.collection_products for select to anon, authenticated
using (
  (select public.is_admin())
  or (
    exists (
      select 1 from public.collections
      where collections.id = collection_products.collection_id
        and collections.active
    )
    and exists (
      select 1 from public.products
      where products.id = collection_products.product_id
        and products.status = 'published'
    )
  )
);
create policy "Admins manage collection products"
on public.collection_products for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant select on public.categories, public.products, public.product_images,
  public.product_variants, public.collections, public.collection_products
  to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant insert, update, delete on public.categories, public.products,
  public.product_images, public.product_variants, public.collections,
  public.collection_products to authenticated;
revoke all on public.profiles from anon;
revoke all on public.user_roles from anon;

insert into public.categories (name, slug, description)
values
  ('Men', 'men', 'Contemporary silhouettes and considered essentials for men.'),
  ('Women', 'women', 'Contemporary silhouettes and considered essentials for women.'),
  ('Accessories', 'accessories', 'Considered finishing touches.')
on conflict (slug) do nothing;

insert into public.collections (name, slug, description)
values
  ('New Arrivals', 'new-arrivals', 'The latest published additions to MALYK.'),
  ('The MALYK Edit', 'the-malyk-edit', 'A considered selection from the collection.')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Published product images can be signed"
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'product-images'
  and (
    (select public.is_admin())
    or exists (
      select 1
      from public.products
      where products.id::text = split_part(storage.objects.name, '/', 1)
        and products.status = 'published'
    )
  )
);
create policy "Admins upload product images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images'
  and (select public.is_admin())
  and split_part(name, '/', 1) ~* '^[0-9a-f-]{36}$'
);
create policy "Admins update product images"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()))
with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "Admins delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));
