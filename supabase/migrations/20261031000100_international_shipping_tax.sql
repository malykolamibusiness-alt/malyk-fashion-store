create table if not exists public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  country_codes text[] not null default '{}',
  region_codes text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (array_length(country_codes, 1) is not null or array_length(region_codes, 1) is not null)
);

create table if not exists public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.shipping_zones(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '',
  calculation_method text not null default 'flat' check (calculation_method in ('flat','free')),
  base_fee_minor integer not null default 0 check (base_fee_minor >= 0),
  additional_fee_minor integer not null default 0 check (additional_fee_minor >= 0),
  free_shipping_min_minor integer,
  check (free_shipping_min_minor is null or free_shipping_min_minor >= 0),
  estimated_min_days integer check (estimated_min_days is null or estimated_min_days between 0 and 365),
  estimated_max_days integer check (estimated_max_days is null or estimated_max_days between 0 and 365),
  check (estimated_max_days is null or estimated_min_days is null or estimated_max_days >= estimated_min_days),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(zone_id, name)
);

create table if not exists public.tax_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  region_code text not null default '',
  tax_rate_basis_points integer not null default 0 check (tax_rate_basis_points between 0 and 100000),
  prices_include_tax boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(country_code, region_code)
);

create table if not exists public.checkout_currencies (
  currency_code text primary key check (currency_code ~ '^[A-Z]{3}$'),
  stripe_enabled boolean not null default true,
  paystack_enabled boolean not null default false,
  active boolean not null default true,
  is_base_currency boolean not null default false
);
create unique index if not exists one_base_checkout_currency on public.checkout_currencies(is_base_currency) where is_base_currency;

alter table public.orders add column if not exists shipping_method_id uuid references public.shipping_methods(id);
alter table public.orders add column if not exists shipping_method_name text not null default '';
alter table public.orders add column if not exists shipping_method_description text not null default '';
alter table public.orders add column if not exists estimated_delivery text not null default '';
alter table public.orders add column if not exists tax_rule_id uuid references public.tax_rules(id);
alter table public.orders add column if not exists tax_rate_basis_points integer not null default 0 check (tax_rate_basis_points >= 0);

alter table public.shipping_zones enable row level security;
alter table public.shipping_methods enable row level security;
alter table public.tax_rules enable row level security;
alter table public.checkout_currencies enable row level security;

create policy "Public checkout reads active shipping configuration"
on public.shipping_zones for select to anon, authenticated using (active);
create policy "Admins manage shipping zones"
on public.shipping_zones for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Public checkout reads active shipping methods"
on public.shipping_methods for select to anon, authenticated using (active and exists(select 1 from public.shipping_zones z where z.id=zone_id and z.active));
create policy "Admins manage shipping methods"
on public.shipping_methods for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Admins read tax rules"
on public.tax_rules for select to authenticated using ((select public.is_admin()));
create policy "Admins manage tax rules"
on public.tax_rules for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Public reads active checkout currencies"
on public.checkout_currencies for select to anon, authenticated using (active);
create policy "Admins manage checkout currencies"
on public.checkout_currencies for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create trigger shipping_zones_set_updated_at before update on public.shipping_zones for each row execute function public.set_updated_at();
create trigger shipping_methods_set_updated_at before update on public.shipping_methods for each row execute function public.set_updated_at();
create trigger tax_rules_set_updated_at before update on public.tax_rules for each row execute function public.set_updated_at();

create table if not exists public.checkout_configuration_history (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('shipping_zone','shipping_method','tax_rule','currency')),
  record_id uuid,
  action text not null check (action in ('create','update','activate','deactivate')),
  changed_by uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.checkout_configuration_history enable row level security;
create policy "Admins manage checkout configuration history"
on public.checkout_configuration_history for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

insert into public.checkout_currencies(currency_code, stripe_enabled, paystack_enabled, active, is_base_currency)
values
  ('USD', true, false, true, true),
  ('EUR', true, false, true, false),
  ('GBP', true, false, true, false)
on conflict (currency_code) do update set active = excluded.active, stripe_enabled = excluded.stripe_enabled, paystack_enabled = excluded.paystack_enabled, is_base_currency = excluded.is_base_currency;

create or replace function public.set_checkout_shipping_snapshot(
  p_order_id uuid,
  p_method_id uuid,
  p_method_name text,
  p_method_description text,
  p_estimated_delivery text,
  p_tax_rule_id uuid,
  p_tax_rate_basis_points integer
) returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select user_id from public.orders where id = p_order_id) <> auth.uid() then
    raise exception 'Not authorized to update this order';
  end if;
  update public.orders set
    shipping_method_id = p_method_id,
    shipping_method_name = left(p_method_name, 120),
    shipping_method_description = left(p_method_description, 2000),
    estimated_delivery = left(p_estimated_delivery, 160),
    tax_rule_id = p_tax_rule_id,
    tax_rate_basis_points = greatest(p_tax_rate_basis_points, 0)
  where id = p_order_id;
end;
$$;
revoke all on function public.set_checkout_shipping_snapshot(uuid,uuid,text,text,text,uuid,integer) from public;
grant execute on function public.set_checkout_shipping_snapshot(uuid,uuid,text,text,text,uuid,integer) to authenticated;
