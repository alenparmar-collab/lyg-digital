-- Area and community became free text, and community became optional.
-- Run this after 0001_lean_v1.sql on a project that already has 0001.
-- (A fresh project running 0001 then 0002 in order lands in the same state:
-- 0001 now creates community nullable, and this file is written to be safe to
-- run either way.)

begin;

-- Community is optional: plenty of members will not know a community name.
alter table members alter column community drop not null;

-- The server stores an empty answer as null, so an empty string would be a
-- bug rather than a blank. Reject it at the table, and cap both lengths to
-- match the zod schema.
alter table members drop constraint if exists members_community_shape;
alter table members add constraint members_community_shape
  check (community is null or (length(community) between 1 and 80));

alter table members drop constraint if exists members_area_shape;
alter table members add constraint members_area_shape
  check (length(area) between 2 and 80);

commit;
