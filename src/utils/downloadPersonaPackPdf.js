import { jsPDF } from 'jspdf';

const FIELD_LABELS = {
  display_name: 'Display name',
  voice_tone: 'Voice tone (a short description)',
  formality_score: 'Formality',
  language_mix: 'Language mix',
  typical_greeting: 'Typical greeting',
  typical_closing: 'Typical closing',
  emoji_style: 'Emoji style',
  sentence_length: 'Sentence length',
  signature_phrases: 'Signature phrases (things they actually say)',
  phrases_to_avoid: 'Phrases to avoid',
  tone_descriptors: 'Tone descriptors',
  core_offer: 'Core offer',
  target_customer: 'Target customer',
  delivery_info: 'Delivery info',
  unique_selling_points: 'Unique selling points',
  payment_methods: 'Payment methods',
  objection_playbook: 'Objections',
  customer_profiles: 'Customer profiles',
  sentiment_response_map: 'Sentiment response map',
  closing_triggers: 'Closing triggers',
  human_handoff_triggers: 'Human handoff triggers',
  response_strategy: 'Response strategy',
  suggested_language: 'Suggested language',
  escalation_if_repeated: 'If they say it again',
  profile_name: 'Profile name',
  detection_signals: 'How to recognize them',
  approach_strategy: 'Approach strategy',
  message_style_adjustment: 'Message style adjustment',
  cta_style: 'Call-to-action style',
  what_to_avoid: 'What to avoid with them',
};

const SECTIONS = [
  { title: 'Voice & Tone', value: (pack) => pack.persona },
  { title: 'Business Facts', value: (pack) => pack.business_context },
  { title: 'Objections', value: (pack) => pack.objection_playbook },
  { title: 'Customer Profiles', value: (pack) => pack.customer_profiles },
  { title: 'Sentiment', value: (pack) => pack.sentiment_response_map },
  {
    title: 'Handoff & Closing',
    value: (pack) => ({
      closing_triggers: pack.closing_triggers,
      human_handoff_triggers: pack.human_handoff_triggers,
    }),
  },
];

function formatLabel(key) {
  return FIELD_LABELS[key]
    || key.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function collectRows(value, rows, depth = 0, label = '') {
  if (value === null || value === undefined || value === '') return;

  if (Array.isArray(value)) {
    if (value.every((item) => item === null || ['string', 'number', 'boolean'].includes(typeof item))) {
      rows.push({ label, value: value.filter((item) => item !== null).join(' | '), depth });
      return;
    }

    value.forEach((item, index) => {
      const identityKey = item && typeof item === 'object'
        ? ['objection', 'profile_name', 'name'].find((key) => item[key])
        : null;
      const identity = identityKey ? `: ${item[identityKey]}` : '';
      rows.push({ label: `${label || 'Entry'} ${index + 1}${identity}`, value: '', depth });

      if (item && typeof item === 'object' && !Array.isArray(item)) {
        Object.entries(item).forEach(([key, child]) => {
          if (key !== identityKey) collectRows(child, rows, depth + 1, formatLabel(key));
        });
      } else {
        collectRows(item, rows, depth + 1, '');
      }
    });
    return;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => {
      collectRows(child, rows, depth + 1, formatLabel(key));
    });
    return;
  }

  rows.push({ label, value: String(value), depth });
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight, pageBottom) {
  const lines = doc.splitTextToSize(text, maxWidth);
  for (const line of lines) {
    if (y + lineHeight > pageBottom) {
      doc.addPage();
      y = 18;
    }
    doc.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

export function downloadPersonaPackPdf(pack, businessId) {
  if (!pack || typeof pack !== 'object') throw new Error('There is no persona pack to export.');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const pageBottom = pageHeight - margin;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setProperties({ title: 'Persona Pack' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42);
  doc.text('Persona Pack', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Business: ${businessId || 'Current business'}`, margin, y);
  y += 10;

  SECTIONS.forEach(({ title, value }) => {
    const rows = [];
    collectRows(value(pack), rows);

    if (y + 14 > pageBottom) {
      doc.addPage();
      y = margin;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(31, 141, 61);
    doc.text(title, margin, y);
    y += 2;
    doc.setDrawColor(40, 167, 69);
    doc.setLineWidth(0.35);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    if (!rows.length) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      y = addWrappedText(doc, 'No content available.', margin, y, contentWidth, 5, pageBottom);
      y += 4;
      return;
    }

    rows.forEach((row) => {
      const x = margin + Math.min(row.depth, 5) * 4;
      if (row.value) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        y = addWrappedText(doc, `${row.label}:`, x, y, contentWidth - (x - margin), 4.7, pageBottom);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(51, 65, 85);
        y = addWrappedText(doc, row.value, x + 3, y, contentWidth - (x - margin) - 3, 4.7, pageBottom);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(row.depth === 0 ? 10 : 9.5);
        doc.setTextColor(row.depth === 0 ? 31 : 51, row.depth === 0 ? 141 : 65, row.depth === 0 ? 61 : 85);
        y = addWrappedText(doc, row.label, x, y, contentWidth - (x - margin), 5, pageBottom);
      }
      y += 1.5;
    });
    y += 4;
  });

  const filenameBusinessId = String(businessId || 'business').replace(/[^a-z0-9_-]/gi, '-');
  doc.save(`persona-pack-${filenameBusinessId}.pdf`);
}
