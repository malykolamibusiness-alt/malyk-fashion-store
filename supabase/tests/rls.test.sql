begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'authenticated', 'authenticated', 'customer-one@example.invalid', '',
    now(), '{}'::jsonb, '{"display_name":"Customer One"}'::jsonb, now(), now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'authenticated', 'authenticated', 'customer-two@example.invalid', '',
    now(), '{}'::jsonb, '{"display_name":"Customer Two"}'::jsonb, now(), now()
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'authenticated', 'authenticated', 'admin@example.invalid', '',
    now(), '{}'::jsonb, '{"display_name":"Studio Admin"}'::jsonb, now(), now()
  );

update public.user_roles
set role = 'admin'
where user_id = '10000000-0000-4000-8000-000000000003';

insert into public.products (
  id, category_id, name, slug, status, currency_code, price_minor
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    (select id from public.categories where slug = 'men'),
    'Published test style', 'published-test-style', 'published', 'USD', 10000
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    (select id from public.categories where slug = 'men'),
    'Draft test style', 'draft-test-style', 'draft', 'USD', 20000
  );

insert into public.product_variants (
  id, product_id, sku, size, color_name, color_code, stock_quantity
)
values (
  '30000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'TEST-PUBLISHED-S', 'S', 'Obsidian', '#171717', 4
);

select is(
  (select role from public.user_roles
   where user_id = '10000000-0000-4000-8000-000000000001'),
  'customer',
  'new auth users receive only the customer role'
);

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
select is(
  (select count(*)::integer from public.products
   where id = '20000000-0000-4000-8000-000000000001'),
  1,
  'anonymous visitors can read published products'
);
select is(
  (select count(*)::integer from public.products
   where id = '20000000-0000-4000-8000-000000000002'),
  0,
  'anonymous visitors cannot read drafts'
);
select is(
  (select count(*)::integer from public.product_variants
   where id = '30000000-0000-4000-8000-000000000001'),
  1,
  'anonymous visitors can read active variants for published products'
);
select throws_ok(
  $$insert into public.products
    (category_id, name, slug, status, currency_code, price_minor)
    values (
      (select id from public.categories where slug = 'men'),
      'Blocked anonymous product', 'blocked-anonymous-product',
      'published', 'USD', 5000
    )$$,
  '42501',
  null,
  'anonymous visitors cannot create products'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
select is(
  (select count(*)::integer from public.profiles
   where id = '10000000-0000-4000-8000-000000000001'),
  1,
  'customers can read their own profile'
);
select is(
  (select count(*)::integer from public.profiles
   where id = '10000000-0000-4000-8000-000000000002'),
  0,
  'customers cannot read another customer profile'
);
update public.profiles
set display_name = 'Updated Customer'
where id = '10000000-0000-4000-8000-000000000001';
reset role;
select is(
  (select display_name from public.profiles
   where id = '10000000-0000-4000-8000-000000000001'),
  'Updated Customer',
  'customers can update their own permitted profile field'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
update public.user_roles
set role = 'admin'
where user_id = '10000000-0000-4000-8000-000000000001';
update public.product_variants
set stock_quantity = 0
where id = '30000000-0000-4000-8000-000000000001';
reset role;
select is(
  (select role from public.user_roles
   where user_id = '10000000-0000-4000-8000-000000000001'),
  'customer',
  'customers cannot change their own role'
);
select is(
  (select stock_quantity from public.product_variants
   where id = '30000000-0000-4000-8000-000000000001'),
  4,
  'customers cannot change inventory'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
select ok(public.is_admin(), 'the trusted role lookup recognizes an admin');
update public.products
set name = 'Admin updated style'
where id = '20000000-0000-4000-8000-000000000002';
reset role;
select is(
  (select name from public.products
   where id = '20000000-0000-4000-8000-000000000002'),
  'Admin updated style',
  'admins can update product records'
);
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);
select throws_ok(
  $$insert into public.product_variants
    (product_id, sku, size, color_name, color_code, stock_quantity)
    values (
      '20000000-0000-4000-8000-000000000001',
      'TEST-PUBLISHED-S', 'M', 'Sand', '#B5A38A', 1
    )$$,
  '23505',
  null,
  'duplicate SKUs are rejected'
);
select throws_ok(
  $$insert into public.product_variants
    (product_id, sku, size, color_name, color_code, stock_quantity)
    values (
      '20000000-0000-4000-8000-000000000001',
      'TEST-NEGATIVE-STOCK', 'M', 'Sand', '#B5A38A', -1
    )$$,
  '23514',
  null,
  'negative stock is rejected'
);
reset role;

select * from finish();
rollback;
