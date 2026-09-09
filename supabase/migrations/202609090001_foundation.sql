create extension if not exists pgcrypto with schema extensions;

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

alter table public.audit_events enable row level security;
revoke all on public.audit_events from anon, authenticated;

create table public.idempotency_records (
  actor_id uuid not null references auth.users(id) on delete cascade,
  key uuid not null,
  operation text not null,
  request_hash text not null,
  response_status smallint,
  response_body jsonb,
  created_at timestamptz not null default now(),
  primary key (actor_id, key)
);

create index idempotency_records_created_at_idx
  on public.idempotency_records (created_at);

create table public.upload_intents (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  bucket_id text not null references storage.buckets(id),
  storage_path text not null unique,
  expected_mime_type text not null,
  expected_byte_size integer not null check (expected_byte_size > 0),
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  cleaned_at timestamptz
);

create index upload_intents_pending_cleanup_idx
  on public.upload_intents (created_at)
  where finalized_at is null and cleaned_at is null;

alter table public.idempotency_records enable row level security;
alter table public.upload_intents enable row level security;
revoke all on public.idempotency_records, public.upload_intents from anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('listing-media', 'listing-media', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
