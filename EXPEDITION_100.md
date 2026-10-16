# Expedition v6 — 100-item implementation ledger

The new default Play view launches the Expedition engine. The previous 25-stage campaign, v5 five-room roguelite, practice/rival modes and online rooms retain their existing rules and remain available through Hero / classic collections. No server migration is required.

Implementation files: `src/adventure.js` (deterministic simulation), `src/adventure-ui.js` (input, persistence, progression and renderer), `src/adventure.css` (responsive interface). `src/build-expedition.cjs` embeds these sources into the offline app shell. Run `npm run build` after source edits.

All 100 items below are implemented in the new Expedition mode. “AI” means device-local finite-state game AI, a threat director and a rule-based coach; it is not an LLM integration. The bot test is a deterministic input simulation, not a guarantee of human difficulty or enjoyment.

| # | Implemented feature | Code / verification |
|---|---|---|
| 1 | Spiked traps: −100 score, 10 HP, combo reset | Engine.cut; trap test |
| 2 | Hunters aim at the drone after a ≥1.15 s warning | beginAttack/updateEnemy; tell test |
| 3 | One finger moves the offset drone and cuts; release leaves it exposed | pointer input; Engine.move/swipe |
| 4 | Violet recovery enables a counter and gives 12 energy | cut/updateEnemy; counter test |
| 5 | HP loss and timeout can fail the encounter; result shows causes | hurt/end/result; loss tests |
| 6 | Normal cutting does not heal; Restoration has a two-use room budget | cut/healBudget; healing test |
| 7 | Expired targets damage HP; ! targets cause larger damage | update; priority idle-loss test |
| 8 | Reward targets and traps share the arena | waveSpawn; trap/chain tests |
| 9 | Early trap introduction, then hunters, populations and region bosses | enemySpawn/stage progression |
| 10 | Near-miss energy, counter scores and no-hit mastery | updateEnemy/sideComplete/settle |
| 11 | Round targets, spiked traps, triangular hunter silhouettes | draw |
| 12 | Turning, striped windup, committed dash and violet recovery | updateEnemy/draw |
| 13 | Separate cut, armor crack and trap penalty feedback | cut/effect/handleEvents |
| 14 | Ten region palettes and readable biome details | BIOMES/draw |
| 15 | Hero core, class colors and level-based chassis rings | heroMarkup/draw |
| 16 | Blade trails reflect Lightning, Restoration and blade equipment | draw trail |
| 17 | Boss arrival and victory burst; repeated arrivals skipped | intro/seenBoss/end |
| 18 | Cut pitch, crack, danger, perfect-dodge and boss sound cues; ambient pulse | handleEvents/tone |
| 19 | Ten playable regions | BIOMES/generatedStage; 100-stage test |
| 20 | Corridor stages with solid walls and central escape route | makeStage/move; layout test |
| 21 | Visible directional current lanes move targets | stage.flow/update/draw |
| 22 | Hunter siege rooms with faster waves | waveSpawn/enemySpawn |
| 23 | Alternating vulnerable twin cores | bossPoints/swipe; campaign bot |
| 24 | Generated optional clean, combo or counter mastery | stage.side/sideComplete |
| 25 | Safe interactive first target, trap avoidance, dodge and counter tutorial | tutorial state machine; tutorial test |
| 26 | Adjustable finger-to-drone offset; lower controls reserved | point mapping; responsive controls |
| 27 | Cards show exact effect, limitation and available synergy | CARDS/cardView |
| 28 | One actionable failure tip chosen from actual causes | Engine.coach/result |
| 29 | Large text, shape+color cues, separate audio/haptic/motion/offset options | settings/draw/CSS |
| 30 | Bounded adaptive effects, visibility pause and local encounter snapshots | loop/checkpoint/pause; budget tests |
| 31 | Warning states dim background decoration | draw.warning |
| 32 | Edge arrows for offscreen warning sources | draw telegraphs |
| 33 | Perfect near-dodge feedback and a pale motion echo | updateEnemy/effect/draw |
| 34 | Damage flashes, HP color and a distinct low-health state | invuln/draw/status |
| 35 | Angle-oriented fragments and directional energy particles | effect/cut/draw |
| 36 | Energy spark returns to the drone core; objective bar animates | fx.core/draw/ax-goal |
| 37 | Animated card mini-previews | ax-mini/CSS |
| 38 | Shared button press, card and progress transition rules | adventure.css |
| 39 | Muted hexagonal background props can break | stage.props/swipe/draw |
| 40 | Victory cleans and lights the arena; rescued regions become green checks | draw won/ax-track/mapView |
| 41 | Optional fleeing courier takes three hits and gives extra shards | loot update/cut/settle |
| 42 | Swarm leader defeat stuns enemies for three seconds | leader cut/frozen; team test |
| 43 | Arrow enemy requires a matching directional cut | directional cut; weakness test |
| 44 | Paired guards must have their cable severed before damage | linked swipe; link test |
| 45 | Hunter dashes can strike other enemies | updateEnemy; friendly-fire test |
| 46 | Temporary marked safe zones appear in later stages | safeUntil/hurt/draw |
| 47 | Later current arenas warn before their playable bounds shift | arenaWarning/arenaShift/move |
| 48 | Escort objective with helper health and enemy damage | helper/update/objective |
| 49 | Choose rest, power/fight, bounty or escort rooms before combat | generated graph/routeView |
| 50 | Visible calmer-start, swarm and bounty room modifiers | routes/startRoom |
| 51 | First-run tutorial and gentler early enemy timing for the first three runs | startRoom/meta.runs |
| 52 | One-tap blade comparison with explicit width/energy tradeoffs | menu blade compare/action |
| 53 | Undo last card choice or menu equipment change before combat | run.undo/gearUndo |
| 54 | Resume recap shows stage, health, seed and equipped powers | pauseView/resume HUD |
| 55 | Three-second countdown after resume, input cleared | countdown/startRoom/unpause |
| 56 | One mandatory objective and separate optional mastery | objective/sideComplete/renderHUD |
| 57 | Successful regional builds saved in an eight-entry collection | settle/meta.builds |
| 58 | Enemy guide, animated intentions and isolated practice | guide/practice |
| 59 | Optional easy/balanced/hard feedback at defeat and region milestones | feedback UI/record |
| 60 | Disclosed device-only card/death/replay statistics; disable and clear controls | record/settings |
| 61 | Seeded regenerated target layouts, obstacles, enemies and room rewards | makeStage/waveSpawn/enemySpawn |
| 62 | Generation rules preserve space, spawn distance and central routes | validateStage/spawn |
| 63 | Shared seed input reproduces layouts and enemy RNG | Random/seed UI; seed tests |
| 64 | Reject invalid maps and attack combinations without safe escape candidates | generatedStage/beginAttack |
| 65 | Threat budget limits simultaneous windups and attacks | threatBudget/beginAttack; director test |
| 66 | Local swipe distance, travel and idle metrics identify play style | stats/style |
| 67 | Adaptation selects the next encounter; committed aim never changes | adaptation/startRoom; aim test |
| 68 | Adaptation toggle; legacy online rules stay fixed | settings; online regression tests |
| 69 | Match-specific advice from recorded causes and play metrics | coach/cardView/result |
| 70 | Targeted practice recommendation, without progression rewards | practice/result |
| 71 | Seeded connected room graph with three reachable choices per transition | stage.graph; 4,000-map validation |
| 72 | Region-specific palettes, preferred room rules and enemy distributions | BIOMES/makeStage/enemySpawn |
| 73 | Required objective and optional seeded mastery condition | objective/stage.side |
| 74 | Motion settings extend tells; adjustable speed advances the complete simulation consistently | options/update/beginAttack |
| 75 | Boss attack sequences sampled from validated dash/cross/summon/sweep patterns | patterns/update; boss bot tests |
| 76 | Scout marks the drone and directs the next aim | scout/mark/beginAttack |
| 77 | Ambusher has a visible shimmer and a warning before attacking | ambusher draw/FSM |
| 78 | Sniper fires along its previously displayed aim line | sniper/updateEnemy |
| 79 | Shield bearer blocks front cuts and exposes rear cuts | shield cut; shield test |
| 80 | Healer restores an ally, prioritizing shields | healer/updateEnemy; healer test |
| 81 | Summoner has at most two living summoned minions | summoner/updateEnemy; summon test |
| 82 | Mine layer places visible arming traps | miner/updateEnemy; mine test |
| 83 | Mimic uses a diamond silhouette instead of a round reward shape | mimic draw/cut |
| 84 | Avenger strengthens its next committed dash after an ally falls | avenger/cut/beginAttack; team test |
| 85 | Visible drain link removes energy within range; moving away breaks it | drainer/updateEnemy/draw |
| 86 | Scout/sniper and shield/healer team preferences | enemySpawn; support test |
| 87 | Late elites have at most one swift, armored or charged modifier | enemySpawn/affix |
| 88 | Explicit idle/approach/windup/attack/recover state machine | updateEnemy |
| 89 | Prediction reads only present position and velocity, then locks aim | beginAttack; aim test |
| 90 | Hunter and sniper friendly fire | updateEnemy; friendly-fire test |
| 91 | 100 main stages, ten regions × ten, final at every tenth stage | generatedStage/mapView; all-stage bot |
| 92 | Shared hero level cap increased to 100; scaled stage XP rewards | maxPlayerLevel/settle; progression tests |
| 93 | Class mastery separate from hero XP; grants bounded energy efficiency | meta.mastery/cut |
| 94 | Ten-level starting variants with actual cards/energy/armor effects | starting UI/Engine constructor |
| 95 | Optional three-tier region mastery unlocks a cosmetic aura | meta.tiers/mapView/draw |
| 96 | Endless regional waves unlock after stage 100 | endless action/route cycling |
| 97 | 4,000 generation checks and legal-input bot completes 100 stages; browser QA | expedition-test.cjs |
| 98 | Helper protect/collect/warn modes have distinct actions | update/supportAt/settings |
| 99 | AI and generation run entirely offline; no per-frame API calls | Engine has no DOM, fetch or network dependency |
| 100 | Optional paused tactical guide answers from actual match data | coach action/Engine.coach |

## Checks

- `npm test`: existing progression, arena, campaign, RPG, offline, cloud-client and roguelite regression suites plus the new expedition simulation suite.
- `node tests/expedition-test.cjs`: 4,000 layout validations, seed replay, failure states, warning timing, counters, enemy weaknesses/support, healing limits, tutorial and 100 full-stage victories.
- `npm run build`: embeds source modules and builds the locally cached stylesheet.
- Browser checks: recorded separately in the release notes after live deployment.

## Scope and limitations

Expedition campaign snapshots and analytics are local to the current device, as stated in the UI. Existing account/team features continue using their current backend; this release does not claim cross-device syncing for the new expedition save. Shared seeds reproduce plans, not identical outcomes when players choose different equipment, speeds or adaptive settings. Use the same settings and disable adaptation for comparable runs. Device-local saves are not an anti-cheat system for ranked multiplayer. The new engine does not change ranked multiplayer scoring.
