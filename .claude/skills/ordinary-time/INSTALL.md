# Installing the Ordinary Time skill in Claude Code

1. Copy the whole `ordinary-time` folder into your LYG project:

       your-lyg-project/.claude/skills/ordinary-time/SKILL.md

   From the project folder:

       mkdir -p .claude/skills
       cp -r ~/Downloads/ordinary-time .claude/skills/

2. Remove any other design skill folders from `.claude/skills` in this project so styles don't mix.

3. Start a new Claude Code session and check it loaded with `/skills`.

4. Give Claude a first task, for example:

       Using the ordinary-time skill, set up the tokens, fonts and season helper
       in this Next.js project. Copy references/tokens.css into app/, fonts.ts
       into app/, and season.ts into lib/, then wire them into the root layout.

   Then build screen by screen:

       Using the ordinary-time skill, build the registration cover page and
       Ch. 01 (new or returning member). Show me at 390px wide before moving on.

5. Before the map screen, add your real CTM area names to `data/ctm-areas.ts`. Claude is told not to invent them.

## What's inside
- SKILL.md: the rules Claude follows
- DESIGN.md: the reasoning, for people
- references/tokens.css: colours, type, spacing, grain, misregistration
- references/season.ts: works out today's liturgical season
- references/fonts.ts: font loading for Next.js
- references/liturgical-seasons.md: season table and card lines
- references/components.md: every screen and component in the journey
- references/voice.md: tone, humour limits and copy examples
