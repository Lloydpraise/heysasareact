import { useEffect, useState } from 'react';
import { PREF_SECTIONS } from '../../constants/preferencesConfig';
import PrefSidebar from './PrefSidebar';
import { FollowupSection } from './sections/FollowupSection';
import { MaterialsSection } from './sections/MaterialsSection';
import { BusinessSection } from './sections/BusinessSection';
import { WhatsAppSection } from './sections/WhatsAppSection';
import { BillingSection } from './sections/BillingSection';
import { Toast } from './shared/Toast';
import { usePreferences } from '../../hooks/usePreferences';
import { useMaterials } from '../../hooks/useMaterials';
import { saveMaterials } from '../../services/settingsService';
import { useToast } from '../../hooks/useToast';
import { mockBusiness, mockBalance } from '../../services/mockPreferences';
import NotificationStrip from '../shared/NotificationStrip';

export default function PreferencesPage({ initialSection = 'followup' }) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [isMobile, setIsMobile] = useState(false);
  const { prefs, business, updatePref, updateBusiness, savePrefs, isSaving, loadError, isDirty } = usePreferences();
  const materialsState = useMaterials();
  const { toast, showToast } = useToast();
  const hasUnsavedChanges = isDirty || materialsState.isDirty;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event) => setIsMobile(event.matches);
    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const sectionId = `preferences-section-${activeSection}`;
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSection]);

  const handleSave = async () => {
    if (!hasUnsavedChanges || isSaving) return;

    try {
      await savePrefs();
      await saveMaterials(materialsState.materials);
      materialsState.markSaved();
      showToast('Preferences saved successfully.');
    } catch (error) {
      showToast(error.message || 'Could not save preferences.', 'error');
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'followup':
        return <FollowupSection prefs={prefs} updatePref={updatePref} />;
      case 'materials':
        return <MaterialsSection {...materialsState} />;
      case 'business':
        return <BusinessSection business={business || mockBusiness} updateBusiness={updateBusiness} />;
      case 'whatsapp':
        return <WhatsAppSection />;
      case 'billing':
        return <BillingSection mockBalance={mockBalance} />;
      default:
        return <FollowupSection prefs={prefs} updatePref={updatePref} />;
    }
  };

  const activeLabel = PREF_SECTIONS.find((section) => section.id === activeSection)?.label ?? 'Follow-up';

  return (
    <div className="relative flex h-full flex-col gap-2 overflow-hidden p-2 md:flex-row md:gap-6 md:p-0">
      {!isMobile && (
        <PrefSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      )}

      <section className="w-full min-w-0 flex-1 overflow-y-auto rounded-[1.5rem] border border-white/80 bg-white/70 p-3 shadow-xl shadow-[#28A745]/5 backdrop-blur-xl sm:p-6 md:rounded-[1.75rem] md:p-4">
        {isMobile && (
          <div className="mb-3 rounded-[1rem] border border-slate-200/80 bg-white/80 p-2 shadow-sm">
            <PrefSidebar
              activeSection={activeSection}
              setActiveSection={setActiveSection}
            />
          </div>
        )}

        <div className="mb-4 border-b border-slate-200/80 pb-3 sm:mb-6 sm:pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64748B] sm:text-[11px] sm:tracking-[0.2em]">Section</p>
          <h2 className="mt-1 text-xl font-bold text-[#0F172A] sm:text-2xl">{activeLabel}</h2>
        </div>

        {loadError && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Could not load preferences: {loadError.message}</p>}
        {!business?.name && (
          <NotificationStrip>Please configure your preferences below to ensure HeySasa works on your business as you want it!</NotificationStrip>
        )}

        <div id={`preferences-section-${activeSection}`} className="scroll-mt-24">
          {renderSection()}
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-200/80 pt-4 sm:mt-8 sm:pt-5">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="w-full rounded-full bg-[#28A745] px-3 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#28A745]/20 transition hover:bg-[#1f8d3d] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:w-auto sm:px-4"
          >
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </section>

      <Toast toast={toast} />
    </div>
  );
}