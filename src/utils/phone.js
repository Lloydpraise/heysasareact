// Mirrors src/utils/phone.js on the backend exactly — this copy only
// gives the visitor instant feedback while typing; the backend is the
// real authority and re-validates on submit regardless.
export function normalizeKenyanPhone(input) {
  if (!input) return null;
  const digitsOnly = String(input).replace(/[^\d+]/g, '');
  const stripped = digitsOnly.replace(/^\+/, '');

  let national;
  if (stripped.startsWith('254') && stripped.length === 12) {
    national = stripped.slice(3);
  } else if (stripped.startsWith('0') && stripped.length === 10) {
    national = stripped.slice(1);
  } else if (stripped.length === 9) {
    national = stripped;
  } else {
    return null;
  }

  if (!/^[71]\d{8}$/.test(national)) return null;
  return `254${national}`;
}
