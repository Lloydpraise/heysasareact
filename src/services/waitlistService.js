const BACKEND_API_URL = (import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function readUtmParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    fbclid: params.get('fbclid') || undefined,
    ref: params.get('ref') || undefined,
  };
}

// company_website_hp is a honeypot: a field a real visitor never sees or
// fills (see WaitlistModal.jsx), read by nothing but bots that fill
// every input on a page. Any value in it and the backend silently
// discards the submission instead of writing it.
export async function submitWaitlistSignup({ name, business, industry, phone, website, honeypot }) {
  const res = await fetch(`${BACKEND_API_URL}/public/waitlist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name, business, industry, phone, website: website || undefined,
      company_website_hp: honeypot || undefined,
      ...readUtmParams(),
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.ok) {
    throw new Error(mapError(body.error));
  }
  return { position: body.position, refCode: body.refCode };
}

function mapError(code) {
  switch (code) {
    case 'name_required': return 'Please enter your name.';
    case 'business_required': return 'Please enter your business name.';
    case 'industry_invalid': return 'Please choose your industry.';
    case 'phone_invalid': return "That doesn't look like a Kenyan mobile number.";
    case 'website_invalid': return "That website doesn't look right — try just the domain, e.g. mybrand.co.ke.";
    case 'too_many_requests': return 'Too many attempts — please wait a bit and try again.';
    default: return "Something went wrong on our end — please try again in a moment.";
  }
}
