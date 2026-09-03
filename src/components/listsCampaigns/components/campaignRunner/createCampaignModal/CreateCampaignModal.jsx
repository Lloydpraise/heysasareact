import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Stepper from './Stepper';
import ListSelectionStep from './Listselectionstep';
import MessageSequenceBuilder from './Messagesequencebuilder';
import ScheduleGuardrails from './ScheduleGuardrails';
import { SEQUENCE_TYPE, EDUCATIONAL_FREQUENCY } from '../../../constants';
import { launchCampaign, updateCampaign } from '../../../../../services/listsCampaignsService';
import { getSettings } from '../../../../../services/settingsService';
import { formatDateTimeLocalInTimeZone, parseDateTimeLocalInTimeZone } from '../../../../../utils/businessTime';

const STEPS = ['Select lists', 'Build campaign'];

function emptyStep() {
  return { content: '', gapHours: 24 };
}

function getInitialSteps(campaign) {
  if (!campaign?.steps?.length) return [emptyStep()];
  return campaign.steps.map((step, index) => ({
    id: step.id,
    content: step.content || '',
    gapHours: index === 0 ? 0 : step.gapHours ?? step.delayHours ?? 24,
  }));
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function getDefaultSendTime(timeZone = 'UTC') {
  return formatDateTimeLocalInTimeZone(addHours(new Date(), 5 / 60), timeZone);
}

export default function CreateCampaignModal({ open, campaign, onClose, businessId, onLaunched }) {
  const [stepIndex, setStepIndex] = useState(() => (campaign ? 1 : 0));
  const [campaignName, setCampaignName] = useState(() => campaign?.name || '');
  const [selectedListIds, setSelectedListIds] = useState(() => (campaign?.listId ? [campaign.listId] : []));
  const [audience, setAudience] = useState(() => (
    campaign ? { sendableCount: campaign.enrolled ?? 0 } : null
  ));

  const [sequenceType, setSequenceType] = useState(() => campaign?.sequenceType || SEQUENCE_TYPE.BROADCAST);
  const [educationalTopic, setEducationalTopic] = useState('');
  const [frequency, setFrequency] = useState(EDUCATIONAL_FREQUENCY[1]?.value || 'weekly');
  const [steps, setSteps] = useState(() => getInitialSteps(campaign));
  const [firstMessageSendAt, setFirstMessageSendAt] = useState(() => getDefaultSendTime());
  const [timezone, setTimezone] = useState('UTC');

  const [smartTiming, setSmartTiming] = useState(() => campaign?.smartTiming ?? true);
  const [dailyCap, setDailyCap] = useState(null);
  const [quietHours, setQuietHours] = useState({ start: 21, end: 8 }); // matches backend DEFAULT_QUIET_START/END fallback
  const [activeDays, setActiveDays] = useState([0, 1, 2, 3, 4, 5, 6]);
  // AI toggle: off (default) sends each message exactly as written below.
  // On, AI treats what you wrote as a suggestion and personalizes/expands
  // it per lead before sending.
  const [aiRewriteEnabled, setAiRewriteEnabled] = useState(() => campaign?.aiRewriteEnabled ?? false);
  // Auto-approve: on (default) sends automatically when each step is due.
  // Off holds every message for your approval in the dashboard first.
  const [autoApprove, setAutoApprove] = useState(() => campaign?.autoApprove ?? true);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    if (!businessId) {
      setDailyCap(null);
      return () => { isMounted = false; };
    }

    getSettings()
      .then((settings) => {
        if (!isMounted) return;
        const nextTimezone = settings?.business?.timezone || 'Africa/Nairobi';
        setTimezone(nextTimezone);
        setFirstMessageSendAt(getDefaultSendTime(nextTimezone));
        const nextCap = Number(settings?.prefs?.daily_cap);
        setDailyCap(Number.isFinite(nextCap) && nextCap > 0 ? nextCap : null);

        // NOTE: assumed to live alongside daily_cap in the same prefs
        // object — same path pattern already used above. If your actual
        // settings shape differs, this is a one-line fix.
        const qStart = Number(settings?.business?.followup_quiet_start ?? settings?.prefs?.followup_quiet_start);
        const qEnd = Number(settings?.business?.followup_quiet_end ?? settings?.prefs?.followup_quiet_end);
        setQuietHours({
          start: Number.isFinite(qStart) ? qStart : 21,
          end: Number.isFinite(qEnd) ? qEnd : 8,
        });
        setActiveDays(Array.isArray(settings?.business?.followup_active_days)
          ? settings.business.followup_active_days
          : [0, 1, 2, 3, 4, 5, 6]);
      })
      .catch(() => {
        if (isMounted) setDailyCap(null);
      });

    return () => { isMounted = false; };
  }, [businessId]);

  const reset = () => {
    setStepIndex(0);
    setCampaignName('');
    setSelectedListIds([]);
    setAudience(null);
    setSequenceType(SEQUENCE_TYPE.BROADCAST);
    setEducationalTopic('');
    setFrequency(EDUCATIONAL_FREQUENCY[1]?.value || 'weekly');
    setSteps([emptyStep()]);
    setFirstMessageSendAt(getDefaultSendTime(timezone));
    setSmartTiming(true);
    setAiRewriteEnabled(false);
    setAutoApprove(true);
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const safeDailyCap = dailyCap || 1;
  const estDays = dailyCap ? Math.max(1, Math.ceil((audience?.sendableCount || 0) / dailyCap)) : 1;

  const openPreferencesForDailyCap = () => {
    window.dispatchEvent(new CustomEvent('heysasa:open-preferences', { detail: { section: 'followup' } }));
    window.history.pushState(null, '', '/preferences');
  };

  const canContinueFromLists = selectedListIds.length > 0 && audience && !audience.error;
  const canLaunch =
    campaignName.trim().length > 0 &&
    steps.every((s) => s.content.trim().length > 0) &&
    (sequenceType !== SEQUENCE_TYPE.EDUCATIONAL || educationalTopic.trim().length > 0);

  const handleLaunch = async () => {
    setError('');
    setLaunching(true);
    try {
      const minimumAllowed = new Date(Date.now() + 5 * 60 * 1000);
      const baseDate = parseDateTimeLocalInTimeZone(firstMessageSendAt, timezone);
      const safeBaseDate = baseDate < minimumAllowed ? minimumAllowed : baseDate;
      setFirstMessageSendAt(formatDateTimeLocalInTimeZone(safeBaseDate, timezone));

      const normalizedSteps = steps.map((s, i) => {
        const offsetHours = steps
          .slice(1, i + 1)
          .reduce((sum, step) => sum + (Number(step.gapHours) || 0), 0);
        const sendAt = addHours(safeBaseDate, offsetHours).toISOString();

        return {
          id: s.id,
          order: i + 1,
          content: s.content,
          condition: s.condition,
          gapHours:
            i === 0
              ? 0
              : sequenceType === SEQUENCE_TYPE.EDUCATIONAL
                ? EDUCATIONAL_FREQUENCY.find((f) => f.value === frequency)?.minGapHours
                : s.gapHours,
          sendAt,
        };
      });

      const campaignData = {
        businessId,
        timezone,
        name: campaignName.trim(),
        listIds: selectedListIds,
        sequenceType,
        educationalTopic: sequenceType === SEQUENCE_TYPE.EDUCATIONAL ? educationalTopic.trim() : null,
        frequency: sequenceType === SEQUENCE_TYPE.EDUCATIONAL ? frequency : null,
        smartTiming,
        firstMessageSendAt: safeBaseDate.toISOString(),
        steps: normalizedSteps,
        dailyCap: dailyCap ?? undefined,
        aiRewriteEnabled: Boolean(aiRewriteEnabled),
        autoApprove: Boolean(autoApprove),
      };
      await (campaign ? updateCampaign(campaign.id, campaignData) : launchCampaign(businessId, campaignData));
      onLaunched?.();
      handleClose();
    } catch (err) {
      setError(err.message || 'Could not launch campaign.');
    } finally {
      setLaunching(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/35 p-4 sm:p-6">
      <div className="static w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.5rem] border border-white/80 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-xl sm:max-h-[calc(100vh-3rem)]">
        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 sm:px-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Campaign builder</p>
            <h3 className="mt-1 text-base font-semibold text-slate-800">{campaign ? 'Edit campaign' : 'Create campaign'}</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800"
            aria-label="Close campaign flow"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <Stepper steps={STEPS} currentIndex={stepIndex} />
            </div>

            {stepIndex === 1 && (
              <div className="space-y-1">
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Name this campaign"
                  className="w-full bg-transparent text-2xl font-semibold text-slate-900 placeholder:text-slate-400 outline-none"
                />
                <p className="text-sm text-slate-500">
                  {audience?.sendableCount ?? '—'} leads will be sent to · from {selectedListIds.length} list{selectedListIds.length === 1 ? '' : 's'}
                </p>
              </div>
            )}

            {stepIndex === 0 && (
              <ListSelectionStep
                businessId={businessId}
                campaignId={campaign?.id}
                selectedListIds={selectedListIds}
                onChangeSelection={setSelectedListIds}
                onAudiencePreview={setAudience}
              />
            )}

            {stepIndex === 1 && (
              <>
                <MessageSequenceBuilder
                  sequenceType={sequenceType}
                  setSequenceType={setSequenceType}
                  educationalTopic={educationalTopic}
                  setEducationalTopic={setEducationalTopic}
                  frequency={frequency}
                  setFrequency={setFrequency}
                  steps={steps}
                  setSteps={setSteps}
                  firstMessageSendAt={firstMessageSendAt}
                  setFirstMessageSendAt={setFirstMessageSendAt}
                  quietStart={quietHours.start}
                  quietEnd={quietHours.end}
                  activeDays={activeDays}
                  timezone={timezone}
                />

                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="pr-3">
                      <p className="text-sm font-medium text-slate-700">Let AI rewrite these messages</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Off sends your words exactly as written. On treats them as a suggestion — AI personalizes and expands each one per lead before sending.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={aiRewriteEnabled}
                      onClick={() => setAiRewriteEnabled((v) => !v)}
                      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${
                        aiRewriteEnabled ? 'bg-[#28A745]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                          aiRewriteEnabled ? 'left-5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="pr-3">
                      <p className="text-sm font-medium text-slate-700">Auto-approve every message</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        On sends automatically when each step is due. Off holds every message for your approval first — nothing sends until you approve it.
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={autoApprove}
                      onClick={() => setAutoApprove((v) => !v)}
                      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${
                        autoApprove ? 'bg-[#28A745]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                          autoApprove ? 'left-5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <ScheduleGuardrails
                    smartTiming={smartTiming}
                    setSmartTiming={setSmartTiming}
                    dailyCap={dailyCap}
                    estDays={estDays}
                    onSetDailyCap={openPreferencesForDailyCap}
                  />
                </div>
              </>
            )}

            {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => (stepIndex === 0 ? handleClose() : setStepIndex(0))}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
              >
                {stepIndex === 0 ? 'Cancel' : 'Back'}
              </button>

              {stepIndex === 0 ? (
                <button
                  type="button"
                  disabled={!canContinueFromLists}
                  onClick={() => setStepIndex(1)}
                  className="rounded-2xl bg-[#28A745] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#28A745]/20 transition hover:bg-[#1f8d3d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!canLaunch || launching}
                  onClick={handleLaunch}
                  className="rounded-2xl bg-[#28A745] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#28A745]/20 transition hover:bg-[#1f8d3d] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {launching ? (campaign ? 'Updating…' : 'Launching…') : (campaign ? 'Update Campaign' : 'Launch Campaign')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}