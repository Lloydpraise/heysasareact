import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarClock, ExternalLink, MessageCircle, MoreVertical, Pencil, Phone, ShoppingBag, Sparkles, User } from 'lucide-react';
import { useBackClose } from '../../../hooks/useBackClose';
import { getLeadDisplayName, isNonCustomer, isValidPhoneNumber, stateConfig } from '../../../utils/leadHelpers';
import BottomSheet, { SheetRow } from '../../mobile/BottomSheet';

// Full-screen lead page for phones: slides in from the right, sticky header
// with back + overflow menu, and a sticky action bar (Chat / Bought / Call) so
// the main actions are always one thumb-tap away. Back button / swipe closes it.
export default function MobileLeadDetail({
  open,
  lead,
  onClose,
  onEdit,
  onOpenChat,
  onAnalyze,
  analysisState,
  onMarkBought,
  onCall,
  onMeeting,
  onMarkPersonal,
  children,
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(lead);
  const [menuOpen, setMenuOpen] = useState(false);

  if (open && !mounted) setMounted(true);
  if (lead && lead !== shown) setShown(lead);
  const closing = mounted && !open;

  useEffect(() => {
    if (open || !mounted) return undefined;
    const timer = window.setTimeout(() => setMounted(false), 240);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  useBackClose(open, onClose);

  const current = lead || shown;
  if (!mounted || !current) return null;

  const state = stateConfig(current.lead_state);
  const displayName = getLeadDisplayName(current.name, current.phone, current);
  const phoneIsValid = isValidPhoneNumber(current.phone);
  const waLink = phoneIsValid ? `https://wa.me/${current.phone.replace(/[^\d]/g, '')}` : null;
  const isBusiness = !isNonCustomer(current);
  const canMarkBought = isBusiness && current.lead_state !== 'won';

  return (
    <div className={`fixed inset-0 z-40 flex flex-col bg-[#F7FBF9] ${closing ? 'm-slide-out' : 'm-slide-in'}`}>
      <header className="shrink-0 border-b border-slate-200 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="flex h-14 items-center gap-1 px-2">
          <button type="button" onClick={onClose} aria-label="Back to leads" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-700 active:bg-slate-100">
            <ArrowLeft size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-bold leading-tight text-slate-900">{displayName}</p>
            <p className={`flex items-center gap-1.5 text-[12px] font-semibold ${state.textClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${state.dotClass}`} />
              {state.label}
            </p>
          </div>
          <button type="button" onClick={() => setMenuOpen(true)} aria-label="More actions" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-600 active:bg-slate-100">
            <MoreVertical size={21} />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>

      <div className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white/95 px-3 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+0.625rem)] backdrop-blur-md">
        <button
          type="button"
          onClick={onOpenChat}
          className="flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#28A745] text-[15px] font-bold text-white shadow-lg shadow-[#28A745]/25"
        >
          <MessageCircle size={19} /> Chat
        </button>
        {canMarkBought && (
          <button
            type="button"
            onClick={onMarkBought}
            className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#28A745]/40 bg-[#28A745]/10 px-4 text-[15px] font-bold text-[#1f8d3d]"
          >
            <ShoppingBag size={18} /> Bought
          </button>
        )}
        {onCall && (
          <button type="button" onClick={onCall} aria-label="Call" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 active:bg-slate-200">
            <Phone size={19} />
          </button>
        )}
        {onMeeting && isBusiness && (
          <button type="button" onClick={onMeeting} aria-label="Book a meeting" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 active:bg-slate-200">
            <CalendarClock size={19} />
          </button>
        )}
      </div>

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title={displayName}>
        <div className="flex flex-col gap-0.5">
          <SheetRow icon={Pencil} label="Edit lead" hint="Name, phone, stage and notes" onClick={() => { setMenuOpen(false); onEdit?.(); }} />
          {isBusiness && (
            <SheetRow
              icon={Sparkles}
              label={analysisState === 'analysing' ? 'Analysing...' : analysisState === 'completed' ? 'Analysis complete' : 'Analyse contact'}
              hint="Refresh intent, signals and next action"
              onClick={() => { setMenuOpen(false); if (analysisState !== 'analysing') onAnalyze?.(); }}
            />
          )}
          {waLink && (
            <SheetRow icon={ExternalLink} label="Open in WhatsApp" hint="Continue in the WhatsApp app" onClick={() => { setMenuOpen(false); window.open(waLink, '_blank', 'noopener'); }} />
          )}
          {isBusiness && onMarkPersonal && (
            <SheetRow icon={User} label="Mark as personal" hint="Hide from follow-ups and analysis" onClick={() => { setMenuOpen(false); onMarkPersonal(); }} />
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
