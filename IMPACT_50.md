# Impact v7 — 50-request delivery ledger

This release extends Expedition v6. It keeps the molecular theme and adds a bounded material/animation layer, clearer mobile choices, class build options, special trials and server-coordinated arena series.

| # | Request | Delivery and verification |
|---|---|---|
| 1 | Material-specific hit feel | Organic, metal and energy reactions; separate colors, fragments and layered tones. `impact.js`, `handleEvents`. |
| 2 | Directional splitting | Two clipped halves depart along the cut normal with directional momentum and rotation. `impact-render.js`. |
| 3 | Hit deformation | Spawn scale and armor-hit squash, plus compressed split halves. `actorTransform`, `piece`. |
| 4 | Weighted hit pause | Normal .025 s, armor .04 s, counters .055 s; disabled with reduced motion. Engine tests. |
| 5 | Layered impact sound | Tonal cut + low transient + material layer; per-event rate limits. |
| 6 | Combo melody | Eight-note consonant scale rises with combo length. |
| 7 | Boss final-hit emphasis | Dedicated finisher ring, radial fragments, bass/chime and longer finish presentation. |
| 8 | Distinct blade traces | Curved fading blade ribbons vary by blade; power particles retain card identity. |
| 9 | Adjustable controlled shake | Bounded camera shift with a 0–1 strength control; essential UI stays fixed. |
| 10 | Precise cut reward | Center-aligned physical strokes earn +10, a clean-hit cue and precision stats. Not awarded to automatic chain cuts. |
| 11 | Clear primary combat indicators | Objective and health remain at top; one thumb ability at bottom. Optional mastery is secondary. |
| 12 | One-sentence stage brief | Goal-specific start panel before a fresh encounter. Required tutorial and resume remain separate. |
| 13 | Short card explanation | Card name and metric are immediate; effect/tradeoff expands on demand. |
| 14 | Actual before/after comparison | Card choice shows current and next numerical values plus synergy. |
| 15 | Left-handed layout | Ability and hint sides can be reversed in Settings. |
| 16 | Low-brightness readability | High-contrast arena option and brighter hint/health text; 320/390 px visual checks. This is not a hardware brightness certification. |
| 17 | Focused result view | Failure reason or victory, one actionable tip, kept rewards and large retry; details collapse. |
| 18 | Accidental input prevention | Newly opened dialogs ignore carried-over clicks for 220 ms. Touch capture releases cleanly. |
| 19 | Save status/time | Pause shows last successful local save time; failures keep the existing warning. |
| 20 | Fast retry | Short .65 s retry countdown; protected resume remains 3 s. Same seed retained for learning. |
| 21 | Encounter phases | Prepare, pressure and final phases change pacing and show a short notice. |
| 22 | Learn combinations gradually | Scout/sniper and shield/healer team preferences require prior discovery; new discoveries extend the next spawn interval. |
| 23 | Risky optional loot | Fleeing courier can be accompanied by an arming trap in later encounters. Entirely optional. |
| 24 | Regional hazards | Alternating vertical/horizontal flow hazards warn 1.3 s before activation; escape space remains. |
| 25 | Learnable boss patterns | Seeded validated boss patterns, fixed committed aims and same-seed retry; no future-input prediction. |
| 26 | Mini-bosses | Pre-final intermediate stages can introduce a three-hit shield mini-boss. |
| 27 | Last-second save | Blocking a lethal hit records a clutch and shows a distinct save animation. |
| 28 | Skilled interruption | A cut in the last .2 s of a visible windup causes recovery; shield rules still apply. |
| 29 | Optional elite gate | Route panel offers extra armor/swarm risk with bounty reward; normal paths remain available. |
| 30 | Final pressure decision | Final phase introduces a readable extra attacker and faster target pacing. |
| 31 | Class specializations | Three real options each for cutter, guardian and energy; run loadout is snapshotted. |
| 32 | Ability preview | Workshop practice equips selected skills/variant with 100 energy; no progression reward or campaign overwrite. |
| 33 | Visible power fusions | Compatible cards are shown before choice, discovered fusions are recorded and trigger violet animation. |
| 34 | Ability forms | Guardian strong/slow and light/fast barriers; energy short slow + barrier; cutter 8-target orbit with 75-energy cost. |
| 35 | Class mastery tasks | Cutter precision, guardian blocks and energy synergy counts are separate and shown in workshop. |
| 36 | Named builds | Latest saved regional build can receive a 24-character player name, escaped on render. |
| 37 | Collection appearance rewards | Researcher/alchemist/rescuer goals unlock selectable core/ring appearances. |
| 38 | Distinct region trophies | Palette and polygon geometry vary for all ten region trophies; earned shelf appears in workshop. |
| 39 | Lasting hero changes | Equipped collection trim and level chassis persist; in-game aura matches the selection. |
| 40 | Meaningful power costs | Glass: +cut score/+damage; Anchor: barrier/less cut width; Spark: energy/shorter combo. Tested. |
| 41 | Daily common stage | Istanbul-day seed and normalized equipment; results can be compared using shared ghost codes. |
| 42 | Friend ghost | Bounded UTF-8-safe share code stores only seed, stage, score and sampled path. Ghost is visual, not a live opponent or ranked proof. |
| 43 | Equal skill trial | Constructor and UI normalize cards, equipment, mastery, speed and adaptation for fair trials. |
| 44 | Up-to-16 elimination | Server qualifies half the players after each validated 50 s round; four rounds for 16; eliminated players spectate. Private event does not award league points. Real DB test. |
| 45 | One-tap rematch request | Each participant votes; no reset until all remaining participants consent. Real DB test. |
| 46 | Complementary team opening | Guardian then cutter within 2 s adds +2 shared repair; opening ring and team hint show the opportunity. Server derives it from validated hits. |
| 47 | Weekly special rules | Rotating counter-only, one-HP and no-card trials; same weekly seed. |
| 48 | Short regional story | Ten story fragments appear with region rescue/trophy presentation. |
| 49 | Real-player usability study | **Prepared, participant results pending.** Voluntary local test logs task timing and asks whether the objective was clear. No bot/browser QA is counted as real-player research. See `USABILITY_TEST.md`. |
| 50 | Difficulty/performance observations | Device-local attempts, wins, retries, damage and frame average/P95. Respects statistics toggle and clear control. |

## Validation

`npm test` includes historical regression suites, the new impact unit/render tests, all 100 stages through the new engine, and UI tests for previews, fixed trials, daily reward idempotence and suspended-campaign restoration. `tests/series-db-test.sql` runs inside a rollback transaction and validates 16 entrants, 17th-player rejection, four rounds, spectator capabilities, no tournament league rewards, all-player rematch votes and team openings.

## Deliberate boundaries

Daily/ghost comparisons are informal; shared codes are not signed leaderboard records. Public ranked arenas keep their existing server hit validation. Specialization, appearances, new studies and expedition snapshots remain device-local. Analytics are not uploaded. A saved participant answer is a local report, not a verified participant identity or completed external study.
