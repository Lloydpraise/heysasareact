# Home redesign + cinematic onboarding (frontend)

Built on top of `83ea23c` ("slice and home updates", Oct 16). Extract the zip into the repo root (heysasareact).
Only the files below are in the zip. Nothing else is touched.

| Folder | File | Action |
|---|---|---|
| src/components/home | DailyMode.jsx | **REPLACE** (built on your slice 7 version) |
| src/components/home | SetupMode.jsx | **REPLACE** (built on your slice 7 version) |
| src/components/home | ResultsStrip.jsx | NEW |
| src/components/home | YourMoveCard.jsx | NEW |
| src/components/home | RightNowCard.jsx | NEW |
| src/components/home | DoMoreCards.jsx | NEW |
| src/components/home | buildMoves.js | NEW |
| src/components/home | normalizeSummary.js | NEW |
| src/components/home | Safe.jsx | NEW |
| src/components/home/onboarding | ObBackdrop, Controls, WelcomeBeat, WakeBeat, ReconnectBeat, RevealBeat, WinBeat, RivalBeat, ConfirmBeat, CrewBeat, LiveBeat (.jsx), useCountUp.js, useOnboardingWin.js | NEW (13 files) |
| src/hooks | useHomeResults.js | NEW |
| src/services | homeResultsService.js | NEW |

**Only DailyMode.jsx and SetupMode.jsx overwrite existing files.** If you changed either since Oct 16 19:59, merge by hand.

## What it keeps from slice 7
Home header (greeting, WhatsApp status, Ask HeySasa), the approvals card with Pause always in view, "Who needs you" with Open chat, the compact switches card, resume-where-you-stopped (all three questions answered = the one-tap check is skipped), and the "disconnected half way, progress is saved" screen.
`SetupSteps.jsx`, `ProgressCard.jsx` and `SetupQuestions.jsx` are no longer used by setup (the new journey replaces them). They are left in place, untouched.

## Daily Home
Greeting, results (sales closed, open pipeline, new leads, reply rate, with period pills), Your move, HeySasa right now, approvals, who needs you, switches, Do more.
Every block is wrapped in `<Safe>`, so if one fails only that block disappears.
Works with the old backend too (the new cards that need the new numbers simply do not show). Deploy `/home/summary` from the backend zip for the full version.

## Onboarding
Welcome, wake it up, x-ray, first win, you vs competitors, one-tap check, your AI sales force, finale. CSS-only motion, switched off for "reduce motion". Mobile first.

## Loading
Results pages are fetched four at a time, the last result is remembered so coming back to Home is instant, and the first-win screen skips messages entirely.

## Checked
Lint clean on every file in the zip; `vite build` passes. Mounted the real HomePage with fake data in 8 situations (daily, old backend, empty account, welcome, disconnected mid-setup, wake, full click-through, resume with answers) at phone width: no errors.
NOT done: a run against your real Supabase and a real WhatsApp number.
