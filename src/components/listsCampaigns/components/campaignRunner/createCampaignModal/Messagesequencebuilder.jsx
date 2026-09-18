import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, LoaderCircle, Paperclip, Plus, X } from 'lucide-react';
import { MERGE_FIELDS, SEQUENCE_TYPE, EDUCATIONAL_FREQUENCY, BROADCAST_GAP_OPTIONS } from '../../../constants';
import { formatDateTimeLocalInTimeZone, getTimeZoneHour, getTimeZoneWeekday, parseDateTimeLocalInTimeZone } from '../../../../../utils/businessTime';
import { uploadCampaignImage } from '../../../../../services/campaignMediaService';

function emptyStep() {
  return { content: '', gapHours: BROADCAST_GAP_OPTIONS[2].value }; // defaults to 1 day
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function formatDisplayDateTime(date, timeZone) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

// Mirrors the backend's isQuiet() in timing.js exactly — same wraparound
// logic for a window like 21:00-08:00 that crosses midnight.
function isQuietHour(hour, quietStart, quietEnd) {
  return quietStart > quietEnd
    ? (hour >= quietStart || hour < quietEnd)
    : (hour >= quietStart && hour < quietEnd);
}

function formatHour(hour) {
  const h = ((hour % 24) + 24) % 24;
  const period = h < 12 ? 'AM' : 'PM';
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${period}`;
}

export default function MessageSequenceBuilder({
  sequenceType,
  setSequenceType,
  educationalTopic,
  setEducationalTopic,
  frequency,
  setFrequency,
  steps,
  setSteps,
  businessId,
  firstMessageSendAt,
  setFirstMessageSendAt,
  quietStart = 21,
  quietEnd = 8,
  activeDays = [0, 1, 2, 3, 4, 5, 6],
  timezone = 'Africa/Nairobi',
}) {
  const textareaRefs = useRef([]);
  const isEducational = sequenceType === SEQUENCE_TYPE.EDUCATIONAL;
  const [schedulePreset, setSchedulePreset] = useState('now');
  const [scheduleError, setScheduleError] = useState('');
  const [minimumScheduleTime] = useState(() => new Date(Date.now() + 5 * 60 * 1000));
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadErrors, setUploadErrors] = useState({});

  const insertToken = (index, token) => {
    const el = textareaRefs.current[index];
    if (!el) return;
    const { selectionStart, selectionEnd, value } = el;
    const next = value.slice(0, selectionStart) + `{{${token}}}` + value.slice(selectionEnd);
    const updated = [...steps];
    updated[index] = { ...updated[index], content: next };
    setSteps(updated);
  };

  const updateStep = (index, field, value) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleImageUpload = async (index, event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingIndex(index);
    setUploadErrors((current) => ({ ...current, [index]: '' }));
    try {
      const media = await uploadCampaignImage(businessId, file);
      const updated = [...steps];
      updated[index] = { ...updated[index], media };
      setSteps(updated);
    } catch (error) {
      setUploadErrors((current) => ({
        ...current,
        [index]: error.message || 'Could not upload the image.',
      }));
    } finally {
      setUploadingIndex(null);
    }
  };

  const addStep = () => setSteps([...steps, emptyStep()]);
  const removeStep = (index) => setSteps(steps.filter((_, i) => i !== index));

  const getStepSendAt = (index) => {
    const baseDate = parseDateTimeLocalInTimeZone(firstMessageSendAt, timezone);
    const offsetHours = steps
      .slice(1, index + 1)
      .reduce((total, step) => total + (Number(step.gapHours) || 0), 0);
    return addHours(baseDate, offsetHours);
  };

  // Preset options are evaluated against the current time each render —
  // "in 4 hours" landing inside quiet hours today shouldn't be offered as
  // if it were sendable.
  const presetIsQuiet = (preset) => {
    if (preset === 'now' || preset === 'custom') return false;
    const candidate = addHours(new Date(), Number(preset));
    return isUnavailable(candidate, timezone, quietStart, quietEnd, activeDays);
  };

  const handlePresetChange = (preset) => {
    if (preset !== 'custom' && presetIsQuiet(preset)) return; // guarded by disabled state too; belt and suspenders
    setSchedulePreset(preset);
    setScheduleError('');
    if (preset === 'custom') return;

    const baseDate = new Date();
    const minutesAhead = preset === 'now' ? 5 : Number(preset) * 60;
    const nextDate = addHours(baseDate, minutesAhead / 60);
    setFirstMessageSendAt(formatDateTimeLocalInTimeZone(nextDate, timezone));
  };

  const handleCustomDateChange = (value) => {
    const nextDate = parseDateTimeLocalInTimeZone(value, timezone);
    const minimumAllowed = new Date(Date.now() + 5 * 60 * 1000);
    const safeValue = nextDate < minimumAllowed ? minimumAllowed : nextDate;

    // Not selectable if it falls in quiet hours — reject and explain,
    // rather than silently picking a different time on the user's behalf.
    if (isUnavailable(safeValue, timezone, quietStart, quietEnd, activeDays)) {
      setScheduleError(
        `That time is outside active business hours (${formatHour(quietEnd)}–${formatHour(quietStart)}) or on an inactive day. Pick another time.`
      );
      return;
    }

    setScheduleError('');
    setSchedulePreset('custom');
    setFirstMessageSendAt(formatDateTimeLocalInTimeZone(safeValue, timezone));
  };

  const scheduleSummary = useMemo(() => {
    const baseDate = parseDateTimeLocalInTimeZone(firstMessageSendAt, timezone);
    return formatDisplayDateTime(baseDate, timezone);
  }, [firstMessageSendAt, timezone]);

  const PRESET_OPTIONS = [
    { value: 'now', label: 'Send now' },
    { value: '4', label: 'In 4 hours' },
    { value: '12', label: 'In 12 hours' },
    { value: 'custom', label: 'Custom time' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label className="text-sm font-medium text-slate-700">Send timing</label>
            <p className="mt-1 text-[11px] text-slate-500">Message 1 sends at {scheduleSummary}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Quiet hours: {formatHour(quietStart)}–{formatHour(quietEnd)} — no messages send in that window
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={schedulePreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#28A745]"
            >
              {PRESET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={presetIsQuiet(opt.value)}>
                  {opt.label}{presetIsQuiet(opt.value) ? ' (quiet hours)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {schedulePreset === 'custom' && (
          <div className="mt-3">
            <input
              type="datetime-local"
              value={firstMessageSendAt}
              min={formatDateTimeLocalInTimeZone(minimumScheduleTime, timezone)}
              onChange={(e) => handleCustomDateChange(e.target.value)}
              className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#28A745] ${
                scheduleError ? 'border-red-300' : 'border-slate-200'
              }`}
            />
            {scheduleError && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-red-500">
                <AlertTriangle className="h-3 w-3" />
                {scheduleError}
              </p>
            )}
          </div>
        )}
      </div>
      <div>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          {[SEQUENCE_TYPE.BROADCAST, SEQUENCE_TYPE.EDUCATIONAL].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSequenceType(type)}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                sequenceType === type ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {type === SEQUENCE_TYPE.BROADCAST ? 'Broadcast' : 'Educational'}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {isEducational
            ? 'Regular, on-topic messages — offers/promos don\u2019t belong here.'
            : 'Announcements, offers, and one-off pushes.'}
        </p>
      </div>

      {isEducational && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div>
            <label className="text-sm font-medium text-slate-700">What do you want to educate people about?</label>
            <input
              type="text"
              value={educationalTopic}
              onChange={(e) => setEducationalTopic(e.target.value)}
              placeholder="e.g. lash aftercare tips"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#28A745] placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Frequency</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {EDUCATIONAL_FREQUENCY.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFrequency(f.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                    frequency === f.value
                      ? 'bg-[#28A745] text-white border-[#28A745]'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-[#28A745]/50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Spacing between messages is locked to this frequency to keep a steady, non-spammy heartbeat.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {steps.map((step, i) => {
          const stepSendAt = getStepSendAt(i);
          const stepIsQuiet = i > 0 && isUnavailable(stepSendAt, timezone, quietStart, quietEnd, activeDays);

          return (
          <div key={i}>
            {i > 0 && (
              <div className="flex items-center gap-3 py-3">
                <span className="flex-1 h-px bg-slate-200" />
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
                  <span>Min gap:</span>
                  {isEducational ? (
                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-medium">
                      {EDUCATIONAL_FREQUENCY.find((f) => f.value === frequency)?.label || 'Set frequency above'}
                    </span>
                  ) : (
                    <select
                      value={step.gapHours}
                      onChange={(e) => updateStep(i, 'gapHours', Number(e.target.value))}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700"
                    >
                      {BROADCAST_GAP_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                  <span>before this message</span>
                </div>
                <span className="flex-1 h-px bg-slate-200" />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">Message {i + 1}</label>
                <div className="flex items-center gap-1">
                  {MERGE_FIELDS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => insertToken(i, f.key)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"
                    >
                      {f.label}
                    </button>
                  ))}
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => removeStep(i)}
                      className="ml-1 text-slate-300 hover:text-red-500"
                      aria-label={`Remove message ${i + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className={`rounded-xl border px-2.5 py-1.5 text-[11px] ${
                stepIsQuiet ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-500'
              }`}>
                {i === 0 ? 'Send at' : 'Scheduled for'}: {formatDisplayDateTime(stepSendAt)}
                {stepIsQuiet && ' — falls in quiet hours, will actually send after they end'}
              </div>

              <div className="relative">
                <textarea
                  ref={(el) => (textareaRefs.current[i] = el)}
                  value={step.content}
                  onChange={(e) => updateStep(i, 'content', e.target.value)}
                  rows={3}
                  placeholder="Message to send…"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 pb-11 text-sm text-slate-800 outline-none focus:border-[#28A745] focus:bg-white placeholder:text-slate-400"
                />
                <input
                  id={`campaign-image-${i}`}
                  type="file"
                  accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                  onChange={(event) => handleImageUpload(i, event)}
                  className="hidden"
                />
                <label
                  htmlFor={`campaign-image-${i}`}
                  title="Attach PNG, JPG, or JPEG image"
                  aria-label={`Attach image to message ${i + 1}`}
                  className={`absolute bottom-2 left-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-[#28A745]/40 hover:text-[#28A745] ${uploadingIndex === i ? 'pointer-events-none opacity-60' : ''}`}
                >
                  {uploadingIndex === i ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                </label>
                {step.media && (
                  <div className="absolute bottom-2 left-11 flex max-w-[calc(100%-3.5rem)] items-center gap-1.5 rounded-lg border border-[#BFE8CA] bg-white p-1 shadow-sm">
                    <img
                      src={step.media.url}
                      alt={step.media.file_name || 'Attached image'}
                      className="h-7 w-7 rounded object-cover"
                    />
                    <span className="max-w-32 truncate text-[10px] text-slate-600">{step.media.file_name}</span>
                    <button
                      type="button"
                      onClick={() => updateStep(i, 'media', null)}
                      className="text-slate-400 hover:text-red-600"
                      aria-label={`Remove image from message ${i + 1}`}
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              {uploadErrors[i] && (
                <p className="flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {uploadErrors[i]}
                </p>
              )}
            </div>
          </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={addStep}
          className="w-9 h-9 rounded-full border border-slate-200 bg-white text-[#28A745] hover:bg-[#28A745]/5 hover:border-[#28A745]/40 flex items-center justify-center transition"
          aria-label="Add another message"
          title="Add another message"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function isUnavailable(date, timeZone, quietStart, quietEnd, activeDays) {
  return !activeDays.includes(getTimeZoneWeekday(date, timeZone))
    || isQuietHour(getTimeZoneHour(date, timeZone), quietStart, quietEnd);
}