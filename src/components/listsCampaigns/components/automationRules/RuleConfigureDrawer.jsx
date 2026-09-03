// listsCampaigns/components/automationRules/RuleConfigureDrawer.jsx
import { useState } from 'react';
import Drawer from '../../../analytics/shared/Drawer';

export default function RuleConfigureDrawer({ rule, currentFactors, onSave, onClose }) {
  const [values, setValues] = useState(() => {
    const initial = {};
    rule.factors.forEach((f) => {
      initial[f.key] = currentFactors?.[f.key] ?? f.default;
    });
    return initial;
  });

  const setField = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  return (
    <Drawer title={`Configure: ${rule.name}`} onClose={onClose}>
      <div className="space-y-4">
        {rule.factors.map((factor) => (
          <div key={factor.key}>
            <label className="mb-1 block text-sm text-slate-500">
              {factor.label}{factor.unit ? ` (${factor.unit})` : ''}
            </label>

            {factor.type === 'number' && (
              <input
                type="number"
                value={values[factor.key]}
                onChange={(e) => setField(factor.key, Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              />
            )}

            {factor.type === 'boolean' && (
              <input
                type="checkbox"
                checked={values[factor.key]}
                onChange={(e) => setField(factor.key, e.target.checked)}
              />
            )}

            {factor.type === 'select' && (
              <select
                value={values[factor.key]}
                onChange={(e) => setField(factor.key, e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900"
              >
                {factor.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:text-slate-900">Cancel</button>
        <button
          onClick={() => onSave(rule.id, values)}
          className="px-4 py-2 rounded-lg bg-[#28A745] text-white"
        >
          Save
        </button>
      </div>
    </Drawer>
  );
}