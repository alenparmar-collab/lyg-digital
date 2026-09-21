---
name: ordinary-time
description: The Ordinary Time design system for Lourdes Youth Group (LYG), CTM Parish. A risograph zine aesthetic with editorial typography and a colour palette that follows the Catholic liturgical calendar, built for a mobile-first Gen Z audience. Use this skill for ANY UI, page, component, screen, email, share image or visual work for LYG, including the membership registration journey, the digital member card, the LYG website, admin screens that members see, event pages and social graphics, even if the user does not mention the design system by name.
license: Proprietary to Lourdes Youth Group, CTM Parish
metadata:
  author: LYG
  version: 1.0.0
---

# Ordinary Time: LYG design system

## Mission
Build interfaces for Lourdes Youth Group that feel like a youth culture product, not a form, a church website, a SaaS dashboard or an AI-generated landing page. Christ is the reason the community exists, so faith shapes the structure of the system (the liturgical calendar drives colour, scripture opens the journey, service is framed as offering) and is never used as decoration.

Restate this intent in one sentence before starting any new screen.

## Before you build
1. Read `references/tokens.css` and use its variables. Never hard-code colours, fonts or spacing.
2. Read `references/liturgical-seasons.md` and use `getSeason()` from the helper so the season ink is correct for today's date.
3. For registration, member card or any journey screen, read `references/components.md`.
4. For any user-facing copy, read `references/voice.md`.

## Stack assumptions
The LYG site is Next.js (App Router) with Supabase. Load fonts with `next/font/google`, generate the shareable member card with `next/og` (`ImageResponse`), use CSS modules or Tailwind with the CSS variables from `tokens.css`. Use Framer Motion only if it is already installed; otherwise CSS transitions are enough.

## Foundations

### Paper and ink
- Every screen sits on one warm paper surface (`--paper`). No white cards floating on grey backgrounds.
- Light paper is the only surface. Dark paper is opt-in (`data-theme="dark"`) and currently unused: it flattens every season's text ink to cream and breaks the printed member record. Do not wire it to `prefers-color-scheme`.
- Each screen uses at most two spot inks plus black text: `--ink-lourdes` (constant) and `--ink-season` (changes with the Church season). A third ink, `--ink-highlight`, is allowed only for margin notes and stickers.
- Overprint layered shapes with `mix-blend-mode: multiply` so blue over green makes a darker third colour, like a real riso print.
- Misregistration: offset a duplicate layer of display headings or shapes by 1 to 3px in the second ink. Use `.misreg` from `tokens.css`. Never on body text or form inputs.
- Grain: apply the `.grain` overlay once per page at low opacity. Never on text inputs.
- Photos are halftoned or duotoned in one ink (see `.duotone`). Never show full-colour stock photography. Use real LYG members only, with photo consent.

### Typography
- Display: Bricolage Grotesque, weight 700 to 800, tight tracking (-0.02em), set big. Headlines can run off the edge or break mid-phrase on purpose.
- Editorial serif: Instrument Serif (regular and italic) for scripture, pull quotes and the person's name on the member card.
- Body and form text: Geist, 16px minimum on mobile (prevents iOS zoom), line-height 1.5.
- Labels, page numbers, membership numbers: Geist Mono, uppercase, 0.08em tracking, 12 to 13px.
- Margin notes only: Caveat, 20px or larger, rotated -2 to 3 degrees. Never for instructions, errors or anything the user must read to complete a task.
- Type scale (mobile first): 13 / 16 / 20 / 28 / 40 / 64 / 96. Display sizes use `clamp()` from `tokens.css`.

### Space and layout
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 72.
- Layout is an editorial spread, not a centred column of boxes. Use asymmetric placement, one oversized element per screen, and generous empty paper.
- Mobile is the primary canvas at 360 to 430px wide. Desktop shows the same spread with more margin and margin notes pulled into the gutter. Never design desktop first.
- Keep tap targets at 48px minimum.

### Symbols

**The LYG logo is the primary brand mark.** Eight figures hold hands in a ring and their joined arms form a cross in the negative space at the centre, so the mark carries "Christ at the centre" by itself. It is never redrawn, retraced, tidied up or rebuilt as a component, and never recoloured beyond its two variables: `--logo-accent` for the figures (set to `var(--ink-season)`, so the ring follows the Church year) and `--logo-ink` for the text, inner shapes and cross (set to `var(--ink-black)`). Files live in `public/brand/`: inline `lyg-logo-two-ink.svg` for normal use, and `lyg-logo-one-ink.svg` anywhere under 40px wide or in print, where the two-ink separation turns to mud. The full-colour JPG is for official parish documents only and never appears in the product. Because the centre cross is negative space, never place the mark on a filled panel.

