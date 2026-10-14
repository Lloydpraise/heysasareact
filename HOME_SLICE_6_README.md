# Slice 6: friendly names, help animations, real approvals on the Leads page

Goes on top of slice 3 and 3b. Extract into the repo root or `git apply heysasa-frontend-slice-6.patch`.

- src/constants/names.js: the words owners see (Test chat, Lists & plans, brand voice, ability, chat scenario...). Change a name here and it changes in the desktop nav, the phone nav and the assistant's page names. Only those places use it so far; the rest of the app still says Campaign, Persona, Skill in places.
- src/components/home/guides/: a small "?" next to a feature opens a looping HTML/CSS animation under 8 seconds with one plain sentence. Five guides so far: approve a plan, ready to buy, quiet hours, auto chat, a follow-up plan. They are on Home: Approve your follow-ups, Who needs you now, the hours question, and both switches. Add more in guideData.js and HelpGuide.jsx. With "reduce motion" on, they stand still.
- src/services/leadsService.js and src/hooks/useLeads.js: fixed the Leads page "approve draft". It looked for a status ("pending_approval") the backend never uses, so it changed nothing while the screen showed the draft as approved. It now finds the message waiting for approval, approves it the way the follow-up engine does (ready to send, final text, WhatsApp channel), and only shows it as approved when that worked. It needs permission to update follow_up_queue from the signed-in user; I could not check that rule from here.

Checked: `npx vite build` passes, eslint is clean on the files I touched, and the five animations, the progress card and the names render in a server-side smoke test. Not clicked through in a browser.
