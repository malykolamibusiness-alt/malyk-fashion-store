create type public.order_status as enum ('pending', 'processing', 'paid', 'cancelled', 'failed', 'refunded');
create type public.payment_status as enum ('pending', 'processing', 'succeeded', 'cancelled', 'failed', 'refunded');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_email text not null check (char_length(customer_email) between 3 and 320),
  customer_name text not null check (char_length(customer_name) between 1 and 160),
  phone text not null default '' check (char_length(phone) <= 40),
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  subtotal_minor integer not null check (subtotal_minor >= 0),
  shipping_minor integer not null default 0 check (shipping_minor >= 0),
  tax_minor integer not null default 0 check (tax_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  shipping_address jsonb not null,
  provider text not null check (provider in ('stripe', 'paystack')),
  provider_reference text unique,
  idempotency_key text not null unique check (char_length(idempotency_key) between 16 and 128),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null check (char_length(product_name) between 1 and 160),
  product_slug text not null default '',
  variant_sku text not null check (char_length(variant_sku) between 1 and 64),
  size text not null,
  color_name text not null,
  quantity integer not null check (quantity between 1 and 99),
  unit_price_minor integer not null check (unit_price_minor >= 0),
  line_total_minor integer not null check (line_total_minor >= 0),
  created_at timestamptz not null default now(),
  unique(order_id, product_variant_id)
);

create table public.payment_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'paystack')),
  provider_reference text,
  status public.payment_status not null default 'pending',
  amount_minor integer not null check (amount_minor >= 0),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  verified_at timestamptz,
  raw_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, provider_reference),
  unique(provider, raw_event_id)
);

create index orders_user_created_idx on public.orders(user_id, created_at desc);
create index orders_provider_reference_idx on public.orders(provider_reference);
create index order_items_order_idx on public.order_items(order_id);
create index payment_records_order_idx on public.payment_records(order_id);

create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();
create trigger payment_records_set_updated_at before update on public.payment_records
for each row execute function public.set_updated_at();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_records enable row level security;

create policy "Customers read their own orders"
on public.orders for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "Admins manage orders"
on public.orders for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Customers read their own order items"
on public.order_items for select to authenticated
using (exists (
  select 1 from public.orders
  where orders.id = order_items.order_id
    and (orders.user_id = (select auth.uid()) or (select public.is_admin()))
));
create policy "Admins manage order items"
on public.order_items for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Customers read their own payment records"
on public.payment_records for select to authenticated
using (exists (
  select 1 from public.orders
  where orders.id = payment_records.order_id
    and (orders.user_id = (select auth.uid()) or (select public.is_admin()))
));
create policy "Admins manage payment records"
on public.payment_records for all to authenticated
using ((select public.is_admin()));

grant select on public.orders, public.order_items, public.payment_records to authenticated;

