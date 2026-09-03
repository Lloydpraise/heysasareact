import { LayoutGrid, List } from 'lucide-react';

export default function ViewSwitcher({ view, onChange }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5">
      {[
        { id: 'list', label: 'List view', Icon: List },
        { id: 'grid', label: 'Grid view', Icon: LayoutGrid },
      ].map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-label={label}
          title={label}
          className={`flex h-7 items-center gap-1.5 rounded-md px-2 text-[10.5px] font-semibold transition ${
            view === id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Icon size={13} />
          <span className="hidden sm:inline">{id === 'list' ? 'List' : 'Grid'}</span>
        </button>
      ))}
    </div>
  );
}
