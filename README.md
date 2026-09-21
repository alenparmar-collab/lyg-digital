# LYG 2026 registration

The registration flow for Lourdes Youth Group, the Catholic youth group of CTM
Parish, Ahmedabad. It replaces the paper membership form and gives the
committee a private member record they can print and file.

Next.js (App Router) + Supabase, deployed on Vercel. All visual work follows the
Ordinary Time design system in `.claude/skills/ordinary-time/`.

## Status

Lean V1. The member registration flow, the database, the registration document
and the committee viewer are built. Nothing has been run against a live
database yet: `supabase/migrations/0001_lean_v1.sql` still needs to be run, and
this deployment has no Supabase environment variables.

How the data flows:

- The browser never touches Supabase. Registration goes through the server
  actions in `app/actions/registration.ts`; the committee viewer reads in
  server components. Both use the service role key, which stays on the server.
- RLS is enabled on `members` and `update_attempts` with no policies, and the
  table grants are revoked from `anon` and `authenticated`, so the anon key
  reaches nothing.
- Every field is validated again on the server with zod, whatever the browser
  checked. Age is recalculated in Asia/Kolkata on every submission, and a
  member under 18 is rejected unless guardian name, phone and consent are all
  present.
- A reference id is shown to the member and is never a way to fetch anything.
  There is no public route that returns member data.

## Running it locally

```
npm install
cp .env.example .env.local   # then fill it in, see below
npm run dev
```

`npm run typecheck` runs TypeScript. `npm run icons` regenerates `app/icon.svg`
from the one-ink logo.

## Environment variables

See `.env.example` for the full list. The one rule that matters: variables
prefixed `NEXT_PUBLIC_` are sent to every visitor's browser, and the two that
are not (`SUPABASE_SERVICE_ROLE_KEY`, `LYG_TOKEN_SECRET`) must never gain that
prefix. The service role key bypasses every row level security rule.

## The logo

`public/brand/` holds the mark: eight figures holding hands, their joined arms
forming a cross in the negative space at the centre.

- `lyg-logo-two-ink.svg` — normal use. Figures take `--logo-accent`, set to the
  season ink, so the ring follows the Church year. Text, inner shapes and the
  cross take `--logo-ink`.
- `lyg-logo-one-ink.svg` — anywhere under 40px wide, and in print, where two
  inks turn to mud.
- `lyg-logo-original.jpg` — full colour, for official parish documents only.
  Never used in the product.

`components/Logo.tsx` reads these files from disk at runtime and inlines them,
so **replacing an SVG with a better trace needs no code change**. Never redraw,
retrace or tidy the artwork, and never recolour it beyond those two variables.
After replacing `lyg-logo-one-ink.svg`, run `npm run icons`.

## Placeholders in this build

Things that are deliberately not finished. Nothing here should be described as
done.

- Guidelines text on the consent chapter: awaiting the committee's copy.
- The John 15:15 line on the completion screen: awaiting confirmation of the
  translation the parish reads at Mass.
- Chapters after CONNECTION: each renders a clearly marked "not built yet"
  panel rather than a half-working screen.

## Later, not in V1

Scoped out on purpose. Recorded so they are not rediscovered as bugs.

- **Member merge tool.** V1 keys a person on phone + date of birth. People
  change mobile numbers, so a returning member on a new number cannot verify
  and may register again, leaving two rows for one person. The schema carries
  `possible_duplicate_of` for this, but there is no merge UI: for now the
  committee resolves duplicates in the Supabase table editor. A small
  admin-only merge screen is the first thing to add.
- Stronger guardian consent for under-18s: registration saved as pending, with
  the guardian confirming through a signed link on their own phone. The schema
  carries `guardian_consent_method` and `guardian_consent_confirmed_at` so this
  needs no migration against live records.
- Server-side PDF generation for member records into a private bucket. V1
  relies on the browser's own "Save as PDF" against dedicated print CSS.
- Profile photo upload. `profile_photo_path` and `photo_consent` exist; there is
  no upload and no consent checkbox in V1.
- The member-facing digital card and share image from the design system.
- Dark paper. `tokens.css` can do it, but it flattens every season's text ink to
  cream and breaks the printed record, so V1 forces light paper. Each season
  needs its own lightened text ink first.
