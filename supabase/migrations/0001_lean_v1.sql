-- LYG 2026 registration, lean V1.
-- Run this whole file once in the Supabase SQL Editor.
--
-- Security model: RLS is on with NO policies on both tables, so nothing is
-- reachable with the anon key. Every read and write goes through server code
-- using the service role key, which bypasses RLS.

begin;

-- ---------------------------------------------------------------- reference ids
-- One sequence for the life of the group. The number never resets, so a
-- reference id is unique forever even across years.
create sequence if not exists lyg_reference_seq as bigint start 1;

create or replace function lyg_reference_id()
returns text
language sql
volatile
as $$
  select 'LYG-'
      || to_char(now() at time zone 'Asia/Kolkata', 'YYYY')
      || '-'
      || lpad(nextval('lyg_reference_seq')::text, 4, '0');
$$;

-- -------------------------------------------------------------------- members
create table if not exists members (
  id                           uuid primary key default gen_random_uuid(),
  reference_id                 text not null unique default lyg_reference_id(),

  full_name                    text not null,
  dob                          date not null,
  phone                        text not null,
  email                        text,

  area                         text not null,
  -- Free text, and optional: see 0002_free_text_area.sql.
  community                    text,

  current_status               text not null,
  institution_or_workplace     text,

  previous_youth_group         boolean not null default false,
  previous_youth_group_details text,

  interests                    text[] not null default '{}',
  purpose                      text[] not null default '{}',

  guardian_name                text,
  guardian_phone               text,
  guardian_consent             boolean,

  join_season                  text not null,
  join_year                    integer not null,

  membership_status            text not null,

  guidelines_accepted_at       timestamptz not null,
  consent_version              text not null,

  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),

  -- Siblings often share a parent's number, so identity is the pair, never the
  -- phone alone.
  constraint members_phone_dob_unique unique (phone, dob),

  -- Same pattern as the zod schema in lib/registration/schema.ts.
  constraint members_phone_e164 check (phone ~ '^\+91[6-9][0-9]{9}$'),
  constraint members_guardian_phone_e164
    check (guardian_phone is null or guardian_phone ~ '^\+91[6-9][0-9]{9}$'),

  constraint members_current_status_allowed check (current_status in (
    'school', 'college', 'working', 'self_employed', 'looking_for_work', 'other'
  )),
  constraint members_membership_status_allowed
    check (membership_status in ('new', 'updated')),
  constraint members_join_season_allowed check (join_season in (
    'advent', 'christmas', 'ordinary', 'lent', 'triduum', 'easter',
    'pentecost', 'lourdes'
  )),

  -- Area and community are free text, tidied and title-cased by the server.
  -- An empty community is stored as null, never as an empty string.
  constraint members_area_shape check (length(area) between 2 and 80),
  constraint members_community_shape
    check (community is null or (length(community) between 1 and 80))
);

create index if not exists members_phone_idx on members (phone);
create index if not exists members_created_at_idx on members (created_at desc);

-- Keep the identity of a registration fixed. An update may change details, but
-- never the reference id, the season someone joined in, or when they joined.
create or replace function lyg_protect_member_columns()
returns trigger
language plpgsql
as $$
begin
  new.reference_id := old.reference_id;
  new.join_season  := old.join_season;
  new.join_year    := old.join_year;
  new.created_at   := old.created_at;
  new.updated_at   := now();
  return new;
end;
$$;

drop trigger if exists members_protect_immutable on members;
create trigger members_protect_immutable
  before update on members
  for each row
  execute function lyg_protect_member_columns();

-- ------------------------------------------------------------ update attempts
-- Failed verification attempts, for the per-phone lockout. Private under RLS.
create table if not exists update_attempts (
  id         bigserial primary key,
  phone      text not null,
  created_at timestamptz not null default now()
);

create index if not exists update_attempts_phone_time_idx
  on update_attempts (phone, created_at desc);

-- --------------------------------------------------------------------- lockdown
-- RLS on, no policies: with the anon or authenticated key every row is denied.
-- The service role bypasses RLS, which is why it never leaves server code.
alter table members enable row level security;
alter table update_attempts enable row level security;

-- Belt and braces on top of RLS: take away the table grants Supabase hands the
-- public roles by default, so a missing policy is not the only thing standing
-- between the anon key and this data.
revoke all on table members from anon, authenticated;
revoke all on table update_attempts from anon, authenticated;
revoke all on sequence lyg_reference_seq from anon, authenticated;
revoke all on sequence update_attempts_id_seq from anon, authenticated;
revoke execute on function lyg_reference_id() from anon, authenticated;

commit;
