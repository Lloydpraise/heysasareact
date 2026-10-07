import { useState } from 'react';
import { useChatAiConfig } from '../../../hooks/useChatAiConfig';
import { SkillsPanel } from '../SkillsPanel';
import { FlowsPanel } from '../FlowsPanel';

const TABS = [
  { id: 'skills', label: 'Skills' },
  { id: 'flows', label: 'Flows' },
];

export function SkillsFlowsSection({ businessId, showToast }) {
  const [tab, setTab] = useState('skills');
  const { skills, defaults, flows, targets, loading, error, reload } = useChatAiConfig(businessId);

  if (loading) return <p className="text-sm text-[#94A3B8]">Loading skills and flows…</p>;
  if (error) return <p className="text-sm text-red-500">Could not load skills and flows: {error.message}</p>;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-100/80 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-1 text-[12px] font-semibold transition ${tab === t.id ? 'bg-white text-[#1f8d3d] shadow-sm' : 'text-slate-500'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="min-w-0 flex-1 truncate whitespace-nowrap text-[11.5px] leading-snug max-md:line-clamp-2 max-md:whitespace-normal text-[#94A3B8]">
          {tab === 'skills'
            ? 'Playbooks the AI loads when a customer’s situation matches. Changes affect this business only.'
            : 'Scripts for chats from selected ads or lists, with instructions and skills loaded from the start.'}
        </p>
      </div>

      {tab === 'skills' ? (
        <SkillsPanel businessId={businessId} skills={skills} defaults={defaults} flows={flows} reload={reload} showToast={showToast} />
      ) : (
        <FlowsPanel businessId={businessId} flows={flows} skills={skills} targets={targets} reload={reload} showToast={showToast} />
      )}
    </div>
  );
}
