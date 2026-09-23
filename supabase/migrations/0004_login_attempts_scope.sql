-- A fairer rate limit on committee sign-in, and a breadth limit on the
-- already-registered check.
-- Run this whole file once in the Supabase SQL Editor, after 0003.
--
-- 0003 counted every failed sign-in together, so one stranger guessing at one
-- number could lock out all six committee members at once. These two columns
-- let the same table carry two independent counters:
--
--   phone  five failures in fifteen minutes against one mobile number
--   ip     twenty failures in an hour from one client address
--
-- Either is enough to refuse, and neither can starve the other.
--
-- Both are nullable, so rows written by 0003 stay valid. They simply belong to
-- no phone and no address, and so count towards neither limit: the worst that
-- happens is that failures recorded before this migration stop being counted.
-- A sign-in attempt whose number is not a valid mobile at all also writes a
-- null phone, and is caught by the address limit instead.

begin;

alter table login_attempts add column if not exists phone text;
alter table login_attempts add column if not exists ip   text;

create index if not exists login_attempts_phone_time_idx
  on login_attempts (phone, created_at desc);

create index if not exists login_attempts_ip_time_idx
  on login_attempts (ip, created_at desc);

-- Unchanged from 0003, re-asserted so this file is safe to run on its own and
-- leaves the table locked down either way: RLS on with NO policies, and the
-- grants Supabase hands the public roles taken away.
alter table login_attempts enable row level security;

revoke all on table login_attempts from anon, authenticated;
revoke all on sequence login_attempts_id_seq from anon, authenticated;

-- ------------------------------------------------- update_attempts gets an ip
-- update_attempts already counts per phone number, which stops someone
-- probing one number over and over. It does nothing about someone walking
-- through a list of numbers a few times each, which is what the CONNECTION
-- check would otherwise allow. An address column gives that breadth limit
-- somewhere to live.
--
-- Nullable for the same reason as above: rows written before this migration,
-- and rows written by the verify step, simply belong to no address.

alter table update_attempts add column if not exists ip text;

create index if not exists update_attempts_ip_time_idx
  on update_attempts (ip, created_at desc);

-- Unchanged from 0001, re-asserted so this file leaves the table locked down
-- whatever order things ran in.
alter table update_attempts enable row level security;

revoke all on table update_attempts from anon, authenticated;
revoke all on sequence update_attempts_id_seq from anon, authenticated;

commit;
