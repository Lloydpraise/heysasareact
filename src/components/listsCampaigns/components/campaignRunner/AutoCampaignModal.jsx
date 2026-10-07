import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import MessageSequenceBuilder from './createCampaignModal/Messagesequencebuilder';
import AssistantButton from '../../../assistant/AssistantButton';
import { SEQUENCE_TYPE } from '../../constants';
import {
  saveAutoCampaignConfig,
  resetAutoCampaignToDefault,
  activateAutoCampaign,
} from '../../../../services/listsCampaignsService';
import { fetchWhatsAppSessions } from '../../../../services/businessService';
import { getSettings } from '../../../../services/settingsService';
import { formatDateTimeLocalInTimeZone } from '../../../../utils/businessTime';

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${checked ? 'bg-[#28A745]' : 'bg-slate-300'}`}
    >
      <span className={`toggle-knob absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-5' : 'left-0.5'}`} />
    </button>
  );
}

const sameSteps = (a, b) =>
  a.length === b.length && a.every((s, i) => s.content === b[i].content && Number(s.gapHours) === Number(b[i].gapHours));

/**
 * Same builder as the manual campaign flow, pre-filled with the default (or the
 * business's own) sequence. The messages are EXAMPLES: with AI on, each is rewritten
 * per lead using the objective, the playbook and that lead's customer profile.
 */
