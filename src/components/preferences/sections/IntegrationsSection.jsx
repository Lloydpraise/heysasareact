import { useState } from 'react';
import { ArrowLeft, ChevronRight, Globe, ShoppingBag, ShoppingCart } from 'lucide-react';
import { GlassCard } from '../shared/ui';
import { WebsiteIntegration } from './WebsiteIntegration';

// Other tools that tell HeySasa what happened on a customer's side. One card per integration; new ones (Shopify,
// WooCommerce, ...) are added to this list as they are built.
const INTEGRATIONS = [
  {
    id: 'website',
    label: 'Website',
    sub: 'Send WhatsApp messages when something happens on your website: abandoned carts, receipts, deliveries.',
    Icon: Globe,
    available: true,
  },
  { id: 'shopify', label: 'Shopify', sub: 'Connect your Shopify store in one click.', Icon: ShoppingBag, available: false },
  { id: 'woocommerce', label: 'WooCommerce', sub: 'A plugin for WordPress shops.', Icon: ShoppingCart, available: false },
];

export function IntegrationsSection() {
  const [openId, setOpenId] = useState(null);

  if (openId === 'website') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setOpenId(null)}
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft size={16} /> All integrations
        </button>
        <WebsiteIntegration />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">Connect the tools your business already uses, so HeySasa can message customers at the right moment.</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {INTEGRATIONS.map(({ id, label, sub, Icon, available }) => (
          <button
            key={id}
            type="button"
            disabled={!available}
            onClick={() => setOpenId(id)}
            className="text-left disabled:cursor-not-allowed"
          >
            <GlassCard className={`h-full transition ${available ? 'hover:border-[#28A745]/40 hover:shadow-[#28A745]/10' : 'opacity-60'}`}>
              <div className="flex items-start gap-3">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${available ? 'bg-[#28A745]/10 text-[#1f8d3d]' : 'bg-slate-100 text-slate-400'}`}>
                  <Icon size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-slate-900">{label}</span>
                    {!available && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">Coming soon</span>}
                  </span>
                  <span className="mt-1 block text-[13px] leading-snug text-slate-500">{sub}</span>
                </span>
                {available && <ChevronRight size={18} className="mt-1 shrink-0 text-slate-300" />}
              </div>
            </GlassCard>
          </button>
        ))}
      </div>
    </div>
  );
}
