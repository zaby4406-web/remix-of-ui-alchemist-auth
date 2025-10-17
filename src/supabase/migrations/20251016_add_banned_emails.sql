-- Create table to store banned Gmail addresses
create table if not exists public.banned_emails (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Enable RLS and allow authenticated users to manage entries
alter table public.banned_emails enable row level security;

-- Policies: allow authenticated users to select/insert/delete
create policy if not exists "banned_emails_select_auth"
  on public.banned_emails
  for select
  to authenticated
  using (true);

create policy if not exists "banned_emails_insert_auth"
  on public.banned_emails
  for insert
  to authenticated
  with check (true);

create policy if not exists "banned_emails_delete_auth"
  on public.banned_emails
  for delete
  to authenticated
  using (true);