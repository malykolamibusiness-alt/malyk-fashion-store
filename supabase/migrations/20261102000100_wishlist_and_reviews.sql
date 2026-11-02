create table public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

alter table public.wishlist_items enable row level security;

create policy "Customers manage their wishlist"
on public.wishlist_items for all to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select, insert, delete on public.wishlist_items to authenticated;
create index wishlist_items_user_created_idx on public.wishlist_items(user_id, created_at desc);

create table public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  title text not null default '' check (char_length(title) <= 120),
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden')),
  verified_purchase boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, user_id)
);

alter table public.product_reviews enable row level security;

create policy "Approved reviews are public"
on public.product_reviews for select to anon, authenticated
using (status = 'approved');

create policy "Customers read their own reviews"
on public.product_reviews for select to authenticated
using (user_id = (select auth.uid()));

create policy "Customers create their own reviews"
on public.product_reviews for insert to authenticated
with check (user_id = (select auth.uid()));

create policy "Customers update their pending reviews"
on public.product_reviews for update to authenticated
using (user_id = (select auth.uid()) and status = 'pending')
with check (user_id = (select auth.uid()) and status = 'pending');

create policy "Admins moderate reviews"
on public.product_reviews for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create function public.product_has_verified_purchase(p_product_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.product_id = p_product_id
      and o.user_id = (select auth.uid())
      and o.payment_status = 'succeeded'
  );
$$;

create or replace function public.set_review_verified_purchase()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.user_id := (select auth.uid());
  new.verified_purchase := exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where oi.product_id = new.product_id
      and o.user_id = (select auth.uid())
      and o.payment_status = 'succeeded'
  );
  return new;
end;
$$;

create trigger product_reviews_verified_purchase
before insert or update of product_id, user_id on public.product_reviews
for each row execute function public.set_review_verified_purchase();

create trigger product_reviews_set_updated_at
before update on public.product_reviews
for each row execute function public.set_updated_at();

create index product_reviews_product_status_idx on public.product_reviews(product_id, status, created_at desc);
create index product_reviews_user_idx on public.product_reviews(user_id, created_at desc);

grant select on public.product_reviews to anon, authenticated;
grant insert, update on public.product_reviews to authenticated;
revoke all on function public.product_has_verified_purchase(uuid) from public;
grant execute on function public.product_has_verified_purchase(uuid) to authenticated;
