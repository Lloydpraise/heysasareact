// Mock payload matching analyticsService.js's getDashboardMetrics() return
// shape exactly, field-for-field. Swap for the live call in useAnalytics.js
// once wired — no section component needs to change, since they all read
// from the same context shape either way.
//
// NOTE ON STALENESS: topQuestions/objections/competitorMentions/
// sentimentTrend come from business_analytics_cache in the real service,
// refreshed by an enrichment worker every ~30min. The live service doesn't
// currently return *when* that cache was last written — only the values.
// To power a real "updated Xm ago" badge on those cards, analyticsService.js
// would need one extra field, e.g.:
//   cacheUpdatedAt: cache.updated_at || null
// The mock below includes it so the UI is built for it; until the real
// service adds it, that badge will simply stay hidden (see AnCard.jsx).

export const MOCK_ANALYTICS = {
  funnel: [
    { stage: 'Total contacts', count: 214 },
    { stage: 'Business leads', count: 178 },
    { stage: 'Replied', count: 132 },
    { stage: 'Showed interest', count: 61 },
    { stage: 'Converted', count: 19 },
  ],
  weeklyTrend: [
    { week: 'W1', new: 12 }, { week: 'W2', new: 18 }, { week: 'W3', new: 15 }, { week: 'W4', new: 22 },
    { week: 'W5', new: 19 }, { week: 'W6', new: 27 }, { week: 'W7', new: 24 }, { week: 'W8', new: 31 },
  ],
  stateBreakdown: [
    { label: 'Engaged', count: 34 }, { label: 'New', count: 46 }, { label: 'Warm', count: 28 },
    { label: 'Stalled', count: 22 }, { label: 'Ghosted', count: 18 }, { label: 'Won', count: 19 }, { label: 'Lost', count: 11 },
  ],
  topQuestions: [
    { question: 'Do you offer installment payments?', count: 41, pct: 100 },
    { question: 'How long does installation take?', count: 33, pct: 80 },
    { question: 'Do you do home visits?', count: 27, pct: 66 },
    { question: 'Is there a warranty?', count: 19, pct: 46 },
    { question: 'Can I see past work / photos?', count: 14, pct: 34 },
  ],
  competitorMentions: [
    { name: 'Jumia', context: 'pricing', count: 22 },
    { name: 'Davis & Shirtliff', context: 'brand trust', count: 9 },
    { name: 'Local installer', context: 'convenience', count: 6 },
  ],
  objections: [
    { label: 'Price', pct: 52, count: 31, color: '#ef4444' },
    { label: 'Not ready yet', pct: 24, count: 14, color: '#f59e0b' },
    { label: 'Needs approval', pct: 14, count: 8, color: '#3b82f6' },
    { label: 'Trust / unsure', pct: 10, count: 6, color: '#94a3b8' },
  ],
  sentimentTrend: [
    { week: 'W1', score: 0.58 }, { week: 'W2', score: 0.61 }, { week: 'W3', score: 0.55 }, { week: 'W4', score: 0.64 },
    { week: 'W5', score: 0.67 }, { week: 'W6', score: 0.63 }, { week: 'W7', score: 0.7 }, { week: 'W8', score: 0.72 },
  ],
  adLeaderboard: [
    { ad_id: 'ad_001', platform: 'Meta', headline: '30% off classic lash sets', body: 'Book today and save.', thumbnail: null, lead_count: 58, reply_count: 41, product_interest_count: 30, conversion_count: 7, quality_score: 82, cycle_days_avg: 3.2 },
    { ad_id: 'ad_002', platform: 'Meta', headline: 'Volume lashes — book this week', body: 'Full volume sets.', thumbnail: null, lead_count: 34, reply_count: 20, product_interest_count: 14, conversion_count: 3, quality_score: 68, cycle_days_avg: 4.1 },
  ],
  productDemand: [
    { label: 'classic_lashes', count: 30 }, { label: 'volume_lashes', count: 24 },
    { label: 'hybrid_lashes', count: 18 }, { label: 'lash_lift', count: 11 }, { label: 'gift_voucher', count: 6 },
  ],
  productCombos: [
    { a: 'classic_lashes', b: 'lash_lift', count: 8 },
    { a: 'volume_lashes', b: 'gift_voucher', count: 4 },
  ],
  heatmap: Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 6))),
  intentPeakHour: 17,
  intentPeakDay: 'Saturday',
  leadResponseDist: [
    { bucket: '< 2 min', count: 22 }, { bucket: '2\u201310 min', count: 34 }, { bucket: '10\u201330 min', count: 28 },
    { bucket: '30\u201360 min', count: 15 }, { bucket: '1\u20136 hrs', count: 12 }, { bucket: '6+ hrs', count: 9 },
  ],
  convHealth: {
    avg_reply_time_min: 14,
    open_unread: 8,
    pct_ai_managed: 71,
    pct_gone_cold: 12,
    pct_never_replied: 21,
    opt_out_count: 4,
  },
  readReceipts: { sent: 178, delivered: 165, read: 142, replied: 96 },
  deliveryFailures: 3,
  humanVsAiClose: { ai: 12, human: 7 },
  followupStepConversion: [
    { step: 1, name: 'First Impression', replies: 22, conversions: 2 },
    { step: 2, name: 'Social Proof', replies: 18, conversions: 3 },
    { step: 3, name: 'Free Value', replies: 15, conversions: 1 },
    { step: 4, name: 'Expert Insight', replies: 11, conversions: 2 },
    { step: 5, name: 'Personalised Offer', replies: 14, conversions: 4 },
    { step: 6, name: 'New Angle', replies: 8, conversions: 1 },
    { step: 7, name: 'Deep Expertise', replies: 6, conversions: 0 },
    { step: 8, name: 'FOMO', replies: 9, conversions: 2 },
    { step: 9, name: 'Check In', replies: 7, conversions: 1 },
    { step: 10, name: 'Final Offer', replies: 5, conversions: 2 },
    { step: 11, name: 'See You Around', replies: 2, conversions: 1 },
  ],
  voiceNoteLeads: 14,
  mediaLeads: 27,
  reactionCount: 9,
  consentAcceptRate: 64,
  cacheUpdatedAt: new Date(Date.now() - 12 * 60000).toISOString(),
};