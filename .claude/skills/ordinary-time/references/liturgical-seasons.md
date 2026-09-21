# Liturgical seasons

The season ink is the one part of the palette that changes. It follows the Church year, which is the life of Christ told across twelve months. This is how the design system puts Christ at the centre without decorating anything with him.

## How to apply it
1. Copy `season.ts` to `lib/season.ts` in the Next.js project.
2. In the root layout, call `resolveSeason(overrideFromSupabase)` on the server and set it on the html element: `<html data-season={season}>`.
3. Every component uses `var(--ink-season)` for fills and `var(--ink-season-text)` for coloured text. Components never check the season themselves.
4. Store the season on each member record at the moment they register (`join_season`, `join_year`). The member card uses the stored value, so a card made in Lent stays violet forever.

## Season table

| Season | When (calendar used in India) | Ink | Text-safe ink |
|---|---|---|---|
| Advent | First Sunday of Advent (27 Nov to 3 Dec) until 24 Dec | Violet #6A3FA3 | #5A3290 |
| Christmas | 25 Dec until the Baptism of the Lord | Gold #E6A817 | black |
| Ordinary Time | After the Baptism of the Lord until the day before Ash Wednesday, and again from the day after Pentecost until Advent | Green #12A05C | #0B6B3D |
| Lent | Ash Wednesday until the Wednesday of Holy Week | Violet #6A3FA3 | #5A3290 |
| The Triduum | Holy Thursday, Good Friday, Holy Saturday | Red #C8302A | #A3241F |
| Easter | Easter Sunday until the day before Pentecost | Gold #E6A817 | black |
| Pentecost | Pentecost Sunday only | Red #E0402E | #A3241F |
| Our Lady of Lourdes | 11 February, only when it falls in Ordinary Time | Sky blue #7FB2F0 | #2447A8 |

Easter and Christmas are liturgically white. On paper, white ink would disappear, so the system uses gold, which is also a liturgical colour for solemnities.

## Season lines
Each season can carry one short line on the cover and the member card. Keep them plain.
- Advent: "Joined while we wait."
- Christmas: "Joined in the season of the manger."
- Ordinary Time: "Joined in Ordinary Time. Nothing about it is ordinary."
- Lent: "Joined in the forty days."
- The Triduum: "Joined in the holiest three days of the year."
- Easter: "Joined in the season of the empty tomb."
- Pentecost: "Joined on the Church's birthday."
- Our Lady of Lourdes: "Joined on our feast day."

## Behaviour during the Triduum
Keep motion and humour to a minimum from Holy Thursday to Holy Saturday. Hide margin-note jokes and loading gags (set a `quiet` flag from the season). Registration still works.

## Overrides
If the parish keeps a different date (for example a transferred feast, or the parish feast day), add a `season_override` setting in Supabase and pass it to `resolveSeason()`. An admin can clear it afterwards.
