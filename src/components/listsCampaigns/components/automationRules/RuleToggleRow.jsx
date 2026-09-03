// listsCampaigns/components/automationRules/RuleToggleRow.jsx
import { daysUntilDeletion } from '../../../../services/listsCampaignsService';

export default function RuleToggleRow({ rule, status, onToggle, onConfigure }) {
  const Icon = rule.icon;
  const enabled = status?.enabled ?? false;
  const remaining = enabled ? null : daysUntilDeletion(status?.disabled_at);

  return (
    <div className="flex items-center justify-between rounded-[14px] bg-white border border-slate-200 p-5">
      <div className="flex items-start gap-3">
        <Icon size={20} className="mt-0.5 text-slate-400" />
        <div>
          <p className="text-[13px] font-semibold text-slate-900">{rule.name}</p>
          <p className="text-[12.5px] text-slate-500">{rule.description}</p>
          {remaining !== null && (
            <p className="text-xs text-amber-400 mt-1">
              List hidden - deletes in {remaining} day{remaining === 1 ? '' : 's'} unless re-enabled
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onConfigure(rule)}
          className="text-sm text-slate-500 hover:text-slate-900 transition"
        >
          Configure
        </button>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => onToggle(rule.id, !enabled)}
          className={`w-10 h-6 rounded-full transition ${enabled ? 'bg-[#28A745]' : 'bg-slate-200'}`}
        >
          <span
            className={`block w-4 h-4 bg-white rounded-full transition-transform ${
              enabled ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}