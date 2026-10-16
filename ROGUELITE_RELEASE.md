# v5 — A clear, repeatable adventure

## Main flow
Only three top-level choices: Play, My Hero, Friends. Play starts/resumes a five-encounter run: two target hunts, survival, combo, regional guardian. Normal encounters last 32 seconds; final lasts 40 seconds. Four fights plus a boss take about three minutes of combat, plus short choices. The first encounter has no protected cells. Later cells and armor are introduced gradually.

## Run progression
After each non-final victory choose exactly one of three deterministic, shuffled power offers. Cards have three levels: wide cuts, lightning, chain, barrier, rhythm, healing, focus; drone and prism cards unlock through lifetime shards. Lightning + chain increases jumps; recursion is guarded and extra targets capped at six. One class ability button remains.

Health carries to the next encounter. After encounter two choose +25 health or a power upgrade. After encounter three choose an optional Rush relic (+3 shards at ten combo, −0.3 second combo window). Between encounters choose normal or elite path: faster waves, more damage, +6 victory shards. All tradeoffs are visible before committing. Designed row/arc/triangle patterns replace unstructured spawning in this mode.

Final has an open core, visible warning, shield interaction, two attack phases, and small energy/protection responses to the build. Rescue each of five regions to advance. Existing 25+5 campaign and competitive/team rooms remain accessible under My Hero / Friends.

## Retention and simplicity
- One spendable balance: energy shards. Existing crystals + RPG materials merge once; walletMerged prevents duplication. Cosmetic purchases and forge spend the same balance. XP remains automatic level progression rather than a spendable currency.
- Persistent hero upgrades and unlocks; cards and relic reset each run. Limited effort-based defeat reward requires at least five cuts and is settled once per encounter. No idle or duplicate payout.
- Next unlock progress visible on home/hero/results. Defeat/win results show reached encounter, retained shards, next goal, and one large retry/next button.
- Optional mastery retained: clean play, eight-target swipe, ten combo. Drone hero reacts visually to chosen class/blade. Advanced gear, quests, maps, settings and statistics are behind details.
- Calm backdrop, high-contrast targets, short action text, objective/health/route HUD, reduced-motion support, large touch buttons. Score and growth detail move out of this run's action area.
- Resume checkpoint supports interrupted combat or between-encounter choices. Temporary run data is device-local; persistent progression uses the existing recovery-key cloud save.
- Local-only play events: menu, start/retry, encounter, choices, win/loss, exit/suspend. Last 100 events and counters shown under Hero. No analytics SDK, no upload, no claim of cross-device user analytics.

## Validation
`npm test`, `npm run build`. `tests/rogue-test.cjs` simulates all five actual encounters at 1200/390/320 widths, three consecutive region wins, offers/choice locks, carried HP, camp/relic/path, shields, checkpoint, failure payout/idempotence, temporary build reset, unified currency and online isolation. Existing campaign, arena, cloud, offline and progression tests remain in the suite. Real browser mobile verification follows GitHub Pages publication.
