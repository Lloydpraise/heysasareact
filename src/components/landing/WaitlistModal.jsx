import { useEffect, useRef, useState } from 'react';
import { X, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { normalizeKenyanPhone } from '../../utils/phone';
import { submitWaitlistSignup } from '../../services/waitlistService';

const INDUSTRIES = [
  { value: '', label: 'Select your industry' },
  { value: 'beauty_wellness', label: 'Beauty & Wellness' },
  { value: 'retail_ecommerce', label: 'Retail / E-commerce' },
  { value: 'restaurant_food', label: 'Restaurant / Food' },
  { value: 'fashion_apparel', label: 'Fashion & Apparel' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'education', label: 'Education' },
  { value: 'health_medical', label: 'Health / Medical' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'other', label: 'Other' },
];

export default function WaitlistModal({ open, onClose }) {
  const [name, setName] = useState('');
  const [business, setBusiness] = useState('');
  const [industry, setIndustry] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const dialogRef = useRef(null);

  const normalizedPhone = normalizeKenyanPhone(phone);
  const phoneIsValid = !!normalizedPhone;

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      dialogRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setName('');
        setBusiness('');
        setIndustry('');
        setPhone('');
        setWebsite('');
        setPhoneTouched(false);
        setError('');
        setSubmitting(false);
        setResult(null);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (name.trim().length < 2) {
      return setError('Please enter your name.');
    }

    if (business.trim().length < 2) {
      return setError('Please enter your business name.');
    }

    if (!industry) {
      return setError('Please choose your industry.');
    }

    if (!phoneIsValid) {
      setPhoneTouched(true);
      return setError("That doesn't look like a Kenyan mobile number.");
    }

    setSubmitting(true);

    try {
      const outcome = await submitWaitlistSignup({
        name: name.trim(),
        business: business.trim(),
        industry,
        phone: normalizedPhone,
        website: website.trim(),
        honeypot,
      });

      setResult(outcome);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const shareLink = result?.refCode
    ? `https://heysasa.co.ke/?ref=${result.refCode}`
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-modal-title"
        className="relative w-full max-w-md rounded-t-[2rem] border border-white/80 bg-white/95 p-6 shadow-2xl backdrop-blur-xl outline-none sm:rounded-[2rem] sm:p-8"
        style={{
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>

        {!result ? (
          <>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#28A745]">
              Get early access
            </p>

            <h2
              id="waitlist-modal-title"
              className="mb-2 text-2xl font-bold tracking-tight text-slate-900"
            >
              Let's find the gold in your WhatsApp.
            </h2>

            <p className="mb-6 text-sm leading-relaxed text-slate-500">
              Join the list and we'll contact you on WhatsApp when it's your
              turn to experience HeySasa on your business.
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Honeypot */}
              <input
                type="text"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-px w-px opacity-0"
              />

              <label className="block text-sm font-semibold text-slate-700">
                Your name
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Wanjiru"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-[#28A745] focus:ring-4 focus:ring-[#28A745]/10"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Business name
                <input
                  required
                  value={business}
                  onChange={(e) => setBusiness(e.target.value)}
                  placeholder="Lashes by Shazz"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-[#28A745] focus:ring-4 focus:ring-[#28A745]/10"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                What type of business do you run?
                <select
                  required
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-[#28A745] focus:ring-4 focus:ring-[#28A745]/10"
                >
                  {INDUSTRIES.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.value === ''}
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                WhatsApp number
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder="07XX XXX XXX"
                  className={`mt-1.5 h-11 w-full rounded-xl border bg-white px-4 outline-none transition focus:ring-4 ${
                    phoneTouched && phone && !phoneIsValid
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-slate-200 focus:border-[#28A745] focus:ring-[#28A745]/10'
                  }`}
                />

                {phoneTouched && phone && !phoneIsValid && (
                  <span className="mt-1 block text-xs font-medium text-red-500">
                    Enter a valid Safaricom, Airtel or Telkom number.
                  </span>
                )}
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Website{' '}
                <span className="font-normal text-slate-400">
                  (optional)
                </span>

                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="yourbrand.co.ke"
                  className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-[#28A745] focus:ring-4 focus:ring-[#28A745]/10"
                />
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600"
                >
                  {error}
                </p>
              )}

              <button
                disabled={submitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#28A745] font-bold text-white shadow-lg shadow-[#28A745]/25 transition hover:bg-[#218838] disabled:cursor-wait disabled:opacity-60"
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {submitting ? 'Getting you in...' : 'Get Early Access'}

                {!submitting && <ArrowRight className="h-4 w-4" />}
              </button>

              <p className="text-center text-xs leading-relaxed text-slate-400">
                We'll only use your WhatsApp number to contact you about
                HeySasa.
              </p>
            </form>
          </>
        ) : (
          <div className="py-2 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-[#28A745]" />

            <h2 className="mb-2 text-2xl font-bold tracking-tight text-slate-900">
              You're #{result.position} on the list.
            </h2>

            <p className="mx-auto mb-6 max-w-xs text-sm leading-relaxed text-slate-500">
              We'll message you on WhatsApp when it's your turn to experience
              HeySasa.

              <span className="mt-2 block font-medium text-slate-700">
                And yes — that first message is already part of the experience.
              </span>
            </p>

            {shareLink && (
              <div className="rounded-2xl bg-slate-50 p-4 text-left">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Know a business losing leads the same way?
                </p>

                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={shareLink}
                    className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600"
                    onFocus={(e) => e.target.select()}
                  />

                  <button
                    onClick={() => navigator.clipboard?.writeText(shareLink)}
                    className="h-9 rounded-lg bg-[#28A745]/10 px-3 text-xs font-semibold text-[#218838] hover:bg-[#28A745]/20"
                  >
                    Copy
                  </button>
                </div>

                <p className="mt-2 text-[11px] text-slate-400">
                  Share your link to move up the list.
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-6 text-sm font-semibold text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}