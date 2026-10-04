import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { tileTone } from '../../utils/productHelpers';

// The green dot: this product is approved AND switched on for the AI.
// Grey: approved but hidden from the AI. Not shown at all on products still waiting for review.
export function AiDot({ active, onToggle, size = 'md', className = '' }) {
  const px = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';
  const dot = (
    <span
      className={`block rounded-full transition-colors ${px} ${active ? 'bg-[#28A745] shadow-[0_0_0_3px_rgba(40,167,69,0.18)]' : 'bg-slate-300'}`}
    />
  );
  if (!onToggle) {
    return <span title={active ? 'Active for AI' : 'Hidden from AI'} className={`inline-flex ${className}`}>{dot}</span>;
  }
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      title={active ? 'Active for AI. Click to hide it from the AI.' : 'Hidden from AI. Click to let the AI use it.'}
      aria-label={active ? 'Active for AI. Hide from AI' : 'Hidden from AI. Let AI use it'}
      aria-pressed={active}
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28A745] ${className}`}
    >
      {dot}
    </button>
  );
}

export function CategoryChip({ name }) {
  if (!name) return null;
  const [bg, fg] = tileTone(name);
  return (
    <span className="inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: bg, color: fg }}>
      {name}
    </span>
  );
}

// Picture of the product, or, when there is none yet, a tile that shows its name and invites a photo.
// Dropping a file on the tile, or clicking "Add photo", saves the photo straight onto the product.
export function PhotoTile({ product, onAddPhoto, compact = false, className = '' }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const image = product.images?.[0];
  const [bg, fg] = tileTone(product.category || product.title);

  const upload = async (file) => {
    if (!file || !onAddPhoto) return;
    setBusy(true);
    try { await onAddPhoto(product, file); } finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  };

  if (image) {
    return <img src={image} alt={product.title} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
  }

  return (
    <div
      onDragOver={(e) => { if (onAddPhoto) { e.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files?.[0]); }}
      className={`relative flex h-full w-full flex-col items-center justify-center gap-2 p-2 text-center ${over ? 'ring-2 ring-inset ring-[#28A745]' : ''} ${className}`}
      style={{ background: bg, color: fg }}
    >
      {!compact && (
        <span className="line-clamp-4 px-3 text-[15px] font-bold leading-snug tracking-tight opacity-90">{product.title}</span>
      )}
      {onAddPhoto && (
        <>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            disabled={busy}
            aria-label={`Add a photo to ${product.title}`}
            className={`inline-flex items-center gap-1.5 rounded-full border border-current/30 bg-white/70 font-semibold backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28A745] ${compact ? 'h-7 w-7 justify-center' : 'px-3 py-1.5 text-xs'}`}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            {!compact && (busy ? 'Uploading' : 'Add photo')}
          </button>
        </>
      )}
    </div>
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#28A745] focus:outline-none focus:ring-2 focus:ring-[#28A745]/20';
