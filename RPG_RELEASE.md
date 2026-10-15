# v4.0 — RPG & tactile cuts

All 30 agreed items are implemented by extending the existing game, retaining its 25+5 stages, skill saves and online rules.

| Items | Implementation |
|---|---|
| 1–3 | 55 ms visual-only squash; oriented bright cut surface; radius-dependent fragment weight. No match clock freeze. |
| 4–6 | Cached cut noise plus short type/weight tones; 5/10/20 combo tone accents; bounded normal/priority/synergy haptics. |
| 7–9 | Armored threats absorb one cut and visibly crack; boss final fragments and brief fragment slowdown; compact HUD and short labels retained. Reduced motion/lite supported. |
| 10 | 90-second training route; no damage, XP, materials, trophies, daily progression or leaderboard writes. |
| 11–12 | Cutter wider swipe + energy wave; Guardian repair passive + shield; Energy Master energy passive + gathering field. |
| 13–14 | Existing five branches retained (cutting, combo/synergy, defense, crisis, visual), with free respec and saved builds. Three main combat paths integrate class/equipment. |
| 15 | One class ability button, 50 energy, six-second cooldown; active skills work only in solo campaign/expedition/training. |
| 16–19 | Three sidegrade blades, five upgrade levels, three equip-one runes; optional Prism/Anchor boss relics have explicit tradeoffs. Materials earned through victories and mastery. |
| 20–22 | Five localized region story briefings and existing 25-step unlock chain; runner, splitter, armored, protector threats from region 2; low-health boss attack phase and telegraph. |
| 23 | Three mastery stars per stage: clean victory, eight-cut swipe, ten combo; best retained, improvement bonus once. |
| 24–25 | Three-leg expedition, choose a temporary energy/rhythm/protection boon between legs; optional ten-combo risk contract and faster expiration for bonus materials. |
| 26–27 | Repair/collector drone; Hero & Equipment screen combines class, gear, materials, level, title and next campaign objective. |
| 28 | AB4 challenge codes produce identical fixed target schedules; import ABR4 result for friendly local comparison. Explicitly not a server-verified ranking. Powers equal; no rewards/online leaderboard writes. |
| 29 | Server-authoritative 2–4 player team roles by seat: Guardian, Cutter, Energy Master. Validated unique cuts charge shared pulse/repair; duplicate claims never generate extra power. No competitive rule changes. |
| 30 | Existing trophy badge retained; earned Explorer, Combo Master, Flawless Cutter, Region Guardian titles selectable alongside the name. |

## Storage and compatibility
RPG data lives inside `angio-growth-v1.rpg`; existing recovery-key cloud save includes it without new account credentials or public tables. Old saves get defaults without clearing XP, skills, trophies or stars. Equipment is locked during matches. Training and friend challenge cannot farm progression.

## Validation
`npm test`; `npm run build`; remote rolled-back SQL checks in `tests/rpg-team-db-test.sql`, existing `tests/plus-db-test.sql` and `tests/arena-db-test.sql`. Visual mobile verification after Pages deploy.

Backend update: run `backend/rpg_team_v6.sql` after v5. Existing Edge v5 requires no changes. Database function remains security invoker and service-role-only.
