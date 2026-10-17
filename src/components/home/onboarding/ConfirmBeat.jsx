import { Clock, Frown, Phone, Tag, UserRound, Wallet } from 'lucide-react';
import { DAY_LABELS } from '../homeCopy';
import { BigButton, QuietButton } from './Controls';

// Everything is already chosen. The owner only taps what is wrong, then one button. Fewer words, no forms.
const HANDOFF_ICONS = {
  asks_for_call: { icon: Phone, label: 'Call' },
  ready_to_pay: { icon: Wallet, label: 'Pay' },
  asks_unknown_price: { icon: Tag, label: 'Price' },
  angry_or_upset: { icon: Frown, label: 'Upset' },
  asks_for_human: { icon: UserRound, label: 'Human' },
};

const timeInput = 'min-h-[44px] w-[116px] rounded-xl border border-white/10 bg-white/5 px-2 text-center text-[15px] font-semibold text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:hidden';

export default function ConfirmBeat({ hours, onHours, handoff, onHandoff, products, crossed, onCross, onConfirm, onSkip, saving, error }) {
  const toggleDay = (day) => onHours({ ...hours, days: hours.days.includes(day) ? hours.days.filter((d) => d !== day) : [...hours.days, day].sort() });

  return (
    <div className="ob-beat flex w-full flex-col items-center">
      <h2 className="text-[30px] font-bold tracking-tight text-white">Looks right?</h2>

      <div className="mt-6 flex w-full max-w-sm flex-col gap-3 text-left">
        <div className="ob-glass rounded-2xl p-4">
          <div className="flex items-center justify-center gap-2">
            <Clock size={17} className="shrink-0 text-[#7CF29A]" aria-hidden="true" />
            <input type="time" value={hours.open} onChange={(e) => onHours({ ...hours, open: e.target.value })} className={timeInput} aria-label="Opening time" />
            <span className="text-white/30" aria-hidden="true">–</span>
            <input type="time" value={hours.close} onChange={(e) => onHours({ ...hours, close: e.target.value })} className={timeInput} aria-label="Closing time" />
          </div>
          <div className="mt-3 flex justify-between gap-1">
            {DAY_LABELS.map((label, day) => {
              const on = hours.days.includes(day);
              return (
                <button key={label} type="button" onClick={() => toggleDay(day)} aria-pressed={on} aria-label={label}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-[12px] font-semibold transition-colors max-[380px]:h-9 max-[380px]:w-9 ${on ? 'bg-[#28A745] text-white' : 'bg-white/5 text-white/40'}`}>
                  {label.charAt(0)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="ob-glass rounded-2xl p-4">
          <div className="grid grid-cols-5 gap-1.5">
            {Object.entries(HANDOFF_ICONS).map(([id, { icon: Icon, label }]) => {
              const on = handoff.includes(id);
              return (
                <button key={id} type="button" onClick={() => onHandoff(id)} aria-pressed={on}
                  className={`flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-xl text-[10.5px] font-semibold transition-colors ${on ? 'bg-[#28A745]/20 text-[#7CF29A] ring-1 ring-[#28A745]/60' : 'bg-white/5 text-white/40'}`}>
                  <Icon size={17} aria-hidden="true" />{label}
                </button>
              );
            })}
          </div>
        </div>

        {products?.length > 0 && (
          <div className="ob-glass flex flex-wrap justify-center gap-2 rounded-2xl p-4">
            {products.map((product) => {
              const out = crossed.includes(product.id);
              return (
                <button key={product.id} type="button" aria-pressed={!out} onClick={() => onCross(product.id)}
                  className={`min-h-[36px] max-w-full truncate rounded-full px-3.5 text-[13px] font-medium ${out ? 'bg-white/5 text-white/30 line-through' : 'bg-[#28A745]/20 text-[#9af5b3] ring-1 ring-[#28A745]/50'}`}>
                  {product.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-7 flex w-full flex-col items-center gap-1">
        <BigButton onClick={onConfirm} disabled={saving || !hours.days.length}>{saving ? 'Saving...' : 'Looks right'}</BigButton>
        <QuietButton onClick={onSkip}>Skip</QuietButton>
      </div>
      {error && <p className="mt-2 text-[13px] text-red-300">{error}</p>}
    </div>
  );
}