create or replace function public.create_checkout_order(
  p_idempotency_key text,
  p_customer_email text,
  p_customer_name text,
  p_phone text,
  p_shipping_address jsonb,
  p_provider text,
  p_currency_code text,
  p_subtotal_minor integer,
  p_shipping_minor integer,
  p_tax_minor integer,
  p_total_minor integer,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
volatile
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_order_id uuid;
  v_item jsonb;
  v_product record;
  v_variant record;
  v_currency text := upper(p_currency_code);
  v_subtotal integer := 0;
  v_total_items integer := 0;
  v_expected_currencies integer;
begin
  if v_user_id is null then
    raise exception 'Authenticated checkout is required';
  end if;
  if char_length(p_idempotency_key) < 16 or char_length(p_idempotency_key) > 128 then
    raise exception 'Invalid idempotency key';
  end if;
  if p_provider not in ('stripe', 'paystack') then
    raise exception 'Unsupported payment provider';
  end if;

  select id into v_order_id from public.orders
  where idempotency_key = p_idempotency_key and user_id = v_user_id;
  if v_order_id is not null then return v_order_id; end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception 'Invalid checkout items';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if (v_item->>'quantity')::integer between 1 and 99 is not true then
      raise exception 'Invalid quantity';
    end if;
    select p.id, p.name, p.slug, p.status, p.currency_code, p.price_minor,
           v.id as variant_id, v.sku, v.size, v.color_name, v.active, v.stock_quantity
      into v_product
      from public.products p
      join public.product_variants v on v.product_id = p.id
      where v.id = (v_item->>'variant_id')::uuid
    for update;
    if v_product.id is null or v_product.status <> 'published' or not v_product.active then
      raise exception 'Product is unavailable';
    end if;
    if v_product.stock_quantity < (v_item->>'quantity')::integer then
      raise exception 'Insufficient stock';
    end if;
    if v_product.currency_code <> v_currency then
      raise exception 'Mixed checkout currencies are not supported';
    end if;
    v_subtotal := v_subtotal + v_product.price_minor * (v_item->>'quantity')::integer;
    v_total_items := v_total_items + 1;

    update public.product_variants
      set stock_quantity = stock_quantity - (v_item->>'quantity')::integer
      where id = v_product.variant_id
        and active and stock_quantity >= (v_item->>'quantity')::integer;
    if not found then raise exception 'Stock changed before checkout completed'; end if;
  end loop;

  if v_subtotal <> p_subtotal_minor or
     p_shipping_minor < 0 or p_tax_minor < 0 or
     p_total_minor <> v_subtotal + p_shipping_minor + p_tax_minor then
    raise exception 'Checkout total mismatch';
  end if;

  insert into public.orders (
    user_id, customer_email, customer_name, phone, currency_code,
    subtotal_minor, shipping_minor, tax_minor, total_minor,
    shipping_address, provider, idempotency_key
  ) values (
    v_user_id, lower(trim(p_customer_email)), trim(p_customer_name), trim(p_phone), v_currency,
    v_subtotal, p_shipping_minor, p_tax_minor, p_total_minor,
    p_shipping_address, p_provider, p_idempotency_key
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select p.id, p.name, p.slug, p.currency_code, p.price_minor,
           v.id as variant_id, v.sku, v.size, v.color_name
      into v_product
      from public.products p join public.product_variants v on v.product_id = p.id
      where v.id = (v_item->>'variant_id')::uuid;
    insert into public.order_items (
      order_id, product_id, product_variant_id, product_name, product_slug,
      variant_sku, size, color_name, quantity, unit_price_minor, line_total_minor
    ) values (
      v_order_id, v_product.id, v_product.variant_id, v_product.name, v_product.slug,
      v_product.sku, v_product.size, v_product.color_name,
      (v_item->>'quantity')::integer,
      v_product.price_minor,
      v_product.price_minor * (v_item->>'quantity')::integer
    );
  end loop;

  return v_order_id;
end;
$$;

create or replace function public.set_checkout_provider_reference(p_order_id uuid, p_reference text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.orders
  set provider_reference = p_reference, updated_at = now()
  where id = p_order_id
    and user_id = (select auth.uid());
end;
$$;

create or replace function public.mark_payment_succeeded(p_order_id uuid, p_provider text, p_reference text, p_amount_minor integer, p_currency_code text, p_event_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select total_minor from public.orders where id = p_order_id) <> p_amount_minor then
    raise exception 'Payment amount mismatch';
  end if;
  if (select currency_code from public.orders where id = p_order_id) <> upper(p_currency_code) then
    raise exception 'Payment currency mismatch';
  end if;
  update public.orders
    set status = 'paid', payment_status = 'succeeded', provider_reference = p_reference,
        paid_at = coalesce(paid_at, now()), updated_at = now()
    where id = p_order_id and provider = p_provider;
  insert into public.payment_records (
    order_id, provider, provider_reference, status, amount_minor, currency_code, verified_at, raw_event_id
  ) values (
    p_order_id, p_provider, p_reference, 'succeeded', p_amount_minor, upper(p_currency_code), now(), p_event_id
  ) on conflict (provider, raw_event_id) do nothing;
end;
$$;

revoke all on function public.create_checkout_order(text, text, text, text, jsonb, text, text, integer, integer, integer, integer, jsonb) from public;
revoke all on function public.set_checkout_provider_reference(uuid, text) from public;
revoke all on function public.mark_payment_succeeded(uuid, text, text, integer, text, text) from public;
grant execute on function public.create_checkout_order(text, text, text, text, jsonb, text, text, integer, integer, integer, integer, jsonb) to authenticated;
grant execute on function public.set_checkout_provider_reference(uuid, text) to authenticated;
grant execute on function public.mark_payment_succeeded(uuid, text, text, integer, text, text) to service_role;
