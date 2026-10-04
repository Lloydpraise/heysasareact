import { useRef, useState } from 'react';
import { ImagePlus, LoaderCircle } from 'lucide-react';
import { GlassCard } from '../shared/ui';
import { useAuth } from '../../../context/useAuth';
import { uploadBusinessLogo } from '../../../services/businessService';

export function BusinessSection({ business, updateBusiness }) {
  const { activeBusinessId } = useAuth();
  const logoInput = useRef(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const value = (key) => business?.[key] || '';

  const handleLogoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setLogoUploading(true);
    setLogoError('');
    try {
      const logoUrl = await uploadBusinessLogo(activeBusinessId, file);
      updateBusiness('business_logo_url', logoUrl);
      window.dispatchEvent(new CustomEvent('heysasa:business-logo-updated', {
        detail: { businessId: activeBusinessId, logoUrl },
      }));
    } catch (error) {
      setLogoError(error.message || 'Could not upload the business logo.');
    } finally {
      setLogoUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GlassCard className="w-full">
        <h3 className="mb-6 text-sm font-semibold text-slate-800">Business Profile</h3>
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white/60 p-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white text-[#28A745]">
            {value('business_logo_url')
              ? <img src={value('business_logo_url')} alt="Business logo preview" className="h-full w-full object-contain p-1" />
              : <ImagePlus className="h-6 w-6" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">Business logo</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Add a PNG or JPG up to 5 MB. It will appear in the header and business switcher.</p>
          </div>
          <input ref={logoInput} type="file" accept="image/png,image/jpeg,.png,.jpg,.jpeg" className="sr-only" onChange={handleLogoChange} />
          <button
            type="button"
            onClick={() => logoInput.current?.click()}
            disabled={logoUploading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#28A745]/40 hover:text-[#28A745] disabled:cursor-wait disabled:opacity-60"
          >
            {logoUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
            {logoUploading ? 'Uploading...' : value('business_logo_url') ? 'Change logo' : 'Add logo'}
          </button>
          {logoError && <p role="alert" className="basis-full text-xs text-red-600 sm:basis-auto">{logoError}</p>}
        </div>
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
              value={value('industry')}
              onChange={(event) => updateBusiness('industry', event.target.value)}
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