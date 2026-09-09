begin;

select plan(10);

select has_table('public', 'audit_events', 'audit table exists');
select is(
  (select relrowsecurity from pg_class where oid = 'public.audit_events'::regclass),
  true,
  'audit events use RLS'
);

select has_table('public', 'idempotency_records', 'idempotency records exist');
select is(
  (select relrowsecurity from pg_class where oid = 'public.idempotency_records'::regclass),
  true,
  'idempotency records use RLS'
);

select has_table('public', 'upload_intents', 'upload intents exist');
select is(
  (select relrowsecurity from pg_class where oid = 'public.upload_intents'::regclass),
  true,
  'upload intents use RLS'
);

select is(
  has_table_privilege('anon', 'public.audit_events', 'select'),
  false,
  'anonymous users cannot read audit events'
);
select is(
  has_table_privilege('authenticated', 'public.upload_intents', 'insert'),
  false,
  'authenticated users cannot insert upload intents directly'
);

select results_eq(
  $$ select public from storage.buckets where id = 'listing-media' $$,
  array[false],
  'listing media is private'
);
select results_eq(
  $$ select file_size_limit from storage.buckets where id = 'payment-proofs' $$,
  array[5242880::bigint],
  'payment proof size is limited to 5 MiB'
);

select * from finish();
rollback;
