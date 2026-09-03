import { GlassCard } from '../shared/ui';

export function BusinessSection({ business, updateBusiness }) {
  const value = (key) => business?.[key] || '';

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlassCard className="w-full">
        <h3 className="text-sm font-semibold text-slate-800 mb-6">Business Profile</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Business Name</label>
            <input 
              type="text" 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#28A745] transition-colors"
              placeholder="Not set"
              value={value('name')}
              onChange={(event) => updateBusiness('name', event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Website URL</label>
            <input 
              type="url" 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#28A745] transition-colors"
              placeholder="Not set"
              value={value('website_url')}
              onChange={(event) => updateBusiness('website_url', event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Business Type</label>
            <select 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#28A745] transition-colors"
              value={value('type')}
              onChange={(event) => updateBusiness('type', event.target.value)}
            >
              <option value="">Not set</option>
              <option value="service">Service & B2B</option>
              <option value="ecommerce">E-Commerce & Retail</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Primary Currency</label>
            <select 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#28A745] transition-colors"
              value={value('currency')}
              onChange={(event) => updateBusiness('currency', event.target.value)}
            >
              <option value="">Not set</option>
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Timezone</label>
            <select 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#28A745] transition-colors"
              value={value('timezone')}
              onChange={(event) => updateBusiness('timezone', event.target.value)}
            >
              <option value="">Not set</option>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Owner Phone (Alerts)</label>
            <input 
              type="tel" 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#28A745] transition-colors"
              placeholder="Not set"
              value={value('owner_phone')}
              onChange={(event) => updateBusiness('owner_phone', event.target.value)}
            />
          </div>

        </div>
      </GlassCard>
    </div>
  );
}