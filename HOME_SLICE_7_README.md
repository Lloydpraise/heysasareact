# Slice 7 (frontend): the final look of Home and onboarding

Goes on top of slices 3 and 6. Needs backend slice 7 for the best result, but nothing here breaks without it. Extract the zip into the repo root (heysasareact).

| Folder | File | Action |
|---|---|---|
| src/components/home | SetupSteps.jsx | NEW |
| src/components/home | HomeHeader.jsx | NEW |
| src/components/home | homeCopy.js | REPLACE |
| src/components/home | HomePage.jsx | REPLACE |
| src/components/home | SetupMode.jsx | REPLACE |
| src/components/home | ProgressCard.jsx | REPLACE |
| src/components/home | SetupQuestions.jsx | REPLACE |
| src/components/home | SwitchesCard.jsx | REPLACE |
| src/components/home | DailyMode.jsx | REPLACE |
| src/components/home | ApprovalsCard.jsx | REPLACE |
| src/components/home | WhoNeedsYou.jsx | REPLACE |
| src/components/leads | LeadsPage.jsx | REPLACE (opens a lead when Home asks) |
| src/ | App.jsx | REPLACE (new `heysasa:open-lead` event) |

## Setup mode (day one)
- A four-step strip at the top: Connect WhatsApp, Sort your chats, A few questions, Switch on. It always shows where the owner is. Two steps can be active at once, because HeySasa sorts in the background while the owner answers.
- The progress card now shows the steps in order (reading chats, picking out real customers, checking older chats with "2 of 4 batches"), each done, working or waiting, next to the real counters.
- The "aha": as soon as the first leads are sorted, "Your first leads" appears under the progress card (hottest first, with a short summary and "Open chat"). The owner sees real value while the rest still runs.
- Coming back opens exactly where they stopped: an answered question is never asked again, so a half-finished set of three questions resumes on the next one. Each question now has Back, and a small progress bar.
- If the number drops half way through, the card is red and says so: "Your WhatsApp was disconnected. Connect it again so HeySasa can keep reading your new messages. Your progress is saved."

## Daily mode (after setup)
- A header: a greeting, whether WhatsApp is connected (with Reconnect), and Ask HeySasa one tap away.
- "Pause all follow-ups" is now always in view at the top of the approval card (it used to be small grey text at the bottom). When paused, an amber strip says so with one button to turn them back on.
- "Open chat" on a lead goes straight to that lead on the Leads page (it used to open the Leads list).
- "Let HeySasa do more": a business that skipped setup, or switched a helper off, sees the two switches on Home. It hides itself once both are on. This closes the gap where businesses that already had customers never saw the switches.
- "See the settings" now ends with a link to the rest: follow-up settings in Preferences, and Test chat for auto chat.
- A quiet placeholder while Home loads, so the page does not jump.

## Checked
- `npx vite build` passes. `npx eslint` is clean on every file touched.
- A server-side render test of the steps strip, the progress card (waiting, running, ready, done, no data), the full setup screen (not connected, connected, running, first leads ready, resuming after answers, dropped mid-setup, quiet account, failed), the header, and daily mode alerts: all pass.
- NOT done: clicking through in a real browser, a phone-size look, and a run against a real business.

## Still open
- "Read first" on a message group opens Lists & plans, not that exact plan. The page cannot open a plan by its id yet.
- Friendly names (Test chat, brand voice, ability, chat scenario) are still not applied everywhere: the Test chat screens still say Persona, Skill and Flow in places.
- "Approve similar ones automatically" after a few approved batches is not built.
- "While you were away" shows three numbers (follow-ups sent, ready to buy, waiting for your OK). Replies received and leads that moved up to hot need new numbers from the backend.
