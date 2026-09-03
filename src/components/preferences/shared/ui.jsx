import React, { useEffect, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { DAYS } from '../../../constants/preferencesConfig';

export const GlassCard = ({ children, className = '' }) => (
  <div className={`rounded-[1.25rem] border border-white/80 bg-white/70 p-4 shadow-lg shadow-[#28A745]/5 backdrop-blur-xl md:rounded-[1.5rem] md:p-6 ${className}`}>
    {children}
  </div>
);

export const Toggle = ({ checked, onChange, label, description }) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0">
      {label && <div className="font-medium text-slate-700">{label}</div>}
      {description && <div className="text-sm text-slate-500">{description}</div>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none ${
        checked ? 'bg-[#28A745]' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export const MasterSwitchCard = ({ title, description, checked, onChange, icon, compactMobile = false }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event) => setIsMobile(event.matches);
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const isCompactMobile = compactMobile && isMobile;

  return (
    <div className={`rounded-[1.25rem] border p-4 shadow-lg shadow-[#28A745]/5 transition-all md:rounded-[1.5rem] md:p-6 ${
      checked ? 'border-[#28A745]/30 bg-[#28A745]/10' : 'border-white/80 bg-white/70'
    }`}>
      <div className={isCompactMobile ? 'flex items-center justify-between gap-3' : 'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'}>
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          {icon && (
            <div 
              className={`shrink-0 rounded-xl p-2.5 md:p-3 ${checked ? 'bg-[#28A745]/15 text-[#28A745]' : 'bg-slate-100 text-slate-500'}`} 
              dangerouslySetInnerHTML={{ __html: icon }} 
            />
          )}
          <div className="min-w-0">
            <h3 className={`truncate text-sm font-semibold md:text-lg ${checked ? 'text-[#1f8d3d]' : 'text-slate-800'}`}>{title}</h3>
            {!isCompactMobile && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCompactMobile && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              aria-label={expanded ? 'Hide details' : 'Show details'}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-500 shadow-sm transition hover:text-slate-700"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
          <Toggle checked={checked} onChange={onChange} />
        </div>
      </div>

      {isCompactMobile && expanded && (
        <div className="mt-3 border-t border-slate-200/80 pt-3">
          <p className="text-xs leading-relaxed text-slate-500">{description}</p>
        </div>
      )}
    </div>
  );
};

export const Stepper = ({ value, onChange, min = 0, max = 100, label, suffix = '' }) => {
  const decrease = () => onChange(Math.max(min, value - 1));
  const increase = () => onChange(Math.min(max, value + 1));
  
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-slate-600 sm:ml-2">{label}</span>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <button 
          onClick={decrease} 
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
        >
          −
        </button>
        <span className="w-12 text-center font-mono text-sm text-slate-700">{value}{suffix}</span>
        <button 
          onClick={increase} 
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
        >
          +
        </button>
      </div>
    </div>
  );
};

export const DayPicker = ({ activeDays, onChange }) => {
  const toggleDay = (idx) => {
    if (activeDays.includes(idx)) {
      onChange(activeDays.filter(d => d !== idx));
    } else {
      onChange([...activeDays, idx].sort());
    }
  };

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2">
        {DAYS.map((day, idx) => {
          const isActive = activeDays.includes(idx);
          return (
            <button
              key={idx}
              onClick={() => toggleDay(idx)}
              className={`h-10 w-10 shrink-0 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-[#28A745] text-white shadow-lg shadow-[#28A745]/20' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};