// Reads a campaign from an .xlsx or .json file and checks it, so what comes out is
// exactly what the Create campaign screen needs. Pure functions, no screens in here.
//
// File layout (the downloadable templates show it too):
//   .xlsx : sheet "Campaigns" (one row per campaign) + sheet "Steps" (one row per message).
//           A sheet with only message rows also works: that becomes one campaign.
//   .json : { "campaigns": [ { name, type, steps: [{ message, wait_hours }] } ] }
// Lists and the WhatsApp number are NOT in the file: you pick those in the app.

export const MAX_STEPS = 8;
export const MAX_MESSAGE_CHARS = 1200;
export const GAP_OPTIONS = [4, 12, 24, 48, 72, 96, 168]; // the gaps the builder offers, in hours
export const FREQUENCIES = { daily: 'daily', weekly: 'weekly', biweekly: 'biweekly', 'bi-weekly': 'biweekly', 'bi_weekly': 'biweekly' };
const KNOWN_TOKENS = ['first_name', 'product_interest'];
const UNFILLED_TOKENS = ['price']; // exists in the builder, but there is no data to fill it yet

const COLS = {
  key: ['campaign', 'key', 'id'],
  name: ['campaign_name', 'name', 'title'],
  type: ['type', 'sequence_type'],
  topic: ['educational_topic', 'topic'],
  frequency: ['frequency'],
  aiRewrite: ['ai_rewrite', 'ai_rewrite_enabled', 'let_ai_rewrite'],
  autoApprove: ['auto_approve', 'approve_automatically'],
  smartTiming: ['smart_timing'],
  step: ['step', 'order', 'number'],
  message: ['message', 'content', 'text', 'body'],
  wait: ['wait_hours', 'delay_hours', 'gap_hours', 'wait', 'delay', 'gap'],
};

const normKeys = (o) => Object.fromEntries(Object.entries(o || {}).map(([k, v]) => [String(k).trim().toLowerCase().replace(/[\s-]+/g, '_'), v]));
const pick = (o, names) => { for (const n of names) if (o[n] !== undefined && String(o[n]).trim() !== '') return o[n]; return ''; };
const toBool = (v, fallback) => {
  const t = String(v ?? '').trim().toLowerCase();
  if (!t) return fallback;
  if (['true', 'yes', 'y', '1', 'on'].includes(t)) return true;
  if (['false', 'no', 'n', '0', 'off'].includes(t)) return false;
  return fallback;
};

function fromJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON. Check for a missing comma, quote or bracket.');
  }
  const list = Array.isArray(data) ? data : (data.campaigns || [data]);
  return list.map((c) => {
    const o = normKeys(c);
    const steps = (c.steps || c.messages || []).map((st) => {
      const x = normKeys(typeof st === 'string' ? { message: st } : st);
      return { message: String(pick(x, COLS.message)), wait: pick(x, COLS.wait) };
    });
    return { raw: o, steps };
  });
}

function fromSheets(wb, XLSX, fileName) {
  const sheet = (names) => {
    const n = wb.SheetNames.find((x) => names.includes(x.trim().toLowerCase()));
    return n ? XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: '' }).map(normKeys) : null;
  };
  const camps = sheet(['campaigns', 'campaign']);
  let stepRows = sheet(['steps', 'messages']);

  if (!camps && !stepRows) {
    // Simplest layout: one sheet of messages. One campaign, named after the file.
    const first = wb.SheetNames[0];
    stepRows = first ? XLSX.utils.sheet_to_json(wb.Sheets[first], { defval: '' }).map(normKeys) : [];
    if (!stepRows.some((r) => String(pick(r, COLS.message)).trim())) {
      throw new Error('Could not find any messages. Download the template to see the layout.');
    }
    const grouped = {};
    stepRows.forEach((r) => {
      const k = String(pick(r, COLS.key) || pick(r, COLS.name) || fileName.replace(/\.[^.]+$/, '')).trim();
      (grouped[k] ||= []).push(r);
    });
    return Object.entries(grouped).map(([name, rows]) => ({ raw: { campaign_name: name }, steps: ordered(rows) }));
  }
  if (!camps || !stepRows) throw new Error('The file needs two sheets named "Campaigns" and "Steps". Download the template to see the layout.');

  const byKey = {};
  stepRows.forEach((r) => {
    const k = String(pick(r, COLS.key)).trim();
    // A row with a step number but no text is kept, so it is reported as an empty message
    // instead of silently shifting the messages after it.
    if (k && (String(pick(r, COLS.message)).trim() || String(pick(r, COLS.step)).trim())) (byKey[k] ||= []).push(r);
  });
  return camps
    .filter((c) => Object.values(c).some((v) => String(v).trim()))
    .map((c) => {
      const key = String(pick(c, COLS.key) || pick(c, COLS.name)).trim();
      return { raw: c, steps: ordered(byKey[key] || []) };
    });
}

function ordered(rows) {
  return [...rows]
    .sort((a, b) => Number(pick(a, COLS.step) || 0) - Number(pick(b, COLS.step) || 0))
    .map((r) => ({ message: String(pick(r, COLS.message)), wait: pick(r, COLS.wait) }));
}

const nearestGap = (hours) => GAP_OPTIONS.reduce((best, g) => (Math.abs(g - hours) < Math.abs(best - hours) ? g : best), GAP_OPTIONS[0]);

