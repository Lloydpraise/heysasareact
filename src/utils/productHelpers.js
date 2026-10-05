// Small pure helpers for the Products page. The name matching mirrors the backend's
// product discovery (heysasa-backend/src/productDiscovery.js) so an uploaded product and a
// product found in chats are recognised as the same thing.

const STOP_WORDS = new Set(['the', 'a', 'an', 'of', 'and', 'for', 'with', 'set', 'pcs', 'pc', 'piece', 'pieces', 'new', 'kes', 'ksh', 'kshs']);
const MATCH_THRESHOLD = 0.88;

export function normalizeName(value) {
  return String(value ?? '')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function singular(token) {
  if (token.length > 3 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 4 && /(shes|ches|xes|zes|sses)$/.test(token)) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss')) return token.slice(0, -1);
  return token;
}

export function nameTokens(value) {
  const tokens = normalizeName(value).split(' ').filter(Boolean).filter((t) => !STOP_WORDS.has(t)).map(singular);
  return [...new Set(tokens)];
}

export function dedupeKey(value) {
  const tokens = nameTokens(value);
  return tokens.length ? [...tokens].sort().join(' ') : normalizeName(value);
}

export function nameSimilarity(a, b) {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (!ta.length || !tb.length) return 0;
  const sb = new Set(tb);
  const inter = ta.filter((t) => sb.has(t)).length;
  if (!inter) return 0;
  const union = new Set([...ta, ...tb]).size;
  const jaccard = inter / union;
  if (Math.min(ta.length, tb.length) === 1) return jaccard;
  const containment = inter / Math.min(ta.length, tb.length);
  return 0.5 * jaccard + 0.5 * containment;
}

export function findMatchingProduct(name, products, threshold = MATCH_THRESHOLD) {
  let best = null;
  for (const product of products) {
    const names = [product.title, ...(Array.isArray(product.aliases) ? product.aliases : [])].filter(Boolean);
    for (const candidate of names) {
      const score = nameSimilarity(name, candidate);
      if (score >= threshold && (!best || score > best.score)) best = { product, score };
    }
  }
  return best?.product || null;
}

// "KES 1,500", "1.5k", "Ksh1500/=" -> 1500. Ranges and junk -> null.
export function parsePrice(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 && value < 1e8 ? Math.round(value * 100) / 100 : null;
  let s = String(value).toLowerCase().trim();
  if (/\d\s*[-–]\s*\d/.test(s)) return null;
  s = s.replace(/\b(kes|ksh|kshs|sh|shs|usd|eur|gbp|bob)\b\.?/g, '').replace(/[$€£]/g, '').replace(/[/=]+-?\s*$/g, '').trim();
  const kilo = s.match(/^(\d+(?:\.\d+)?)\s*k$/);
  if (kilo) return parsePrice(Number(kilo[1]) * 1000);
  s = s.replace(/(\d)[,\s](?=\d{3}(\D|$))/g, '$1');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return parsePrice(Number(s));
}

export function newProductId() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return `prd_${[...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}

export function cleanCategory(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  const clipped = text.slice(0, 40);
  return clipped.charAt(0).toUpperCase() + clipped.slice(1);
}

export function formatMoney(value, currency = 'KES') {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return '';
  const n = Number(value);
  try {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency, maximumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString('en-KE')}`;
  }
}

// "Active for AI" = approved by the owner AND switched on for the AI.
export const isActiveForAi = (p) => p.status === 'approved' && p.ai_visible !== false;

export function sourceLabel(source) {
  switch (source) {
    case 'chat': return 'Found in chats';
    case 'image': return 'Found in a photo you sent';
    case 'chat_image': return 'Found in chats and photos';
    case 'csv': return 'Imported from a spreadsheet';
    case 'xml': return 'Imported from XML';
    case 'manual': return 'Added by you';
    case 'shopify': return 'From your store';
    default: return '';
  }
}

export function confidenceLabel(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return null;
  if (v >= 0.7) return { text: 'Very likely yours', tone: 'high' };
  if (v >= 0.5) return { text: 'Likely yours', tone: 'mid' };
  return { text: 'Check this one', tone: 'low' };
}

// Colour for a text-only product tile, stable per category so groups look like groups.
const TILE_TONES = [
  // light-dark() follows the html color-scheme, so tiles re-tone in dark mode.
  ['light-dark(#E8F6EC, #12301f)', 'light-dark(#1f8d3d, #6fdc8c)'], ['light-dark(#FFF1DD, #35240d)', 'light-dark(#B45F00, #ffb454)'],
  ['light-dark(#E7F0FB, #12233d)', 'light-dark(#2B5C9E, #8fbcf5)'], ['light-dark(#F5E9F7, #2a1a33)', 'light-dark(#7B3E8C, #d2a3e0)'],
  ['light-dark(#FBEAEA, #351618)', 'light-dark(#A34040, #f29b9b)'], ['light-dark(#EEF2E3, #232a14)', 'light-dark(#5C6B2A, #bccf86)'],
];
export function tileTone(key) {
  const text = String(key || 'none');
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return TILE_TONES[h % TILE_TONES.length];
}
