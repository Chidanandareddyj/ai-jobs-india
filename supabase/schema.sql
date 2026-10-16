-- Run in Supabase SQL editor
create table if not exists public.subscribers (
  id bigint generated always as identity primary key,
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);
-- Lock the table down: only the service role (used server-side by /api/subscribe) can read/write.
alter table public.subscribers enable row level security;