export default function AutoCampaignModal({ open, auto, businessId, onClose, onChanged }) {
  const [objective, setObjective] = useState('');
  const [playbook, setPlaybook] = useState('');
  const [steps, setSteps] = useState([]);
  const [aiRewrite, setAiRewrite] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);
  const [instanceName, setInstanceName] = useState('');
  const [dailyCap, setDailyCap] = useState(40);
  const [sessions, setSessions] = useState([]);
  const [timezone, setTimezone] = useState('Africa/Nairobi');
  const [quiet, setQuiet] = useState({ start: 21, end: 8 });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !auto) return;
    setObjective(auto.objective);
    setPlaybook(auto.playbook);
    setSteps(auto.steps.map((s) => ({ ...s, media: null })));
    setAiRewrite(auto.aiRewriteEnabled);
    setAutoApprove(auto.autoApprove);
    setInstanceName(auto.whatsappInstanceName);
    setDailyCap(auto.dailyCap);
    setError('');
  }, [open, auto]);

  useEffect(() => {
    if (!open || !businessId) return undefined;
    let alive = true;
    fetchWhatsAppSessions(businessId)
      .then((rows) => alive && setSessions(rows.filter((r) => r.status === 'connected' && r.instance_name)))
      .catch(() => alive && setSessions([]));
    getSettings()
      .then((settings) => {
        if (!alive) return;
        setTimezone(settings?.business?.timezone || 'Africa/Nairobi');
        const qs = Number(settings?.prefs?.quiet_start);
        const qe = Number(settings?.prefs?.quiet_end);
        setQuiet({ start: Number.isFinite(qs) ? qs : 21, end: Number.isFinite(qe) ? qe : 8 });
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [open, businessId]);

  const stubSendAt = useMemo(() => formatDateTimeLocalInTimeZone(new Date(), timezone), [timezone]);

  if (!open || !auto) return null;

  const status = auto.campaignStatus;
  const isLive = status === 'active';
  const isPaused = status === 'paused';
  const contentChanged =
    objective !== auto.objective || playbook !== auto.playbook || !sameSteps(steps, auto.steps);
  const stepsValid = steps.length > 0 && steps.every((s) => s.content.trim().length > 0);
  const canSave = stepsValid && objective.trim() && playbook.trim();

  const persist = async () => {
    const patch = {
      aiRewriteEnabled: aiRewrite,
      autoApprove,
      whatsappInstanceName: instanceName,
      dailyCap: Number(dailyCap) || null,
    };
    if (contentChanged) {
      patch.objective = objective.trim();
      patch.playbook = playbook.trim();
      patch.steps = steps;
    }
    await saveAutoCampaignConfig(businessId, auto.ruleId, patch);
  };

  const run = async (kind, fn) => {
    setError('');
    setBusy(kind);
    try {
      await fn();
      onChanged?.();
      onClose?.();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy('');
    }
  };

  const handleSave = () => run('save', persist);
  const handleSaveAndActivate = () =>
    run('activate', async () => {
      await persist();
      await activateAutoCampaign(businessId, auto.ruleId);
    });
  const handleReset = () => run('reset', () => resetAutoCampaignToDefault(businessId, auto.ruleId));

  return (
    <div className="sheet-overlay fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/35 p-4 sm:p-6">
      <div className="sheet-panel sheet-tall w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.5rem] border border-white/80 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-xl sm:max-h-[calc(100vh-3rem)]">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 sm:px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Auto-campaign</p>
            <h3 className="mt-1 text-base font-semibold text-slate-800">{auto.name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800"
            aria-label="Close auto-campaign"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-4 sm:p-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Runs automatically for leads in <span className="font-semibold text-slate-800">{auto.listName}</span>
            {' '}· {auto.readyCount} ready to enrol now. A lead already in another active campaign is never added, and a lead
            who leaves this list is taken out of the sequence.
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Objective</label>
            <p className="text-[11px] text-slate-500">What should this campaign achieve for the leads in this list?</p>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={2}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#28A745]"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">How to follow up</label>
              <AssistantButton
                variant="pill"
                label="Write with AI"
                surface="auto_campaign_playbook"
                title="Follow-up playbook"
                contextKey={`auto_${auto.ruleId}:playbook`}
                currentText={playbook}
                context={{ campaign_name: auto.name, list_name: auto.listName, objective }}
                onApprove={(draft) => setPlaybook(draft.text)}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Your playbook for these leads. The AI follows it when it personalises each message.
            </p>
            <textarea
              value={playbook}
              onChange={(e) => setPlaybook(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#28A745]"
            />
          </div>

          <div className="border-t border-slate-200 pt-4">
            <p className="mb-3 text-sm font-medium text-slate-700">Message sequence</p>
            <p className="mb-3 text-[11px] text-slate-500">
              These are examples to get you started. Edit them, or leave them and let AI rewrite each one for the lead
              (turn AI on below).
            </p>
            <MessageSequenceBuilder
              sequenceType={SEQUENCE_TYPE.BROADCAST}
              setSequenceType={() => {}}
              educationalTopic=""
              setEducationalTopic={() => {}}
              frequency="weekly"
              setFrequency={() => {}}
              steps={steps}
              setSteps={setSteps}
              assistantKey={`auto_${auto.ruleId}`}
              assistantContext={{ campaign_name: auto.name, list_name: auto.listName, objective }}
              businessId={businessId}
              firstMessageSendAt={stubSendAt}
              setFirstMessageSendAt={() => {}}
              quietStart={quiet.start}
              quietEnd={quiet.end}
              timezone={timezone}
              hideSchedule
              hideSequenceType
            />
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-4">
            <div className="max-w-xl space-y-1.5">
              <label htmlFor="auto-campaign-instance" className="block text-sm font-medium text-slate-700">
                Send from <span className="text-red-500">*</span>
              </label>
              <select
                id="auto-campaign-instance"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#28A745]"
              >
                <option value="">Choose a connected WhatsApp number</option>
                {sessions.map((s, i) => (
                  <option key={s.id} value={s.instance_name}>
                    {s.label || s.first_name || s.phone_number || s.instance_name || `WhatsApp ${i + 1}`}
                  </option>
                ))}
              </select>
              {!sessions.length && <p className="text-xs text-amber-600">Connect a WhatsApp number to activate this campaign.</p>}
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="pr-3">
                <p className="text-sm font-medium text-slate-700">Let AI rewrite these messages</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  On (recommended): each example is rewritten for the exact lead using this objective, your playbook and their
                  customer profile. Off sends your words exactly as written.
                </p>
              </div>
              <Toggle checked={aiRewrite} onChange={setAiRewrite} label="Let AI rewrite these messages" />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="pr-3">
                <p className="text-sm font-medium text-slate-700">Auto-approve every message</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Off (recommended at first): every message waits for your approval. On sends automatically when each step is due.
                </p>
              </div>
              <Toggle checked={autoApprove} onChange={setAutoApprove} label="Auto-approve every message" />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="pr-3">
                <p className="text-sm font-medium text-slate-700">Daily send cap</p>
                <p className="mt-0.5 text-[11px] text-slate-500">Most messages this campaign will send in a day.</p>
              </div>
              <input
                type="number"
                min={1}
                value={dailyCap}
                onChange={(e) => setDailyCap(e.target.value)}
                className="w-20 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-[#28A745]"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div>
              {auto.customised && (
                <button
                  type="button"
                  disabled={Boolean(busy)}
                  onClick={handleReset}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-40"
                >
                  {busy === 'reset' ? 'Restoring…' : 'Restore defaults'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
              >
                Cancel
              </button>
              {(isLive || isPaused) && (
                <button
                  type="button"
                  disabled={!canSave || Boolean(busy)}
                  onClick={handleSave}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === 'save' ? 'Saving…' : 'Save changes'}
                </button>
              )}
              {!isLive && (
                <button
                  type="button"
                  disabled={!canSave || !instanceName || Boolean(busy)}
                  onClick={handleSaveAndActivate}
                  className="rounded-2xl bg-[#28A745] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#28A745]/20 transition hover:bg-[#1f8d3d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === 'activate' ? 'Activating…' : isPaused ? 'Save & Resume' : 'Save & Activate'}
                </button>
              )}
              {!isLive && !isPaused && (
                <button
                  type="button"
                  disabled={!canSave || Boolean(busy)}
                  onClick={handleSave}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {busy === 'save' ? 'Saving…' : 'Save for later'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
