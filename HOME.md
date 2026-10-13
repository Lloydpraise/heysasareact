# HOME — what the Home section must hold

Home is built last. This file collects everything we have said belongs there, so nothing is lost.
Until Home exists, each item appears where noted under "For now".

Source plan: `FOLLOWUP_AI_PLAN.md` (backend repo).

---------------------------------------------------------------------------------------------------------------------

## 1. Approvals inbox (all approvals live here)

| Item | What the owner does | Data | For now |
|---|---|---|---|
| Ad playbook: chat flow for an ad | approve / edit / reject | `ad_playbook_items` kind `flow` | On the ad's follow-up campaign |
| Ad playbook: each follow-up step (message, KLT phase, gap, media) | approve / edit / reject one by one | `ad_playbook_items` kind `step` | On the ad's follow-up campaign |
| Approve everything for an ad in one go | one button | same | On the ad's follow-up campaign |
| Approval style default: granular (default) or approve-all | choose once, can override per ad | `businesses.followup_approval_default` | Preferences → Follow-up |
| Regenerated steps after an ad edit | review what changed, approve | `ad_playbook_items` new version | On the ad's follow-up campaign |
| Messages awaiting approval before send | approve / edit / regenerate / reject | `follow_up_queue` `approval_status=awaiting_approval` | Existing queue |
| AI-scheduled follow-ups (when AI scheduling is set to "draft") | approve / change time / reject | `follow_up_queue` (authored by the AI) | Existing queue |

## 2. "Ask the owner to add" items (the AI skipped something and needs help)

| Item | Why it appears | Owner action | Data |
|---|---|---|---|
| Missing testimonial or proof for a step | A proof step has no real testimonial | Add a testimonial (with image) in Materials, or attach media in the campaign builder | `ad_playbook_items.status=needs_media` |
| Missing media for a step | Step wants an image or video and none exists | Upload or pick media | same |
| Message failed QC | Message broke a service or voice rule and was skipped | Edit the message or step, or accept the skip | `follow_up_queue.skip_reason=qc_failed`, `qc_notes` |
| Weak ad data | Ad has no body, no headline, or no usable image | Open the Ad editor, fix headline/body, upload an image | `ad_playbooks.data_quality` |
| Ad edited, follow-ups waiting for review | Owner changed an ad that already has follow-ups | Review the rewritten steps | `ad_playbooks.status` |

## 3. Lead and conversation alerts

| Item | Trigger | Data |
|---|---|---|
| Lead opted out by the AI | Said stop, or equivalent | `followup_ai_turns` decision `stop`, `contacts.do_not_contact` |
| Very negative lead | Strongly negative reply to a follow-up | feedback loop |
| Handoff waiting | Chat AI or the director handed a lead to the owner | `conversations.handover_flag` |
| Lead is hot | Intent rose, follow-ups were reordered to proof or offer | `followup_ai_turns` decision `reorder` |
| Follow-ups on hold | Chat AI or owner put a hold on a lead | `lead_ai_state.hold_followups_until` |

## 4. Is the system working? (feedback loop view)

Per ad and per step: sent, read, replied, action taken, opt-outs, negative replies, qc failures, skipped, rescheduled.
The Follow-up AI's decision mix (send / rewrite / reorder / reschedule / skip / stop) and a one-line reason for recent decisions.
Why a lead's next message is at a given time (`campaign_enrollments.schedule_reason`).
Source: `followup_ai_turns`, `v_campaign_message_feedback`.

## 5. Money and limits

- AI wallet and send balance warnings (the Follow-up AI is billed like the chat AI, 8x).
- Daily cap usage and how many follow-ups are queued per day.
- Paused AI because of an empty wallet.

## 6. Settings that should be reachable from Home

- Minimum gap between messages (hours, all leads).
- AI scheduling mode (off / draft / auto).
- Quiet hours and active days (already in Preferences → Follow-up).

---------------------------------------------------------------------------------------------------------------------

Open for the Home design: which items block sending (approvals) and which are only information (alerts and health), and how many
items before the list needs grouping per ad.
