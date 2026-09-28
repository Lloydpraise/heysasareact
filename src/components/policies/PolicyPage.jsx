import { Link } from 'react-router-dom';
import { ArrowRight, Mail, Phone } from 'lucide-react';
import logo from '../../assets/images/heysasalogo.png';
import whatsappIcon from '../../assets/images/whatsappicon.svg';
import { Footer } from '../landing/sections/FinalCtaAndFooter';
import termsMarkdown from '../../../policies/terms.md?raw';
import privacyMarkdown from '../../../policies/privacy-policy.md?raw';

const PAGE_CONTENT = {
  terms: {
    title: 'Terms of Service',
    description: 'The legal terms that govern your use of HeySasa.',
    markdown: termsMarkdown,
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'How HeySasa handles your information and privacy expectations.',
    markdown: privacyMarkdown,
  },
  contact: {
    title: 'Contact Us',
    description: 'Reach the HeySasa team with questions, partnership enquiries, or support requests.',
  },
};

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatInline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+|wa\.me\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\n/);
  let html = '';
  let paragraphBuffer = [];
  let listBuffer = [];

  const flushParagraph = () => {
    if (paragraphBuffer.length) {
      html += `<p>${formatInline(paragraphBuffer.join(' ').trim())}</p>`;
      paragraphBuffer = [];
    }
  };

  const flushList = () => {
    if (listBuffer.length) {
      html += `<ul>${listBuffer.map((item) => `<li>${formatInline(item)}</li>`).join('')}</ul>`;
      listBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      flushParagraph();
      flushList();
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const text = trimmed.replace(/^#{1,6}\s+/, '');
      html += `<h${Math.min(level, 3)}>${formatInline(text)}</h${Math.min(level, 3)}>`;
      continue;
    }

    if (/^-\s+/.test(trimmed)) {
      flushParagraph();
      listBuffer.push(trimmed.replace(/^-\s+/, ''));
      continue;
    }

    if (/^>\s+/.test(trimmed)) {
      flushParagraph();
      flushList();
      html += `<blockquote>${formatInline(trimmed.replace(/^>\s+/, ''))}</blockquote>`;
      continue;
    }

    paragraphBuffer.push(trimmed);
  }

  flushParagraph();
  flushList();

  return html;
}

export default function PolicyPage({ page }) {
  const pageConfig = PAGE_CONTENT[page] ?? PAGE_CONTENT.terms;

  const contactOptions = [
    {
      title: 'WhatsApp',
      detail: '+254 789 254 864',
      description: 'Chat with the HeySasa team and send us your enquiry in seconds.',
      href: 'https://wa.me/254789254864?text=Hello%20HeySasa%2C%20I%20would%20like%20to%20make%20an%20enquiry.',
      accent: 'bg-[#25D366]/10 text-[#0B8D4D]',
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366]/10">
          <img src={whatsappIcon} alt="WhatsApp" className="h-7 w-7" />
        </div>
      ),
      cta: 'Message on WhatsApp',
      buttonClass: 'bg-[#25D366] text-white hover:bg-[#1fbf5b]',
    },
    {
      title: 'Call',
      detail: '+254 789 254 864',
      description: 'Speak directly with our team for a quick conversation or pricing question.',
      href: 'tel:+254789254864',
      accent: 'bg-[#28A745]/10 text-[#218838]',
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#28A745]/10 text-[#218838]">
          <Phone className="h-6 w-6" />
        </div>
      ),
      cta: 'Call now',
      buttonClass: 'bg-[#28A745] text-white hover:bg-[#218838]',
    },
    {
      title: 'Email',
      detail: 'sales@heysasa.co.ke',
      description: 'Send us a detailed note and we will reply with the right next step.',
      href: 'mailto:sales@heysasa.co.ke',
      accent: 'bg-[#FF8C00]/10 text-[#C76A00]',
      icon: (
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF8C00]/10 text-[#C76A00]">
          <Mail className="h-6 w-6" />
        </div>
      ),
      cta: 'Send an email',
      buttonClass: 'bg-slate-900 text-white hover:bg-slate-800',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900">
      <nav className="fixed top-0 z-40 w-full border-b border-white/50 bg-[#FAFAFA]/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="text-sm font-semibold tracking-wide text-slate-700 hover:text-slate-950">
            ← Back to home
          </Link>
          <Link to="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Pricing
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-5 pb-16 pt-24">
        {page === 'contact' ? (
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <div className="mb-5 flex justify-center">
              <img src={logo} alt="HeySasa logo" className="h-14 w-auto object-contain sm:h-16" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              We’re here when you need us.
            </h1>
            <p className="mt-3 text-slate-600">
              Talk to the team about onboarding, pricing, partnerships, or anything else you need help with.
            </p>
          </div>
        ) : (
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#28A745]">
              HeySasa
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {pageConfig.title}
            </h1>
            <p className="mt-3 text-slate-600">{pageConfig.description}</p>
          </div>
        )}

        {page === 'contact' ? (
          <div className="grid gap-6 md:grid-cols-3">
            {contactOptions.map((option) => (
              <div
                key={option.title}
                className="relative flex flex-col rounded-[1.5rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {option.icon}
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{option.title}</h2>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${option.accent}`}>
                    Reach us
                  </span>
                </div>

                <div className="mb-4 text-sm font-semibold text-slate-900">{option.detail}</div>
                <p className="mb-6 text-sm leading-6 text-slate-600">{option.description}</p>

                <div className="mt-auto">
                  <a
                    href={option.href}
                    target={option.href.startsWith('http') ? '_blank' : undefined}
                    rel={option.href.startsWith('http') ? 'noreferrer' : undefined}
                    className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${option.buttonClass}`}
                  >
                    {option.cta}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <article
            className="mx-auto max-w-4xl rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(pageConfig.markdown) }}
          />
        )}
      </main>

      <Footer onJoinWaitlist={() => {}} />
    </div>
  );
}
