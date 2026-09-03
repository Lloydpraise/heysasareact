import { useState } from 'react';
import { GlassCard, MasterSwitchCard, Stepper, DayPicker } from '../shared/ui';
import { ICONS, zoneModes, ECOM_STAGES, SERVICE_STAGES } from '../../../constants/preferencesConfig';

export function FollowupSection({ prefs, updatePref }) {
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);

  const handleFollowupChange = (enabled) => {
    if (!enabled) {
      setShowDisableConfirm(true);
      return;
    }
    updatePref('followup_enabled', true);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <MasterSwitchCard
        title="AI Follow-ups"
        description="Let heysasa! automatically chase leads based on your configured zones and material settings."
        checked={prefs.followup_enabled}
        onChange={handleFollowupChange}
        icon={ICONS.bot}
        compactMobile
      />

      {prefs.followup_enabled && (
        <>
          <GlassCard className="w-full">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span dangerouslySetInnerHTML={{ __html: ICONS.time }} className="text-slate-500" />
              Follow-up Limits & Schedule
            </h3>
            
            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div className="space-y-3">
                <Stepper 
                  label="Max Follow-ups per Lead" 
                  value={prefs.max_per_lead} 
                  onChange={(val) => updatePref('max_per_lead', val)} 
                  min={1} max={20} 
                />
                <Stepper 
                  label="Daily Message Cap" 
                  value={prefs.daily_cap} 
                  onChange={(val) => updatePref('daily_cap', val)} 
                  min={10} max={200} 
                />
              </div>

              <div className="space-y-3">
                <Stepper 
                  label="Quiet Hours Start" 
                  value={prefs.quiet_start} 
                  onChange={(val) => updatePref('quiet_start', val)} 
                  min={0} max={23} 
                  suffix=":00"
                />
                <Stepper 
                  label="Quiet Hours End" 
                  value={prefs.quiet_end} 
                  onChange={(val) => updatePref('quiet_end', val)} 
                  min={0} max={23} 
                  suffix=":00"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/80">
              <label className="text-sm text-slate-600 block mb-3">Active Sending Days</label>
              <DayPicker 
                activeDays={prefs.active_days} 
                onChange={(days) => updatePref('active_days', days)} 
              />
            </div>
          </GlassCard>

          <GlassCard className="w-full">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <span dangerouslySetInnerHTML={{ __html: ICONS.target }} className="text-slate-500" />
              Temperature Zones
            </h3>
            <p className="mb-6 text-sm text-slate-600">
              Configure how aggressive the AI should be based on how long a lead has been inactive.
            </p>

            <div className="space-y-3 md:space-y-4">
              <ZoneRow 
                title="Hot Zone (Recent)"
                desc="Lead was active in the last"
                daysValue={prefs.zone_recent_days}
                onDaysChange={(val) => updatePref('zone_recent_days', val)}
                modeValue={prefs.zone_recent_mode}
                onModeChange={(val) => updatePref('zone_recent_mode', val)}
                accentColor="blue"
              />
              <ZoneRow 
                title="Warm Zone"
                desc="Lead was active in the last"
                daysValue={prefs.zone_medium_days}
                onDaysChange={(val) => updatePref('zone_medium_days', val)}
                modeValue={prefs.zone_medium_mode}
                onModeChange={(val) => updatePref('zone_medium_mode', val)}
                accentColor="orange"
              />
              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-700">Cold Zone (Archived)</div>
                  <div className="mt-1 text-xs text-slate-500">Older than {prefs.zone_medium_days} days</div>
                </div>
                <select 
                  className="w-full bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-[#28A745] md:w-auto"
                  value={prefs.zone_old_mode}
                  onChange={(e) => updatePref('zone_old_mode', e.target.value)}
                >
                  {Object.entries(zoneModes).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="w-full">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <span dangerouslySetInnerHTML={{ __html: ICONS.pipeline }} className="text-slate-500" />
              Pipeline Constraints
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-slate-600 block mb-2">Stop Follow-ups At</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#28A745] transition-colors"
                  value={prefs.stop_at_stage}
                  onChange={(e) => updatePref('stop_at_stage', e.target.value)}
                >
                  <optgroup label="E-Commerce">
                    {ECOM_STAGES.map(s => <option key={`e_${s}`} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                  </optgroup>
                  <optgroup label="Service/B2B">
                    {SERVICE_STAGES.map(s => <option key={`s_${s}`} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                  </optgroup>
                </select>
                <p className="text-xs text-slate-500 mt-2">The AI will never send follow-ups to leads at or beyond this stage.</p>
              </div>
              
              <div>
                <label className="text-sm text-slate-600 block mb-2">Require Human Review At</label>
                <select 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#28A745] transition-colors"
                  value={prefs.alert_at_stage}
                  onChange={(e) => updatePref('alert_at_stage', e.target.value)}
                >
                  <optgroup label="E-Commerce">
                    {ECOM_STAGES.map(s => <option key={`e_${s}`} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                  </optgroup>
                  <optgroup label="Service/B2B">
                    {SERVICE_STAGES.map(s => <option key={`s_${s}`} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                  </optgroup>
                </select>
                <p className="text-xs text-slate-500 mt-2">The AI will pause and notify you when a lead reaches this stage.</p>
              </div>
            </div>
          </GlassCard>
        </>
      )}

      {showDisableConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="presentation">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="disable-followups-title">
            <h2 id="disable-followups-title" className="text-lg font-semibold text-slate-900">Turn off AI follow-ups?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">Are you sure? Having HeySasa! follow up your clients automatically can lead to massive boosts in sales and time saved.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowDisableConfirm(false)} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="button" onClick={() => { updatePref('followup_enabled', false); setShowDisableConfirm(false); }} className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ZoneRow({ title, desc, daysValue, onDaysChange, modeValue, onModeChange, accentColor }) {
  const colorMap = {
    blue: 'text-blue-400',
    orange: 'text-orange-400'
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:bg-slate-100 md:flex-row md:items-center md:justify-between">
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${colorMap[accentColor]}`}>{title}</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">{desc}</span>
          <input 
            type="number" 
            value={daysValue}
            onChange={(e) => onDaysChange(Number(e.target.value))}
            className="w-16 bg-white border border-slate-200 text-xs rounded px-2 py-1 text-center text-slate-700 focus:outline-none focus:border-[#28A745]"
          />
          <span className="text-xs text-slate-500">days</span>
        </div>
      </div>
      
      <select 
        className="w-full bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-[#28A745] md:w-auto"
        value={modeValue}
        onChange={(e) => onModeChange(e.target.value)}
      >
        {Object.entries(zoneModes).map(([k, v]) => (
          <option key={k} value={k}>{v.label}</option>
        ))}
      </select>
    </div>
  );
}