Use contemporary Catholic symbols sparingly and drawn in the riso line style:
- Registration marks (the crosshair circle printers use to align plates) sit in page corners. They are a quiet cross and double as a print detail. This is the signature mark.
- The grotto arch (Lourdes) is used as a mask shape for photos and the member card frame.
- The Lourdes rose appears as a small stamp, for example on submit success and on the card.
- Water ripple lines may be used as dividers.

Never use clip-art crosses, doves, praying-hands emoji, glowing light rays behind Jesus, sparkles, flames, or stock church imagery.

### Motion
- Ink printing in: layers start 4px out of registration and settle to 0 over 300ms with ease-out.
- Stickers drop in with a small overshoot (scale 1.08 to 1) and land at a slight random rotation.
- Stamp button press: the offset shadow collapses to 0 on press, like a rubber stamp hitting paper.
- Page turns between chapters: 250ms horizontal slide plus fade. No parallax, no scroll-jacking.
- Everything respects `prefers-reduced-motion: reduce` by switching to simple fades or no motion.

## Components (summary)
Full anatomy and states are in `references/components.md`.
- `ZineCover`: opening screen with scripture, no form fields.
- `ChapterHeader`: "Ch. 02" in mono plus a big display title.
- `InkField`: underline input written on paper, not a box.
- `PathChoice`: two large cards, "I'm new here" and "I'm already in".
- `ParishMap`: tappable SVG map of CTM areas with an accessible list fallback.
- `StickerPicker`: interests as stickers, multi-select.
- `OfferingList`: skills framed as "What you bring".
- `PageStrip`: progress as zine page numbers.
- `StampButton`: primary action with offset print shadow.
- `MarginNote`: handwritten aside for humour.
- `MemberCard`: the final record, in-app view plus 1080x1920 share image.

## Accessibility (acceptance criteria)
- WCAG 2.2 AA. Body text contrast 4.5:1 or better against `--paper`. Only `--ink-black`, `--ink-lourdes` and `--ink-season-text` may be used for text. Season fill inks (gold, green) are for shapes and large display only.
- `--ink-highlight` (pink) is a shape and border ink. It is 2.65:1 on paper, so it is never text and never a fill behind text. Margin notes use `--ink-note`.
- Any ink fill carrying a label uses the `--sticker-fill` / `--sticker-text` pair, never `--ink-season` directly. Paper text on Ordinary green is 2.95:1 and on Christmas gold 1.84:1; the pair passes in all eight seasons.
- Every custom control maps to a native control: the map and stickers are checkboxes or radios underneath, visually restyled.
- Visible focus: 3px `--ink-lourdes` outline with 2px offset on every interactive element.
- Errors are written in plain Geist text next to the field, with `aria-describedby`, never only in colour or in handwriting.
- Misregistration, grain and rotation are decorative and marked `aria-hidden`.
- Motion obeys reduced-motion settings.
- The journey works with a screen reader from start to finish.

## Privacy rules (non-negotiable)
Many members are under 18.
- The shareable card shows only first name, CTM area, membership number, join season and interests. Never phone, email, full date of birth, address or full surname.
- Returning members must verify (phone OTP through Supabase Auth, or a matching date of birth) before any saved details are shown.
- Under-18 registrations collect parent or guardian name, phone and consent. Photo and social media consent are separate, optional checkboxes, unticked by default.
- Never log personal data to the console or analytics.

## Rules: Do
- Let faith organise the system (season colour, scripture on the cover, service as offering).
- Keep one big idea per screen.
- Put humour in the margins: notes, stickers, loading lines, empty states.
- Use real LYG photography and real place names.
- Make the member card worth screenshotting.

## Rules: Don't
- Don't build a stacked form with boxed inputs and a submit button at the bottom.
- Don't use purple-to-blue SaaS gradients, glassmorphism, dashboards, stat counters or feature grids.
- Don't joke about the Eucharist, Mass, Mary, the saints' holiness, prayer or anyone's faith. Joke about youth group life instead.
- Don't use more than two spot inks plus black on one screen.
- Don't put handwriting or rotation on anything functional.
- Don't use emoji in headings, labels or buttons.

## Quality gates (run in code review)
- [ ] Colours come only from `tokens.css` variables; season ink comes from `getSeason()`.
- [ ] Two spot inks maximum per screen, plus black.
- [ ] Looks right at 360px wide with no horizontal scroll.
- [ ] All text passes 4.5:1 contrast; no text in gold or light green.
- [ ] Selected stickers, chips and filled states use `--sticker-fill` / `--sticker-text`; no label sits on `--ink-season` or `--ink-highlight`.
- [ ] The logo is the supplied SVG, inlined, recoloured only through `--logo-accent` and `--logo-ink`, on unfilled paper.
- [ ] Keyboard and screen reader can complete the whole journey.
- [ ] Reduced motion tested.
- [ ] Share card contains no private fields.
- [ ] Copy checked against `references/voice.md`.
- [ ] No banned visuals (doves, clip-art crosses, stock photos, gradients, sparkles).
