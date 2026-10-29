alter table public.profiles add column if not exists phone text not null default '';

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 160),
  phone text not null default '' check (char_length(phone) <= 40),
  country text not null check (char_length(country) between 2 and 80),
  address_line1 text not null check (char_length(address_line1) between 1 and 240),
  address_line2 text not null default '' check (char_length(address_line2) <= 240),
  city text not null check (char_length(city) between 1 and 120),
  state text not null default '' check (char_length(state) <= 120),
  postal_code text not null default '' check (char_length(postal_code) <= 32),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customer_addresses_one_default_idx
  on public.customer_addresses(user_id) where is_default;
create index if not exists customer_addresses_user_idx on public.customer_addresses(user_id);

alter table public.customer_addresses enable row level security;
create policy "Customers manage their addresses"
on public.customer_addresses for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create or replace function public.set_single_default_address()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.is_default then
    update public.customer_addresses set is_default = false
    where user_id = new.user_id and id <> new.id;
  end if;
  return new;
end;
$$;
revoke all on function public.set_single_default_address() from public;
create trigger customer_addresses_default before insert or update of is_default on public.customer_addresses
for each row execute function public.set_single_default_address();

alter table public.orders add column if not exists fulfilment_status text not null default 'pending'
  check (fulfilment_status in ('pending','processing','shipped','delivered','cancelled','refund_initiated','refunded'));
alter table public.orders add column if not exists tracking_carrier text not null default '';
alter table public.orders add column if not exists tracking_number text not null default '';
alter table public.orders add column if not exists tracking_url text not null default '';
alter table public.orders add column if not exists dispatched_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists cancelled_at timestamptz;

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  status_type text not null check (status_type in ('payment','fulfilment')),
  changed_by uuid references auth.users(id) on delete set null,
  note text not null default '' check (char_length(note) <= 2000),
  idempotency_key text,
  created_at timestamptz not null default now(),
  unique(order_id, status_type, idempotency_key)
);
alter table public.order_status_history enable row level security;
create policy "Customers read own order history"
on public.order_status_history for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin())))
);
create policy "Admins manage order history"
on public.order_status_history for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  previous_quantity integer not null check (previous_quantity >= 0),
  adjustment integer not null check (adjustment <> 0),
  new_quantity integer not null check (new_quantity >= 0),
  reason text not null check (reason in ('stock_received','manual_correction','damaged','returned','other')),
  note text not null default '' check (char_length(note) <= 2000),
  adjusted_by uuid references auth.users(id) on delete set null,
  idempotency_key text not null check (char_length(idempotency_key) between 16 and 128),
  created_at timestamptz not null default now(),
  unique(idempotency_key)
);
alter table public.inventory_adjustments enable row level security;
create policy "Admins manage inventory adjustments"
on public.inventory_adjustments for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function public.adjust_variant_stock(
  p_variant_id uuid,
  p_adjustment integer,
  p_reason text,
  p_note text,
  p_idempotency_key text
) returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_previous integer;
  v_new integer;
begin
  if not (select public.is_admin()) then raise exception 'Administrator access required'; end if;
  if p_adjustment = 0 then raise exception 'Adjustment must be non-zero'; end if;
  if p_reason not in ('stock_received','manual_correction','damaged','returned','other') then raise exception 'Invalid adjustment reason'; end if;
  if exists (select 1 from public.inventory_adjustments where idempotency_key = p_idempotency_key) then
    select new_quantity into v_new from public.inventory_adjustments where idempotency_key = p_idempotency_key;
    return v_new;
  end if;
  select stock_quantity into v_previous from public.product_variants where id = p_variant_id for update;
  if not found then raise exception 'Product variant not found'; end if;
  v_new := v_previous + p_adjustment;
  if v_new < 0 then raise exception 'Stock cannot be negative'; end if;
  update public.product_variants set stock_quantity = v_new, updated_at = now() where id = p_variant_id;
  insert into public.inventory_adjustments(variant_id,previous_quantity,adjustment,new_quantity,reason,note,adjusted_by,idempotency_key)
  values(p_variant_id,v_previous,p_adjustment,v_new,p_reason,coalesce(p_note,''),v_user,p_idempotency_key);
  return v_new;
end;
$$;
revoke all on function public.adjust_variant_stock(uuid,integer,text,text,text) from public;
grant execute on function public.adjust_variant_stock(uuid,integer,text,text,text) to authenticated;

create or replace function public.update_order_fulfilment(
  p_order_id uuid,
  p_status text,
  p_tracking_carrier text default '',
  p_tracking_number text default '',
  p_tracking_url text default '',
  p_note text default '',
  p_idempotency_key text default null
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_current text;
begin
  if not (select public.is_admin()) then raise exception 'Administrator access required'; end if;
  if p_status not in ('pending','processing','shipped','delivered','cancelled','refund_initiated','refunded') then raise exception 'Invalid fulfilment status'; end if;
  if p_idempotency_key is not null and exists (select 1 from public.order_status_history where order_id=p_order_id and status_type='fulfilment' and idempotency_key=p_idempotency_key) then return; end if;
  select fulfilment_status into v_current from public.orders where id=p_order_id for update;
  if not found then raise exception 'Order not found'; end if;
  if p_status = 'shipped' and v_current not in ('pending','processing') then raise exception 'Invalid fulfilment transition'; end if;
  if p_status = 'delivered' and v_current <> 'shipped' then raise exception 'Invalid fulfilment transition'; end if;
  if p_status = 'cancelled' and exists (select 1 from public.orders where id=p_order_id and payment_status='succeeded') then raise exception 'Paid orders require refund workflow'; end if;
  update public.orders set
    fulfilment_status=p_status,
    tracking_carrier=coalesce(p_tracking_carrier,tracking_carrier),
    tracking_number=coalesce(p_tracking_number,tracking_number),
    tracking_url=coalesce(p_tracking_url,tracking_url),
    dispatched_at=case when p_status='shipped' then coalesce(dispatched_at,now()) else dispatched_at end,
    delivered_at=case when p_status='delivered' then coalesce(delivered_at,now()) else delivered_at end,
    cancelled_at=case when p_status='cancelled' then coalesce(cancelled_at,now()) else cancelled_at end,
    updated_at=now()
  where id=p_order_id;
  insert into public.order_status_history(order_id,from_status,to_status,status_type,changed_by,note,idempotency_key)
  values(p_order_id,v_current,p_status,'fulfilment',(select auth.uid()),coalesce(p_note,''),p_idempotency_key);
end;
$$;
revoke all on function public.update_order_fulfilment(uuid,text,text,text,text,text,text) from public;
grant execute on function public.update_order_fulfilment(uuid,text,text,text,text,text,text) to authenticated;

create table if not exists public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) <= 2000),
  status text not null default 'requested' check (status in ('requested','approved','declined')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique(order_id,user_id)
);
alter table public.cancellation_requests enable row level security;
create policy "Customers manage own cancellation requests"
on public.cancellation_requests for all to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
create policy "Admins manage cancellation requests"
on public.cancellation_requests for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create table if not exists public.order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  notification_type text not null,
  provider_event_id text not null,
  created_at timestamptz not null default now(),
  unique(notification_type,provider_event_id)
);
alter table public.order_notifications enable row level security;
create policy "Customers read own notification status"
on public.order_notifications for select to authenticated using (exists(select 1 from public.orders o where o.id=order_id and o.user_id=(select auth.uid())));

create trigger customer_addresses_set_updated_at before update on public.customer_addresses
for each row execute function public.set_updated_at();
