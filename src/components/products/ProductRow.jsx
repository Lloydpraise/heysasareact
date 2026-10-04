import { Check, X, Undo2 } from 'lucide-react';
import { AiDot, CategoryChip, InlineProductField, PhotoTile } from './shared';
import { confidenceLabel, formatMoney, isActiveForAi, sourceLabel } from '../../utils/productHelpers';

export default function ProductRow({ product, currency, selected, onSelect, onOpen, onInlineSave, onToggleAi, onAddPhoto, onApprove, onDismiss, onRestore }) {
  const discovered = product.status === 'discovered';
  const dismissed = product.status === 'dismissed';
  const price = formatMoney(product.price, currency);
  const confidence = discovered ? confidenceLabel(product.discovery_confidence) : null;

  return (
    <div
      className={`group flex items-center gap-3 rounded-2xl border bg-white px-3 py-2 transition hover:shadow-md hover:shadow-[#28A745]/5 ${selected ? 'border-[#28A745] bg-[#28A745]/5' : 'border-slate-200/80'} ${dismissed ? 'opacity-70' : ''}`}
    >
      <input type="checkbox" checked={selected} onChange={() => onSelect(product.id)} className="h-4 w-4 shrink-0 accent-[#28A745]" aria-label={`Select ${product.title}`} />

      <div
        className="h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-slate-100"
        onClick={() => onOpen(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => { if (event.key === 'Enter') onOpen(product); }}
        aria-label={`Open ${product.title}`}
      >
        <PhotoTile product={product} onAddPhoto={onAddPhoto} compact />
      </div>

      {product.status === 'approved' && <AiDot active={isActiveForAi(product)} onToggle={() => onToggleAi(product)} size="sm" className="-mr-1 shrink-0" />}

      <div className="min-w-0 flex-1">
        <InlineProductField
          product={product}
          field="name"
          value={product.title}
          displayValue={product.title}
          onSave={onInlineSave}
          className="block w-full truncate text-sm font-semibold text-slate-900 group-hover:text-[#1f8d3d]"
        />
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <CategoryChip name={product.category} />
          {discovered && (
            <span className="truncate text-[11px] text-slate-500">
              {sourceLabel(product.source)}{product.mention_count ? `, ${product.mention_count} mention${product.mention_count === 1 ? '' : 's'}` : ''}
              {confidence && <span className={`ml-1 font-semibold ${confidence.tone === 'low' ? 'text-[#B45F00]' : confidence.tone === 'high' ? 'text-[#1f8d3d]' : ''}`}>{confidence.text}</span>}
            </span>
          )}
          {!discovered && product.description_short && <span className="hidden truncate text-[11px] text-slate-400 sm:inline">{product.description_short}</span>}
        </span>
      </div>

      <div className="w-20 shrink-0 text-right sm:w-28">
        <InlineProductField
          product={product}
          field="price"
          value={product.price == null ? '' : String(product.price)}
          displayValue={price}
          placeholder="No price yet"
          onSave={onInlineSave}
          className={`text-sm font-bold ${price ? 'text-slate-900' : 'text-slate-400'}`}
        />
        {product.status === 'approved' && product.type !== 'service' && (
          <div className="text-[11px] text-slate-400">{product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : ''}</div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {discovered && (
          <>
            <button type="button" onClick={() => onApprove(product)} className="flex items-center gap-1 rounded-xl bg-[#28A745] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#23913d]">
              <Check className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Approve</span>
            </button>
            <button type="button" onClick={() => onDismiss(product)} aria-label={`Dismiss ${product.title}`} title="Not mine. Don't suggest it again." className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-500">
              <X className="h-4 w-4" />
            </button>
          </>
        )}
        {dismissed && (
          <button type="button" onClick={() => onRestore(product)} className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <Undo2 className="h-3.5 w-3.5" /> Bring back
          </button>
        )}
      </div>
    </div>
  );
}
