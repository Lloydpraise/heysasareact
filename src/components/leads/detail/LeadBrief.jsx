import { AlertTriangle, Building2, HelpCircle, LoaderCircle, MessageSquareQuote, ShoppingBag, Sparkles, Target } from 'lucide-react';
import { daysSince, formatInterest, isNonCustomer, timeAgo } from '../../../utils/leadHelpers';

// "Pick up the phone and know exactly what to say." Everything here is read straight from what the analyser
// found about this lead; nothing is made up. A section with nothing behind it is simply not shown.
export default function LeadBrief({ lead, onAnalyze, analysisState }) {
  if (isNonCustomer(lead)) return null;
  const analysed = Boolean(lead.nlp_enriched_at);
  const waitingDays = lead.awaiting_business_reply && lead.last_inbound_at ? daysSince(lead.last_inbound_at) : null;

  // One short line. The intent score (round badge) and the date they came in are already in the header.
  const stage = lead.conv_stage ? `${String(lead.conv_stage).charAt(0).toUpperCase()}${String(lead.conv_stage).slice(1)}` : '';
  const standing = [];
  if (stage) standing.push(stage);
  if (lead.awaiting_business_reply && lead.last_inbound_at) {
    standing.push(waitingDays >= 1 ? `Waiting on your reply for ${waitingDays} day${waitingDays === 1 ? '' : 's'}` : 'Waiting on your reply');
  } else if (lead.last_inbound_at) {
    standing.push(`Last wrote ${timeAgo(lead.last_inbound_at)} ago`);
  } else {
    standing.push('Has not messaged yet');
  }
  if (lead.follow_up_count > 0) standing.push(`${lead.follow_up_count} follow-up${lead.follow_up_count === 1 ? '' : 's'} sent`);

  const wants = lead.customer_intent || lead.context_summary || lead.lead_summary;
  const products = [...new Set([...(lead.product_interests || []), ...(lead.cart_state || [])])];
  const objections = lead.objection_tags || [];
  const competitors = lead.competitor_mentions || [];
  const questions = lead.pre_purchase_questions || [];
  const howTheyBuy = lead.psychology || lead.vibe_check;

  return (
    <section className="mx-4 my-3 rounded-xl border border-slate-200 bg-white md:mx-6" aria-label="Lead brief">
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          <MessageSquareQuote size={13} className="text-[#28A745]" /> Lead brief
        </h3>
        {!analysed && onAnalyze && (
          <button
            type="button"
            onClick={onAnalyze}
            disabled={analysisState === 'analysing'}
            className="flex items-center gap-1 rounded-md border border-[#28A745]/30 px-2 py-1 text-[11px] font-semibold text-[#218c3a] hover:bg-[#28A745]/5 disabled:opacity-60"
          >
            {analysisState === 'analysing' ? <LoaderCircle size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {analysisState === 'analysing' ? 'Analysing...' : 'Analyse this lead'}
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3.5 px-4 py-3">
        <Block icon={Target} title="Where things stand">
          <p className="text-[12.5px] leading-relaxed text-slate-700">{standing.join(' \u00b7 ')}</p>
        </Block>

        {products.length > 0 && (
          <Block icon={ShoppingBag} title="Interested in">
            <div className="flex flex-wrap gap-1.5">
              {products.map((product) => (
                <span key={product} className="rounded-full bg-[#F7FBF9] px-2.5 py-1 text-[11.5px] font-semibold text-[#27500A] ring-1 ring-[#28A745]/20">
                  {formatInterest(String(product))}
                </span>
              ))}
            </div>
          </Block>
        )}

        {wants && (
          <Block icon={Target} title="What they want">
            <p className="text-[12.5px] leading-relaxed text-slate-700">{wants}</p>
          </Block>
        )}

        {(objections.length > 0 || competitors.length > 0) && (
          <Block icon={AlertTriangle} title="Watch out for">
            <div className="flex flex-wrap gap-1.5">
              {objections.map((tag) => (
                <span key={tag} className="rounded-full bg-red-50 px-2.5 py-1 text-[11.5px] font-medium text-red-600">{formatInterest(String(tag))}</span>
              ))}
              {competitors.map((name) => (
                <span key={name} className="inline-flex items-center gap-1 rounded-full bg-[#FFF7ED] px-2.5 py-1 text-[11.5px] font-medium text-[#c26a00]">
                  <Building2 size={11} /> Mentioned {name}
                </span>
              ))}
            </div>
          </Block>
        )}

        {questions.length > 0 && (
          <Block icon={HelpCircle} title="Questions they asked">
            <ul className="flex flex-col gap-1">
              {questions.map((question, index) => (
                <li key={index} className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[12.5px] text-slate-600">{question}</li>
              ))}
            </ul>
          </Block>
        )}

        {howTheyBuy && (
          <Block icon={MessageSquareQuote} title="How to talk to them">
            <p className="text-[12.5px] leading-relaxed text-slate-600">{howTheyBuy}</p>
          </Block>
        )}

        {lead.intent_evidence && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11.5px] leading-relaxed text-slate-500">
            <span className="font-semibold text-slate-600">Why this score: </span>{lead.intent_evidence}
          </p>
        )}

        {!analysed && (
          <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11.5px] leading-relaxed text-slate-500">
            Not analysed yet.
          </p>
        )}
      </div>
    </section>
  );
}

function Block({ icon: Icon, title, children }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-slate-400">
        <Icon size={11} /> {title}
      </div>
      {children}
    </div>
  );
}
