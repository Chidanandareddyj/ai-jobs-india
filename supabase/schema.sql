-- Run in Supabase SQL editor
create table if not exists public.subscribers (
  id bigint generated always as identity primary key,
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);
-- Lock the table down: only the service role (used server-side by /api/subscribe) can read/write.
alter table public.subscribers enable row level security;
-- Anon key fallback: allow insert of email only, no select/update/delete.
revoke all on public.subscribers from anon, authenticated;
grant insert (email) on public.subscribers to anon;
create policy "anon insert only" on public.subscribers for insert to anon with check (true);
