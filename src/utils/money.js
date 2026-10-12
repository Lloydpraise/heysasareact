// Short money for dashboards: 850 -> "KES 850", 12,400 -> "KES 12.4k", 1,250,000 -> "KES 1.25M".
export function moneyShort(value, currency = 'KES') {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  let text;
  if (abs >= 1e6) text = `${trim(n / 1e6, abs >= 1e7 ? 1 : 2)}M`;
  else if (abs >= 1e4) text = `${trim(n / 1e3, 1)}k`;
  else text = Math.round(n).toLocaleString();
  return `${currency} ${text}`;
}

function trim(n, digits) {
  return String(Number(n.toFixed(digits)));
}
