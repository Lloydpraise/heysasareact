// Small formatting helpers ported from analytics.js's pct()/comma() +
// infoIcon() pattern (the icon itself is now a real component, see
// shared/InfoTooltip.jsx — this file just keeps the two number formatters).

export function pct(n, d) {
  return d ? Math.round((n / d) * 100) : 0;
}

export function comma(n) {
  return n?.toLocaleString() ?? '0';
}