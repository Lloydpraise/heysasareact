# Ask HeySasa as an agent: frontend changes (Oct 7 2026)

Needs the backend from `heysasa-backend` (see `ASK_HEYSASA.md` there, section "Ask HeySasa as an agent"). No new env vars, no new dependencies.

## What changed
- **Sticky panel** (`context/AssistantContext.jsx`): the general chat stays mounted while the owner moves around the app. Escape and the Back button no longer close it; only the X does. After a reload it comes back if it was open (`sessionStorage`). Its conversation resumes (`contextKey: 'general:main'`). On phones it can be tucked away ("minimized") into a floating **Ask HeySasa** button with a count of changes waiting for OK; the chat keeps its state.
- **Change cards** (`ActionCard.jsx`): every change the assistant prepares shows exactly what will happen (list of people, the messages that would be sent, before/after for settings) with Approve / Not now. Normal changes have a "next time, just do it" checkbox; critical ones never do and say "always asks first". After the owner answers the last waiting card, the chat sends a short "Approved." so the assistant carries on. Done cards have Undo where the backend says it can be undone.
- **Guide cards** (`GuideCard.jsx`): "Take me there" buttons for things the assistant can't do itself (WhatsApp QR, top-up, delete a lead, disconnect). They fire `window` event `heysasa:navigate {tab, section}`, handled in `App.jsx` (reuses the existing preferences deep-link behaviour).
- **Activity** (`ActivityView.jsx`, the checklist icon in the panel header): a log of end results only, newest first, filter by area, Undo, plus "Allowed without asking" switches per kind of change (critical ones are shown locked).
- `assistantService.js` gains the action/activity/prefs calls and documents the new stream events (`action`, `action_done`, `guide`).

## Known limits
- Guide cards are live-only (they are not saved with the chat); change cards are saved and come back when a chat is reopened.
- The assistant points to **Playground** for chat AI flows/skills/persona, based on where `FlowsPanel`/`SkillsPanel` live. If the persona pack editor lives elsewhere, change `PLACES.playground` in `heysasa-backend/src/businessAi/agent/domains/guide.js`.
- No frontend test runner exists in this repo. Build and lint pass for the changed files; the cards were render-checked in every state (pending, critical, done, failed, rejected, expired, undone).