// One parsed campaign -> { campaign, errors, warnings }. errors block "Use this campaign".
export function checkCampaign(parsed, index = 0) {
  const o = parsed.raw;
  const errors = [];
  const warnings = [];

  const name = String(pick(o, COLS.name) || pick(o, COLS.key)).trim();
  if (!name) errors.push('The campaign has no name.');

  const typeText = String(pick(o, COLS.type) || 'broadcast').trim().toLowerCase();
  const type = ['broadcast', 'educational'].includes(typeText) ? typeText : null;
  if (!type) errors.push(`Type "${typeText}" is not valid. Use broadcast or educational.`);

  let topic = '';
  let frequency = 'weekly';
  if (type === 'educational') {
    topic = String(pick(o, COLS.topic)).trim();
    if (!topic) errors.push('Educational campaigns need an educational_topic.');
    const f = FREQUENCIES[String(pick(o, COLS.frequency) || 'weekly').trim().toLowerCase()];
    if (!f) errors.push('Frequency must be daily, weekly or biweekly.');
    else frequency = f;
  }

  const steps = [];
  if (!parsed.steps.length) errors.push('The campaign has no messages.');
  if (parsed.steps.length > MAX_STEPS) errors.push(`It has ${parsed.steps.length} messages. The most allowed is ${MAX_STEPS}.`);
  parsed.steps.slice(0, MAX_STEPS).forEach((st, i) => {
    const n = i + 1;
    const content = st.message.trim();
    if (!content) { errors.push(`Message ${n} is empty.`); return; }
    if (content.length > MAX_MESSAGE_CHARS) errors.push(`Message ${n} is ${content.length} characters. The most allowed is ${MAX_MESSAGE_CHARS}.`);
    for (const m of content.matchAll(/\{\{\s*([a-z_]+)\s*\}\}/gi)) {
      const tok = m[1].toLowerCase();
      if (UNFILLED_TOKENS.includes(tok)) warnings.push(`Message ${n} uses {{${tok}}}, which is not filled in yet and would be sent as typed.`);
      else if (!KNOWN_TOKENS.includes(tok)) warnings.push(`Message ${n} uses {{${m[1]}}}, which does not exist and would be sent as typed.`);
    }
    let gapHours = 0;
    if (i > 0 && type !== 'educational') {
      const raw = Number(st.wait === '' ? 24 : st.wait);
      if (!Number.isFinite(raw) || raw < 0) { errors.push(`Message ${n} has a wait of "${st.wait}". Use a number of hours.`); gapHours = 24; }
      else {
        gapHours = nearestGap(raw);
        if (gapHours !== raw) warnings.push(`Message ${n} wait of ${raw} hours was changed to ${gapHours}, the nearest wait the builder offers (${GAP_OPTIONS.join(', ')}).`);
      }
    }
    steps.push({ content, gapHours, media: null });
  });
  if (type === 'educational' && parsed.steps.slice(1).some((s) => String(s.wait).trim() !== '')) {
    warnings.push('Waits between messages are ignored for educational campaigns: the spacing follows the frequency.');
  }

  return {
    id: `c${index}`,
    campaign: {
      name,
      sequenceType: type || 'broadcast',
      educationalTopic: topic,
      frequency,
      steps,
      aiRewriteEnabled: toBool(pick(o, COLS.aiRewrite), false),
      autoApprove: toBool(pick(o, COLS.autoApprove), true),
      smartTiming: toBool(pick(o, COLS.smartTiming), true),
    },
    errors,
    warnings,
  };
}

export async function readCampaignFile(file) {
  const name = file.name || 'campaign';
  let parsed;
  if (/\.json$/i.test(name)) {
    parsed = fromJson(await file.text());
  } else if (/\.(xlsx|xls)$/i.test(name)) {
    const XLSX = await import('xlsx');
    parsed = fromSheets(XLSX.read(await file.arrayBuffer(), { type: 'array' }), XLSX, name);
  } else {
    throw new Error('Please upload an .xlsx or .json file.');
  }
  if (!parsed.length) throw new Error('No campaigns were found in that file.');
  const checked = parsed.map(checkCampaign);
  const seen = new Set();
  checked.forEach((c) => {
    const k = c.campaign.name.toLowerCase();
    if (k && seen.has(k)) c.warnings.push('Another campaign in this file has the same name.');
    seen.add(k);
  });
  return checked;
}

const SAMPLE = {
  key: 'lash-offer', name: 'Easter lash offer', type: 'broadcast', topic: '', frequency: '',
  aiRewrite: false, autoApprove: true, smartTiming: true,
  steps: [
    { message: 'Hi {{first_name}}! Our Easter lash offer is live this week. Want me to hold a slot for you?', wait: 0 },
    { message: 'Hi {{first_name}}, just checking you saw the offer. Slots are filling up.', wait: 48 },
    { message: 'Last call on the Easter offer, {{first_name}}. Reply YES and I will book you in.', wait: 72 },
  ],
};

export function downloadJsonTemplate() {
  const body = { campaigns: [{ name: SAMPLE.name, type: SAMPLE.type, ai_rewrite: false, auto_approve: true, smart_timing: true,
    steps: SAMPLE.steps.map((s) => ({ message: s.message, wait_hours: s.wait })) }] };
  save('campaign-template.json', new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' }));
}

export async function downloadXlsxTemplate() {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['campaign', 'name', 'type', 'educational_topic', 'frequency', 'ai_rewrite', 'auto_approve', 'smart_timing'],
    [SAMPLE.key, SAMPLE.name, SAMPLE.type, SAMPLE.topic, SAMPLE.frequency, 'no', 'yes', 'yes'],
  ]), 'Campaigns');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['campaign', 'step', 'message', 'wait_hours'],
    ...SAMPLE.steps.map((s, i) => [SAMPLE.key, i + 1, s.message, s.wait]),
  ]), 'Steps');
  XLSX.writeFile(wb, 'campaign-template.xlsx');
}

function save(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
