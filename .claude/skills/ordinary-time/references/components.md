# Components and the registration journey

## The journey
The registration journey is a short zine, one chapter per screen. Show one idea at a time. Save progress to local state after every chapter so a dropped connection does not lose anything.

| Page | Chapter | What happens |
|---|---|---|
| Cover | none | Scripture, the LYG mark, one button |
| p. 1 | Ch. 01 "Hello" | New member or returning member |
| p. 2 | Ch. 02 "Who are you" | Name, date of birth, phone, email, patron saint (optional) |
| p. 3 | Ch. 03 "Where you're from" | CTM area on the parish map |
| p. 4 | Ch. 04 "What you're into" | Interests as stickers |
| p. 5 | Ch. 05 "What you bring" | Skills as offerings |
| p. 6 | Ch. 06 "The small print" | Consent, guardian details if under 18 |
| p. 7 | none | Printing animation, then the member card |

Returning members verify first (phone OTP or date of birth), then land on a "Welcome back" spread showing their saved details as editable lines. They can jump straight to any chapter from there.

## ZineCover
- Full-screen paper, registration marks in all four corners.
- A giant display word or two ("You're invited", "Pull up a chair") in `.misreg`.
- Scripture in Instrument Serif italic, from John 15:15, where Jesus calls his disciples friends. Use the translation your parish reads at Mass and show the reference in Geist Mono.
- A small season stamp: "Printed in [season name], [year]".
- One `StampButton`: "Let's go". No other links, no navigation bar.
- Optional: one duotone group photo inside an `.arch` mask.

## ChapterHeader
- Mono label "Ch. 03" in `--ink-soft`.
- Display title at `--text-h1`, left aligned, allowed to wrap onto two or three lines.
- Optional `MarginNote` beside or under it.

## PageStrip (progress)
- Fixed at the top: "p. 3 / 6" in Geist Mono, plus a perforated line (dashed border) that fills with `--ink-season` as the person moves forward.
- `aria-label="Step 3 of 6"`.
- A back arrow on the left. Never a stepper with circles.

## InkField (text input)
- No box. The input sits on a 2px `--ink-black` underline, like writing on a printed form line.
- Label above in Geist Mono uppercase 13px. The typed value is Geist 20px so it feels like the person's own handwriting on the page, without a script font.
- Focus: underline turns `--ink-lourdes` at 3px plus the focus ring.
- Error: underline turns `--error`; message below in Geist 14px `--error`, linked with `aria-describedby`. Keep error copy plain.
- Use the correct `type`, `inputmode` and `autocomplete` (tel, email, bday, given-name, family-name).
- Phone field defaults to +91.

## PathChoice
- Two stacked cards, each most of the screen width, 120px tall or more.
- "I'm new here" with a small line under it ("First time? Welcome to the family.").
- "I'm already in" with "Update your details."
- Paper-deep fill, 2px black border, print shadow in the season ink. Underneath they are two radio buttons in one group.

## ParishMap
- An SVG of CTM Parish areas, hand-drawn line style, each area a path with its name in Geist Mono.
- Tapping an area fills it with `--ink-season` at multiply and drops a pin stamp.
- Underneath, and always visible below the map, is a plain radio list of the same areas for screen readers and anyone who prefers a list. The map and list stay in sync.
- Area names and shapes live in `data/ctm-areas.ts` so the parish can edit them. Do not invent area names; ask for the real list if it is missing.
- If no map artwork exists yet, ship the list styled as stickers and add the map later.

## StickerPicker (interests)
- Interests appear as round or pill stickers on a paper-deep sheet, each rotated by a fixed angle between -4 and 4 degrees (derive the angle from the item id so it never jumps on re-render).
- Unselected: paper-deep fill, 2px `--ink-black` border, label in `--ink-black`.
- Selected: sticker fills with `--sticker-fill` and the label flips to `--sticker-text`, plus a small drop animation. Never fill with `--ink-season` or `--ink-highlight` behind a label: both fail AA on every season (see `tokens.css`). Pink and the season fill ink may still be used for the sticker's border and for the unselected sheet.
- Underneath: checkboxes with a fieldset and legend.
- Include an "Other" sticker that opens an `InkField`.
- Starting list (edit freely): music and choir, liturgy and altar service, sports, drama and dance, social media and content, photography and video, service and outreach, Bible study, retreats and pilgrimages, cooking and food, gaming, art and design, event planning, mentoring younger kids.

## OfferingList (skills)
- Title: "What you bring". Subtitle in serif italic: "Every gift has a place here."
- Same sticker mechanics, but laid out as a list of torn paper strips, since skills are something offered, not collected.
- Starting list: guitar or keyboard, singing, reading at Mass, photography, video editing, graphic design, writing, public speaking, teaching or tutoring, first aid, driving (with licence), coding and tech, organising events, carrying chairs.

## StampButton (primary action)
- Bricolage Grotesque 20px, weight 700, paper-coloured text on `--ink-lourdes`, or black text on paper with a 2px border.
- `box-shadow: var(--print-shadow)`. On press, translate 4px 4px and remove the shadow over 150ms.
- Full width on mobile, 56px tall. One primary button per screen.

## MarginNote
- Caveat 20 to 24px in `--ink-note` (Lourdes blue), rotated -3 to 3 degrees, sometimes with a hand-drawn arrow SVG. Not `--ink-highlight`: pink is 2.65:1 on paper and unreadable outdoors, which is where these members are.
- Purely decorative: `aria-hidden="true"`, never carries information the person needs.
- One per screen at most. Hidden during the Triduum.

## Printing screen
- After submit, a 2 to 3 second sequence: the card slides out as if from a riso drum, inks land one at a time (blue first, then the season ink), then the rose stamp presses on.
- Loading line example: "Inking your card..." or "Asking St. Anthony to find a good ink." Reduced motion shows the finished card straight away.

## MemberCard
The digital member record. Two outputs from the same data.

In-app card (the record)
- Card shape with a grotto arch top, 2px black border, paper background, registration marks at the corners.
- Top: "Lourdes Youth Group / CTM Parish" in mono.
- Centre: first name very large in Instrument Serif, surname initial only.
- Lines below in mono: member number (format `LYG-2026-0142`), CTM area, joined season and year, patron saint if given.
- Interests shown as mini stickers.
- Season line from `liturgical-seasons.md`.
- The Lourdes rose stamp overlapping one corner, slightly rotated.
- Actions: "Save to phone" and "Share to story", plus a plain link "See my full details" that opens the private record.

Share image (Instagram and WhatsApp status)
- 1080 x 1920 PNG made with `next/og` `ImageResponse` in a route like `app/api/card/[id]/route.tsx`.
- Contains only public fields: first name, area, member number, join season, interests. Never phone, email, date of birth, guardian details or full surname.
- Keep the key content inside the middle 1080 x 1420 so story UI does not cover it.
- Load the same fonts as `ArrayBuffer`s inside the route, since `next/og` does not use `next/font`.

Private record
- A plain, readable page of everything they submitted, with an "Edit" link per chapter. This page is not shareable and needs a verified session.

## Data model hint (Supabase)
`members`: id, member_number, first_name, last_name, dob, phone, email, patron_saint, ctm_area, interests (text[]), skills (text[]), guardian_name, guardian_phone, guardian_consent (bool), photo_consent (bool), join_season, join_year, created_at, updated_at. Enable row level security so a member can read and update only their own row.
