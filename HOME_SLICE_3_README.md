# Home screen (slice 3)

Extract into the repo root (heysasareact), or `git apply heysasa-frontend-slice-3.patch`. It needs backend slices 1 and 2 deployed, and VITE_BACKEND_API_URL set (the same one the Leads page already uses).

## New
- src/components/home/: HomePage (picks the mode), SetupMode, ProgressCard, SetupQuestions, SwitchesCard, DailyMode, ApprovalsCard, WhoNeedsYou, homeCopy (plain words)
- src/hooks/useSetupStatus.js (checks every 4 s while setup works, 30 s otherwise)
- src/services/setupService.js (backend calls, top leads, discovered products, plan approve + switch on)

## Changed
- src/App.jsx: Home is the first page and the default for "/" and unknown paths. /analytics still works.
- src/components/layout/AppShell.jsx: Home is the first nav item.
- src/components/mobile/MobileShell.jsx: Home is the first bottom tab; Analytics moved under More.
- src/context/AssistantContext.jsx: the assistant knows the page is called Home.

## How Home chooses
- Setup mode: not connected -> Connect WhatsApp. Connected -> "Set up HeySasa for me" (loads chat history, then starts setup). Then live counters, three questions (hours, hand-off, "is this what you sell?" last), then the two switches with "See the settings". The owner leaves with "Take me to Home" or "Skip setup for now".
- Daily mode: a business that finished setup, or an existing business that already has customers. Loud alerts (WhatsApp disconnected, empty balance, setup failed), "Approve your follow-ups", "Who needs you now", "While you were away".

## Checked
Builds with `npx vite build` and passes eslint on the new files. Not clicked through in a browser yet.

## Known gaps
- Only number settings can be edited inside "See the settings"; the rest links to Preferences.
- "Read first" on a message group opens Campaigns, not that exact group.
- "Open" on a lead goes to Leads, not straight to that chat.
- Existing businesses with customers skip setup, so they never see the switches here.
