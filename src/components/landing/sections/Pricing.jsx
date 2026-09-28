import { useState } from 'react';
import { Check, Info } from 'lucide-react';
import logo from '../../../assets/images/heysasalogo.png';

// --- Grey areas from the ChatGPT draft, and the call I made on each ---
// 1. Growth's "Free AI messages" cell was blank/starred in the draft, while
//    Essentials and Scale both got 2,000. Treating that as a copy slip and
//    giving Growth 2,000 free messages too — flag this to Lloyd before shipping.
// 2. Growth (250-5,000/day) and Scale (2,000-10,000/day) ranges overlap.
//    Explained via the WhatsApp-type info icon instead of a paragraph.
// 3. "WhatsApp Business App" vs "WhatsApp Business API" is jargon a business
//    owner won't parse — moved behind an info icon on the relevant line.

const MESSAGES_TIP =
  'Your monthly plan pays for HeySasa and your number. AI messages are separate — they get used up each time HeySasa messages a customer. Need more? KES 1,000 ≈ 3,000 extra messages.';

const WHATSAPP_TIP =
  'A WhatsApp number is your normal WhatsApp, connected to HeySasa. The WhatsApp API is the official business tool — it sends more messages a day, but Meta may charge extra fees.';

const TIERS = [
  {
    name: 'Essentials',
    tagline: 'Start working your leads.',
    price: '10,000',
    description: 'For businesses just getting started with WhatsApp follow-up.',
    featured: false,
    features: [
      { label: '1 WhatsApp number', tip: WHATSAPP_TIP },
      { label: '2,000 free AI messages a month', tip: MESSAGES_TIP },
      { label: 'Automatic follow-ups' },
      { label: 'HeySasa can chat with customers' },
      { label: 'Sees patterns in your chats' },
      { label: '6 business reports' },
      { label: 'Send campaigns' },
      { label: 'Custom lead lists' },
      { label: 'Up to 200 messages a day' },
    ],
  },
  {
    name: 'Growth',
    tagline: 'Let HeySasa do more.',
    price: '20,000',
    description: 'For businesses ready to hand HeySasa more of the selling.',
    featured: true,
    features: [
      { label: 'Everything in Essentials' },
      { label: 'Official WhatsApp API', tip: WHATSAPP_TIP },
      { label: '2,000 free AI messages a month', tip: MESSAGES_TIP },
      { label: 'Up to 5,000 messages a day' },
      { label: 'Up to 10 campaigns at once' },
      { label: 'Up to 2 WhatsApp numbers' },
      { label: 'An account manager' },
    ],
  },
  {
    name: 'Scale',
    tagline: 'Run WhatsApp at volume.',
    price: '40,000',
    description: 'For businesses running big WhatsApp sales campaigns.',
    featured: false,
    features: [
      { label: 'Everything in Growth' },
      { label: 'Up to 2 official WhatsApp numbers', tip: WHATSAPP_TIP },
      { label: '2,000 free AI messages a month', tip: MESSAGES_TIP },
      { label: '2,000–10,000 messages a day' },
      { label: 'Up to 20 campaigns at once' },
      { label: 'Priority support' },
    ],
  },
];

function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        aria-label="More info"
        className="-my-1 ml-1 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:text-[#218838]"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-6 z-20 w-56 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-lg"
        >
          {text}
        </span>
      )}
    </span>
  );
}

export default function Pricing({ onJoinWaitlist }) {
  return (
    <section id="pricing" className="px-5 py-16 lg:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-5 flex justify-center">
            <img src={logo} alt="HeySasa logo" className="h-14 w-auto object-contain sm:h-16" />
          </div>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Turn more WhatsApp chats into sales.
          </h1>
          <p className="text-slate-600">
            Pick how much of the work you want HeySasa to handle for you.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-[1.5rem] border p-7 ${
                tier.featured
                  ? 'border-[#28A745]/30 bg-gradient-to-br from-[#28A745]/10 via-white to-[#FF8C00]/5 shadow-md lg:-translate-y-2'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              {tier.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#28A745] px-4 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                  Most popular
                </span>
              )}

              <h2 className="text-lg font-bold text-slate-900">{tier.name}</h2>
              <p className="mt-1 text-sm font-medium text-[#218838]">{tier.tagline}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  KES {tier.price}
                </span>
                <span className="text-sm text-slate-500">/ month</span>
              </div>

              <p className="mt-3 text-sm text-slate-600">{tier.description}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {tier.features.map((item) => (
                  <li key={item.label} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#28A745]" />
                    <span className="inline-flex items-start">
                      {item.label}
                      {item.tip && <InfoTip text={item.tip} />}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={onJoinWaitlist}
                className={`mt-7 inline-flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold transition ${
                  tier.featured
                    ? 'bg-[#28A745] text-white shadow-lg shadow-[#28A745]/30 hover:bg-[#218838]'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                Get {tier.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
