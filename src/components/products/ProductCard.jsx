import { Check, X, Undo2 } from 'lucide-react';
import { AiDot, CategoryChip, InlineProductField, PhotoTile } from './shared';
import { confidenceLabel, formatMoney, isActiveForAi } from '../../utils/productHelpers';

function evidenceLine(p) {
  const meta = p.discovery_meta || {};
  const bits = [];
  if (meta.customers) bits.push(`${meta.customers} customer${meta.customers === 1 ? '' : 's'}`);
  else if (p.mention_count) bits.push(`${p.mention_count} mention${p.mention_count === 1 ? '' : 's'}`);
  if (meta.image_mentions) bits.push('photo');
  return bits.length ? `Seen with ${bits.join(' and ')}` : '';
}

const CONFIDENCE_TONE = { high: 'text-[#1f8d3d]', mid: 'text-slate-500', low: 'text-[#B45F00]' };

export default function ProductCard({ product, currency, selected, selectMode, onSelect, onOpen, onInlineSave, onToggleAi, onAddPhoto, onApprove, onDismiss, onRestore }) {
  const discovered = product.status === 'discovered';
  const dismissed = product.status === 'dismissed';
  const price = formatMoney(product.price, currency);
  const confidence = discovered ? confidenceLabel(product.discovery_confidence) : null;

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-lg hover:shadow-[#28A745]/10 ${selected ? 'border-[#28A745] ring-2 ring-[#28A745]/30' : 'border-slate-200/80'} ${dismissed ? 'opacity-70' : ''}`}
    >
      <div className="relative aspect-[4/5] w-full cursor-pointer overflow-hidden bg-slate-100" onClick={() => onOpen(product)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(product); }} aria-label={`Open ${product.title}`}>
        <PhotoTile product={product} onAddPhoto={onAddPhoto} />

        {product.status === 'approved' && (
          <span className="absolute left-2 top-2 flex h-7 items-center rounded-full bg-white/90 px-1.5 shadow-sm backdrop-blur">
            <AiDot active={isActiveForAi(product)} onToggle={() => onToggleAi(product)} />
          </span>
        )}

        <label
          className={`absolute right-2 top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition ${selected || selectMode ? 'opacity-100' : 'opacity-0 focus-within:opacity-100 group-hover:opacity-100'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <input type="checkbox" checked={selected} onChange={() => onSelect(product.id)} className="h-4 w-4 accent-[#28A745]" aria-label={`Select ${product.title}`} />
        </label>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="min-h-[2.5rem] text-sm font-semibold leading-tight text-slate-900">
          <InlineProductField
            product={product}
            field="name"
            value={product.title}
            displayValue={product.title}
            onSave={onInlineSave}
            className="line-clamp-2 w-full"
          />
        </h3>
        <div className="flex items-baseline justify-between gap-2">
          <InlineProductField
            product={product}
            field="price"
            value={product.price == null ? '' : String(product.price)}
            displayValue={price}
            placeholder="No price yet"
            onSave={onInlineSave}
            className={`text-sm font-bold ${price ? 'text-slate-900' : 'text-slate-400'}`}
          />
          {product.old_price && Number(product.old_price) > Number(product.price) && (
            <span className="text-xs text-slate-400 line-through">{formatMoney(product.old_price, currency)}</span>
          )}
        </div>
        <div className="flex min-h-[1.25rem] items-center gap-2">
          <CategoryChip name={product.category} />
        </div>

        {discovered && (
          <>
            <p className="text-[11px] leading-tight text-slate-500">{evidenceLine(product)}</p>
            {confidence && <p className={`-mt-1 text-[11px] font-semibold leading-tight ${CONFIDENCE_TONE[confidence.tone]}`}>{confidence.text}</p>}
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => onApprove(product)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#28A745] px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-[#23913d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28A745] focus-visible:ring-offset-2">
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
              <button type="button" onClick={() => onDismiss(product)} aria-label={`Dismiss ${product.title}`} title="Not mine. Don't suggest it again." className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
        {dismissed && (
          <button type="button" onClick={() => onRestore(product)} className="mt-1 flex items-center justify-center gap-1 rounded-xl border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <Undo2 className="h-3.5 w-3.5" /> Bring back
          </button>
        )}
      </div>
    </article>
  );
}
