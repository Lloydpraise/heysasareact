import { useEffect, useRef } from 'react';

// Horizontal section tabs shared by Analytics, Campaigns and Playground.
// Desktop look is unchanged. On phones the tabs get bigger tap targets, snap,
// soft edge fades, and the active tab glides into view when it changes.
//
// tabs: [{ id, label, Icon }]
export default function ScrollTabs({ tabs, active, onChange, className = '', trailing = null }) {
  const rowRef = useRef(null);

  useEffect(() => {
    const row = rowRef.current;
    const el = row?.querySelector('[data-active="true"]');
    if (!row || !el) return;
    const target = el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2;
    row.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [active]);

  return (
    <div
      ref={rowRef}
      className={`flex w-full snap-x items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-md:gap-1.5 max-md:[mask-image:linear-gradient(to_right,transparent,#000_10px,#000_calc(100%-18px),transparent)] md:w-auto ${className}`}
    >
      {tabs.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            data-active={isActive}
            onClick={() => onChange(id)}
            className={`flex flex-shrink-0 snap-center items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-all duration-200 max-md:rounded-full max-md:px-4 max-md:py-2.5 max-md:text-[13.5px] sm:px-3 ${
              isActive
                ? 'bg-[#28A745] text-white max-md:shadow-md max-md:shadow-[#28A745]/25'
                : 'text-slate-500 hover:bg-slate-100 max-md:bg-slate-100/80'
            }`}
          >
            {Icon && <Icon size={12.5} className="max-md:h-4 max-md:w-4" />} {label}
          </button>
        );
      })}
      {trailing}
    </div>
  );
}
