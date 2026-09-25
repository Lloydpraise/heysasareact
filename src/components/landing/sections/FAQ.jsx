import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'Will this get my WhatsApp number banned?',
    a: 'HeySasa connects the way WhatsApp Web does, not through Meta\u2019s official business API. We send slowly, cap daily volume, and respect quiet hours to keep risk low \u2014 but no tool can promise zero risk. Don\u2019t connect a number you can\u2019t afford to lose.',
  },
  {
    q: 'Do you read my customers\u2019 chats?',
    a: 'Yes \u2014 that\u2019s how the analysis and the persona work. We\u2019ll tell you exactly what\u2019s stored, who can see it, and how to delete it whenever you ask.',
  },
  {
    q: 'I use Odoo / Excel / nothing to track customers \u2014 does it still work?',
    a: 'Yes. HeySasa works alongside whatever you already use for records. An Odoo connection is coming; nothing here requires you to switch systems first.',
  },
  {
    q: 'Can I cancel?',
    a: 'Yes, any time. No lock-in beyond the price guarantee itself.',
  },
  {
    q: 'What happens after the founding price?',
    a: 'You keep your locked rate for the full 12 months regardless of what we charge new customers after you.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="px-5 py-16">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-slate-900">
          Straight answers
        </h2>
        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const open = openIndex === i;
            return (
              <div key={item.q} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-slate-800">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                {open && (
                  <p className="px-5 pb-4 text-sm leading-relaxed text-slate-500">{item.a}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
