-- Committee sign-in, rate limit store.
-- Run this whole file once in the Supabase SQL Editor, after 0002.
--
-- One row per FAILED sign-in attempt. There is a single committee login, so
-- unlike update_attempts this table needs no phone column: the limit is five
-- failures in fifteen minutes across the whole login, which is what stops
-- someone working through passwords.
--
-- Same lockdown as the other tables: RLS on with NO policies, and the grants
-- Supabase hands the public roles taken away, so the anon key cannot read the
-- table, count it, or add to it. Every read and write goes through server code
-- using the service role key.

begin;

create table if not exists login_attempts (
  id         bigserial primary key,
  created_at timestamptz not null default now()
);

create index if not exists login_attempts_created_at_idx
  on login_attempts (created_at desc);

alter table login_attempts enable row level security;

revoke all on table login_attempts from anon, authenticated;
revoke all on sequence login_attempts_id_seq from anon, authenticated;

commit;
