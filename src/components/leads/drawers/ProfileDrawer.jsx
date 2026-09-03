import { ShieldCheck, Tag, ShoppingCart, Target } from 'lucide-react';
import Drawer from './Drawer';
import DetailHeader from '../detail/DetailHeader';
import ConversationSignals from '../detail/ConversationSignals';
import { formatInterest } from '../../../utils/leadHelpers';

// Full profile view for a lead — reuses DetailHeader + ConversationSignals
// (same components the detail panel uses) and adds the fields that only
// belong in a deeper drawer view: trust markers, product interests, cart
// state, and the raw customer_intent/conv_stage read.
//
// Props: lead, open, onClose, onOpenChat, onMarkBought
export default function ProfileDrawer({ lead, open, onClose, onOpenChat, onMarkBought }) {
  if (!lead) return null;

  return (
    <Drawer open={open} onClose={onClose} title="Lead profile">
      <DetailHeader lead={lead} onOpenChat={onOpenChat} onMarkBought={onMarkBought} />

      <div className="flex flex-col gap-4 px-6 py-4">
        {lead.customer_intent && (
          <div>
            <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <Target size={12} /> Customer intent
            </div>
            <p className="text-[13px] leading-relaxed text-slate-700">{lead.customer_intent}</p>
            {lead.conv_stage && (
              <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500">
                {lead.conv_stage}
              </span>
            )}
          </div>
        )}

        {lead.product_interests?.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <Tag size={12} /> Product interests
            </div>
            <div className="flex flex-wrap gap-1.5">
              {lead.product_interests.map((tag) => (
                <span key={tag} className="rounded-full bg-[#F7FBF9] px-2.5 py-1 text-[11.5px] font-medium text-[#27500A]">
                  {formatInterest(tag)}
                </span>
              ))}
            </div>
          </div>
        )}

        {lead.cart_state?.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <ShoppingCart size={12} /> In cart / discussed
            </div>
            <ul className="flex flex-col gap-1">
              {lead.cart_state.map((item, i) => (
                <li key={i} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[12.5px] text-slate-600">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {lead.trust_markers?.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <ShieldCheck size={12} /> Trust markers
            </div>
            <ul className="flex flex-col gap-1">
              {lead.trust_markers.map((marker, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[12.5px] text-slate-600">
                  <ShieldCheck size={12} className="flex-shrink-0 text-[#28A745]" />
                  {marker}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ConversationSignals
        objections={lead.objection_tags}
        competitors={lead.competitor_mentions}
        questions={lead.pre_purchase_questions}
      />
    </Drawer>
  );
}