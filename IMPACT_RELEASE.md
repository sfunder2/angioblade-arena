# AngioBlade Impact 7.0.0

New animations focus on contact: directional split halves, spawn unfolding, armor cracks, precision flashes, curved blade ribbons, shield bursts, parry ripples, combo pulses, card demonstrations, story trophies and boss finishers. Motion-reduction and shake controls cover the new effects, and animation tracks are bounded.

The release also adds card before/after values, left-handed controls, class specializations and variants, artifact tradeoffs, daily/weekly/fixed trials, shared ghosts, collection appearances, stage phases, optional elite gates and local usability/performance observations.

Online rooms support private up-to-16 elimination series, consensual rematches and guardian-to-cutter repair openings. Elimination uses server-validated arena hits and does not grant league points. SQL privileges are service-only with RLS enabled; no client receives token hashes.

Implementation ledger: `IMPACT_50.md`. Actual participant study remains pending; `USABILITY_TEST.md` and the in-game voluntary study flow are ready.

Backend: `backend/series_v7.sql`, `backend/team_openings_v7.sql`, Edge `angio-duel` v6. Original room clients continue using their existing actions; new clients add `seriesVersion: 1`.

Checks: complete Node test suite, 100-stage impact bot, bounded renderer tests, UTF-8 ghost validation, challenge reward/campaign restoration tests, and a rollback-only live database test covering a complete 16-player four-round bracket and rematch. See final browser validation record below.
