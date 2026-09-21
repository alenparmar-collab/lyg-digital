# LYG 2026 registration

The registration flow for Lourdes Youth Group, the Catholic youth group of CTM
Parish, Ahmedabad. It replaces the paper membership form and gives the
committee a private member record they can print and file.

Next.js (App Router) + Supabase, deployed on Vercel. All visual work follows the
Ordinary Time design system in `.claude/skills/ordinary-time/`.

## Status

Built so far:

- Visual shell: design tokens, fonts, liturgical season helper, the logo
  component, and the cover screen.
- The first three chapters of the registration journey at `/join`: WELCOME
  (join or update), IDENTITY (name and date of birth) and CONNECTION (mobile
  and email), with client-side validation and answers kept in sessionStorage.

Not built yet: COMMUNITY, LIFE, INTERESTS, PURPOSE, the guardian chapter,
GUIDELINES, REVIEW, the completion screen, returning-member verification, the
database, submission, and the admin member record. Chapters that are not built
render a panel that says so. Nothing in this repo talks to Supabase yet.

Screen order: WELCOME, IDENTITY, CONNECTION, COMMUNITY, LIFE, INTERESTS,
PURPOSE, the guardian chapter for under-18s, GUIDELINES, REVIEW, and the
completion screen. Returning-member verification follows WELCOME.

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
- Areas and communities: placeholder rows, clearly marked, replaced by swapping
  one seed file and re-running it.
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
