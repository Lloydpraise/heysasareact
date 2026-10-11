// One-click campaign setup for a list. An ad list gets a ready-made three-message follow-up built around the ad the
// leads clicked. The messages are examples: with "Let AI rewrite" on (it is), the backend rewrites each one for the
// individual lead using the ad's headline and text, so every message refers to what that person actually asked about.

const MAX_HEADLINE = 60;

function shortHeadline(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'our ad';
  return clean.length > MAX_HEADLINE ? `${clean.slice(0, MAX_HEADLINE - 1).trimEnd()}…` : clean;
}

export function buildCampaignPreset(list) {
  if (!list) return null;

  if (list.type === 'ad') {
    const headline = shortHeadline(list.adHeadline || list.name);
    return {
      listIds: [list.id],
      name: `${headline} follow-up`,
      aiRewriteEnabled: true,
      // Review-first: every drafted message waits for approval until the owner has seen how the AI writes for this ad.
      autoApprove: false,
      ad: { headline, platform: list.adPlatform || '' },
      steps: [
        { content: `Hi {{first_name}}, thanks for reaching out about "${headline}". What would you like to know? I can help you right away.`, gapHours: 0, media: null },
        { content: `Hi {{first_name}}, just checking in about "${headline}". Happy to answer any questions or share more details.`, gapHours: 48, media: null },
        { content: `Hi {{first_name}}, last note from me about "${headline}". If you are still interested, reply here and I will sort you out.`, gapHours: 72, media: null },
      ],
    };
  }

  return { listIds: [list.id], name: '', steps: null };
}
