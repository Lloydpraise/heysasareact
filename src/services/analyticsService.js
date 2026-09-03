import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────
// Real, live analyticsService.js — replaces the mockDashboardData stub.
// Every field below is computed from actual Supabase tables/views,
// confirmed against the real schema (v_lead_summary, v_ad_leaderboard,
// messages, follow_up_queue, conversions, sentiment_snapshots).
//
// Two fields have flagged TODOs where the real data contract wasn't
// confirmed — see inline comments. They fail safe (empty/zero), not fake.
// ─────────────────────────────────────────────────────────────────────────

const OBJECTION_COLORS = {
  price: '#ef4444',
  not_ready: '#f59e0b',
  found_elsewhere: '#3b82f6',
  needs_more_info: '#94a3b8',
  trust_concerns: '#8b5cf6',
  size_availability: '#ec4899',
};

function labelize(s) {
  return (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function reportMetricError(metric, error) {
  console.error(`[analyticsService] ${metric} did not load live data:`, error);
}

// ── Funnel + state breakdown + demand + market intelligence, all sourced
// from one v_lead_summary fetch (cheapest way to get everything that lives
// per-lead without re-querying the same view five times) ──────────────────
async function getLeadBasedMetrics(businessId) {
  const { data: leads, error } = await supabase
    .from('v_lead_summary')
    .select(
      'id, lead_state, lead_type, unread_count, product_interests, sent_voice_note, sent_media, sent_reaction, intent_score, objection_tags, competitor_mentions, pre_purchase_questions, read_receipt, follow_up_opted_in, consent_message_sent_at'
    )
    .eq('business_id', businessId);

  if (error || !leads) {
    reportMetricError('lead metrics', error || new Error('No rows returned'));
    return null;
  }

  const business = leads.filter((l) => l.lead_type === 'business');
  const total = leads.length;

  // ── Funnel: Total / Business / Showed interest / Converted.
  // "Replied" gets filled in later once we know which contacts actually
  // sent an inbound message (see getRepliedContactIds below) — funnel[2]
  // is patched in from the caller.
  const showedInterest = business.filter((l) => (l.product_interests || []).length > 0).length;

  // ── State breakdown ──
  const stateCounts = {};
  for (const l of business) {
    stateCounts[l.lead_state] = (stateCounts[l.lead_state] || 0) + 1;
  }
  const stateBreakdown = Object.entries(stateCounts).map(([label, count]) => ({ label: labelize(label), count }));

  // ── Product demand + combos ──
  const demandCounts = {};
  const comboCounts = {};
  for (const l of business) {
    const interests = [...new Set(l.product_interests || [])];
    for (const p of interests) demandCounts[p] = (demandCounts[p] || 0) + 1;
    for (let i = 0; i < interests.length; i++) {
      for (let j = i + 1; j < interests.length; j++) {
        const key = [interests[i], interests[j]].sort().join('|||');
        comboCounts[key] = (comboCounts[key] || 0) + 1;
      }
    }
  }
  const productDemand = Object.entries(demandCounts)
    .map(([label, count]) => ({ label: labelize(label), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const productCombos = Object.entries(comboCounts)
    .map(([key, count]) => { const [a, b] = key.split('|||'); return { a: labelize(a), b: labelize(b), count }; })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // ── Market intelligence: objections, competitors, questions ──
  const objectionCounts = {};
  const competitorCounts = {};
  const questionCounts = {};
  for (const l of business) {
    for (const tag of l.objection_tags || []) objectionCounts[tag] = (objectionCounts[tag] || 0) + 1;
    for (const name of l.competitor_mentions || []) competitorCounts[name] = (competitorCounts[name] || 0) + 1;
    for (const q of l.pre_purchase_questions || []) {
      const key = q.trim().toLowerCase();
      if (!key) continue;
      questionCounts[key] = questionCounts[key] || { question: q.trim(), count: 0 };
      questionCounts[key].count++;
    }
  }
  const totalObjections = Object.values(objectionCounts).reduce((a, b) => a + b, 0);
  const objections = Object.entries(objectionCounts)
    .map(([label, count]) => ({
      label: labelize(label),
      count,
      pct: totalObjections ? Math.round((count / totalObjections) * 100) : 0,
      color: OBJECTION_COLORS[label] || '#94a3b8',
    }))
    .sort((a, b) => b.count - a.count);
  const competitorMentions = Object.entries(competitorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const questionList = Object.values(questionCounts).sort((a, b) => b.count - a.count).slice(0, 8);
  const maxQ = questionList[0]?.count || 1;
  const topQuestions = questionList.map((q) => ({ ...q, pct: Math.round((q.count / maxQ) * 100) }));

  // ── Health signals sourced straight from v_lead_summary ──
  const readReceiptCounts = { sent: 0, delivered: 0, read: 0, replied: 0 };
  for (const l of business) {
    if (readReceiptCounts[l.read_receipt] !== undefined) readReceiptCounts[l.read_receipt]++;
  }
  const voiceNoteLeads = business.filter((l) => l.sent_voice_note).length;
  const mediaLeads = business.filter((l) => l.sent_media).length;
  const reactionCount = business.filter((l) => l.sent_reaction).length;
  const askedConsent = business.filter((l) => l.consent_message_sent_at).length;
  const optedIn = business.filter((l) => l.consent_message_sent_at && l.follow_up_opted_in).length;
  const consentAcceptRate = askedConsent ? Math.round((optedIn / askedConsent) * 100) : 0;
  const openUnread = business.filter((l) => l.unread_count > 0).length;
  const goneCold = business.filter((l) => ['stalled', 'ghosted'].includes(l.lead_state)).length;
  const pctGoneCold = business.length ? Math.round((goneCold / business.length) * 100) : 0;

  return {
    total, business, showedInterest, stateBreakdown, productDemand, productCombos,
    topQuestions, objections, competitorMentions, readReceiptCounts,
    voiceNoteLeads, mediaLeads, reactionCount, consentAcceptRate, openUnread, pctGoneCold,
  };
}

// ── Which business-lead contacts have ever sent an inbound message —
// this is the ground truth for "Replied" (funnel) and "never replied"
// (Health), computed once and reused for both instead of two separate
// heavy queries. ──────────────────────────────────────────────────────────
async function getRepliedContactIds(businessId, businessContactIds) {
  if (!businessContactIds.length) return new Set();
  const { data, error } = await supabase
    .from('messages')
    .select('contact_id')
    .eq('business_id', businessId)
    .eq('direction', 'in')
    .in('contact_id', businessContactIds);

  if (error || !data) {
    reportMetricError('replied contacts', error || new Error('No rows returned'));
    return new Set();
  }
  return new Set(data.map((m) => m.contact_id));
}

// ── Weekly new-lead trend, from each contact's earliest message.
// TODO: if `contacts.created_at` is confirmed to exist, switch to a direct
// aggregate on that column instead — this in-memory bucketing works fine
// at pilot scale but won't scale past a few thousand messages cleanly. ────
async function getWeeklyTrend(businessId, weeks = 8) {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const { data, error } = await supabase
    .from('messages')
    .select('contact_id, created_at')
    .eq('business_id', businessId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data) {
    reportMetricError('weekly trend', error || new Error('No rows returned'));
    return [];
  }

  const firstTouch = {};
  for (const m of data) {
    if (!firstTouch[m.contact_id]) firstTouch[m.contact_id] = m.created_at;
  }

  const buckets = Array.from({ length: weeks }, () => 0);
  for (const ts of Object.values(firstTouch)) {
    const idx = Math.floor((new Date(ts) - since) / (7 * 24 * 3600 * 1000));
    if (idx >= 0 && idx < weeks) buckets[idx]++;
  }
  return buckets.map((count, i) => ({ week: `W${i + 1}`, new: count }));
}

// ── Sentiment trend from the sentiment_snapshots log table ────────────────
async function getSentimentTrend(businessId, weeks = 8) {
  const since = new Date();
  since.setDate(since.getDate() - weeks * 7);

  const { data, error } = await supabase
    .from('sentiment_snapshots')
    .select('sentiment_score, created_at')
    .eq('business_id', businessId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (error || !data?.length) {
    if (error) reportMetricError('sentiment trend', error);
    return [];
  }

  const buckets = {};
  for (const s of data) {
    const idx = Math.floor((new Date(s.created_at) - since) / (7 * 24 * 3600 * 1000));
    buckets[idx] = buckets[idx] || [];
    buckets[idx].push(s.sentiment_score);
  }
  return Object.keys(buckets)
    .sort((a, b) => Number(a) - Number(b))
    .map((idx, i) => {
      const scores = buckets[idx];
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      return { week: `W${i + 1}`, score: (avg + 1) / 2 }; // normalize -1..1 -> 0..1
    });
}

// ── Heatmap + intent peak hour/day, from inbound messages + intent scores ─
async function getTimingMetrics(businessId, intentByContact) {
  const { data, error } = await supabase
    .from('messages')
    .select('contact_id, created_at')
    .eq('business_id', businessId)
    .eq('direction', 'in');

  if (error || !data) {
    reportMetricError('timing metrics', error || new Error('No rows returned'));
    return { heatmap: Array.from({ length: 7 }, () => Array(24).fill(0)), intentPeakHour: null, intentPeakDay: null };
  }

  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  const hourWeights = Array(24).fill(0);
  const dayWeights = Array(7).fill(0);
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (const m of data) {
    const d = new Date(m.created_at);
    const jsDay = d.getDay(); // 0=Sun..6=Sat
    const row = jsDay === 0 ? 6 : jsDay - 1; // convert to Mon..Sun row index
    const hour = d.getHours();
    grid[row][hour]++;

    const score = intentByContact[m.contact_id];
    if (score >= 70) {
      hourWeights[hour]++;
      dayWeights[jsDay]++;
    }
  }

  const peakHour = hourWeights.some((v) => v > 0) ? hourWeights.indexOf(Math.max(...hourWeights)) : null;
  const peakDayIdx = dayWeights.some((v) => v > 0) ? dayWeights.indexOf(Math.max(...dayWeights)) : null;

  return { heatmap: grid, intentPeakHour: peakHour, intentPeakDay: peakDayIdx !== null ? DOW[peakDayIdx] : null };
}

// ── Lead response time distribution: time from business's first outbound
// message to that contact's first reply after it. ─────────────────────────
async function getResponseDistribution(businessId) {
  const { data, error } = await supabase
    .from('messages')
    .select('contact_id, direction, created_at')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    reportMetricError('response distribution', error || new Error('No rows returned'));
    return [];
  }

  const byContact = {};
  for (const m of data) {
    byContact[m.contact_id] = byContact[m.contact_id] || [];
    byContact[m.contact_id].push(m);
  }

  const buckets = { '< 2 min': 0, '2\u201310 min': 0, '10\u201330 min': 0, '30\u201360 min': 0, '1\u20136 hrs': 0, '6+ hrs': 0 };
  let totalMinutes = 0;
  let sampleCount = 0;

  for (const msgs of Object.values(byContact)) {
    const firstOut = msgs.find((m) => m.direction === 'out');
    if (!firstOut) continue;
    const reply = msgs.find((m) => m.direction === 'in' && new Date(m.created_at) > new Date(firstOut.created_at));
    if (!reply) continue;

    const minutes = (new Date(reply.created_at) - new Date(firstOut.created_at)) / 60000;
    totalMinutes += minutes;
    sampleCount++;

    if (minutes < 2) buckets['< 2 min']++;
    else if (minutes < 10) buckets['2\u201310 min']++;
    else if (minutes < 30) buckets['10\u201330 min']++;
    else if (minutes < 60) buckets['30\u201360 min']++;
    else if (minutes < 360) buckets['1\u20136 hrs']++;
    else buckets['6+ hrs']++;
  }

  return {
    dist: Object.entries(buckets).map(([bucket, count]) => ({ bucket, count })),
    avgReplyTimeMin: sampleCount ? Math.round(totalMinutes / sampleCount) : null,
  };
}

// ── Ad leaderboard, straight off v_ad_leaderboard ──────────────────────────
async function getAdLeaderboard(businessId) {
  const { data, error } = await supabase
    .from('v_ad_leaderboard')
    .select('*')
    .eq('business_id', businessId)
    .order('quality_score', { ascending: false });

  if (error || !data) {
    reportMetricError('ad leaderboard', error || new Error('No rows returned'));
    return [];
  }

  return data.map((a) => ({
    ad_id: a.ad_id,
    platform: a.ad_platform,
    headline: a.ad_headline,
    body: a.ad_body_preview,
    thumbnail: a.ad_thumbnail_url,
    lead_count: a.lead_count,
    reply_count: a.reply_count,
    product_interest_count: a.product_interest_count,
    conversion_count: a.conversion_count,
    quality_score: a.quality_score,
    cycle_days_avg: a.cycle_days_avg,
  }));
}

// ── Delivery failures + AI vs human closes ─────────────────────────────────
async function getDeliveryFailures(businessId) {
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('direction', 'out')
    .eq('status', 'ERROR');
  if (error) {
    reportMetricError('delivery failures', error);
    return 0;
  }
  return count || 0;
}

async function getHumanVsAiClose(businessId) {
  const { data, error } = await supabase.from('conversions').select('closed_by').eq('business_id', businessId);
  if (error || !data) {
    reportMetricError('AI versus human closes', error || new Error('No rows returned'));
    return { ai: 0, human: 0 };
  }
  return {
    ai: data.filter((c) => c.closed_by === 'ai').length,
    human: data.filter((c) => c.closed_by === 'human').length,
  };
}

async function getConvertedContactCount(businessId) {
  const { data, error } = await supabase.from('conversions').select('contact_id').eq('business_id', businessId);
  if (error || !data) {
    reportMetricError('converted contacts', error || new Error('No rows returned'));
    return 0;
  }
  return new Set(data.map((c) => c.contact_id)).size;
}

// ── Follow-up step performance.
// TODO: follow_up_queue's real `status` value vocabulary was never
// confirmed (asked for `SELECT status, count(*) FROM follow_up_queue
// GROUP BY status` earlier, no result seen yet). Until confirmed, this
// only reports real, safe data — how many follow-ups were queued per
// step — and leaves replies/conversions at 0 rather than guessing string
// literals that might not match and would silently misreport. ────────────
async function getFollowupStepPerformance(businessId) {
  const { data, error } = await supabase
    .from('follow_up_queue')
    .select('follow_up_number, touchpoint_type, status')
    .eq('business_id', businessId);

  if (error || !data) {
    reportMetricError('follow-up performance', error || new Error('No rows returned'));
    return [];
  }

  const counts = {};
  for (const row of data) {
    const step = row.follow_up_number;
    counts[step] = counts[step] || { step, name: labelize(row.touchpoint_type) || `Step ${step}`, replies: 0, conversions: 0, queued: 0 };
    counts[step].queued++;
  }
  return Object.values(counts).sort((a, b) => a.step - b.step);
}

// ─────────────────────────────────────────────────────────────────────────
export const getDashboardMetrics = async (businessId) => {
  if (!supabase) {
    console.error('[analyticsService] Live analytics unavailable: configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
    return null;
  }

  try {
    const leadMetrics = await getLeadBasedMetrics(businessId);
    if (!leadMetrics) return null;

    const businessContactIds = leadMetrics.business.map((l) => l.id);
    const repliedIds = await getRepliedContactIds(businessId, businessContactIds);
    const convertedCount = await getConvertedContactCount(businessId);

    const intentByContact = {};
    for (const l of leadMetrics.business) intentByContact[l.id] = l.intent_score;

    const metricNames = ['weeklyTrend', 'sentimentTrend', 'timing', 'responseData', 'adLeaderboard', 'deliveryFailures', 'humanVsAiClose', 'followupStepConversion'];
    const metricPromises = [
      getWeeklyTrend(businessId),
      getSentimentTrend(businessId),
      getTimingMetrics(businessId, intentByContact),
      getResponseDistribution(businessId),
      getAdLeaderboard(businessId),
      getDeliveryFailures(businessId),
      getHumanVsAiClose(businessId),
      getFollowupStepPerformance(businessId),
    ];
    const metricResults = await Promise.all(metricPromises.map((promise, index) => promise.catch((error) => {
      console.error(`[analyticsService] ${metricNames[index]} failed; this section may be incomplete:`, error);
      return undefined;
    })));
    const [weeklyTrend, sentimentTrend, timing, responseData, adLeaderboard, deliveryFailures, humanVsAiClose, followupStepConversion] = metricResults;

    for (const [index, result] of metricResults.entries()) {
      if (result === undefined) console.warn(`[analyticsService] No live data returned for ${metricNames[index]}.`);
    }

    const funnel = [
      { stage: 'Total contacts', count: leadMetrics.total },
      { stage: 'Business leads', count: leadMetrics.business.length },
      { stage: 'Replied', count: repliedIds.size },
      { stage: 'Showed interest', count: leadMetrics.showedInterest },
      { stage: 'Converted', count: convertedCount },
    ];

    const neverReplied = leadMetrics.business.length
      ? Math.round(((leadMetrics.business.length - repliedIds.size) / leadMetrics.business.length) * 100)
      : 0;

    const optOutCount = leadMetrics.business.filter((l) => l.follow_up_opted_in === false && l.consent_message_sent_at).length;

    return {
      funnel,
      weeklyTrend,
      stateBreakdown: leadMetrics.stateBreakdown,
      topQuestions: leadMetrics.topQuestions,
      competitorMentions: leadMetrics.competitorMentions,
      objections: leadMetrics.objections,
      sentimentTrend,
      adLeaderboard,
      productDemand: leadMetrics.productDemand,
      productCombos: leadMetrics.productCombos,
      heatmap: timing?.heatmap || [],
      intentPeakHour: timing?.intentPeakHour ?? null,
      intentPeakDay: timing?.intentPeakDay ?? null,
      leadResponseDist: responseData?.dist || [],
      convHealth: {
        avg_reply_time_min: responseData?.avgReplyTimeMin ?? null,
        open_unread: leadMetrics.openUnread,
        pct_ai_managed: null, // TODO: needs conversations.ai_enabled joined per business lead — not wired yet
        pct_gone_cold: leadMetrics.pctGoneCold,
        pct_never_replied: neverReplied,
        opt_out_count: optOutCount,
      },
      readReceipts: leadMetrics.readReceiptCounts,
      deliveryFailures,
      humanVsAiClose: humanVsAiClose || { ai: 0, human: 0 },
      followupStepConversion: followupStepConversion || [],
      voiceNoteLeads: leadMetrics.voiceNoteLeads,
      mediaLeads: leadMetrics.mediaLeads,
      reactionCount: leadMetrics.reactionCount,
      consentAcceptRate: leadMetrics.consentAcceptRate,
    };
  } catch (error) {
    console.error('[analyticsService] getDashboardMetrics failed:', error);
    return null;
  }
};