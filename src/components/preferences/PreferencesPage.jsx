import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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
import { useIsMobile } from '../../hooks/useIsMobile';
import { useBackClose } from '../../hooks/useBackClose';
import { mockBusiness } from '../../services/mockPreferences';
import NotificationStrip from '../shared/NotificationStrip';

// Desktop: sidebar + section, as before.
// Phone: a list of sections; tapping one opens it as its own screen that slides
// in (Back button / arrow returns to the list) with a Save bar that stays put.
// `startInSection` lets other screens (e.g. Business settings) skip the list.
export default function PreferencesPage({ initialSection = 'followup', startInSection = false }) {
  const [activeSection, setActiveSection] = useState(initialSection);
  const [mobileSectionOpen, setMobileSectionOpen] = useState(startInSection);
  const isMobile = useIsMobile();
  const { prefs, business, updatePref, updateBusiness, savePrefs, isSaving, loadError, isDirty } = usePreferences();
  const materialsState = useMaterials();
  const { toast, showToast } = useToast();
  const hasUnsavedChanges = isDirty || materialsState.isDirty;

  const detailOpen = isMobile && mobileSectionOpen;
  useBackClose(detailOpen, () => setMobileSectionOpen(false));

  useEffect(() => {
    if (isMobile) return;
    const sectionId = `preferences-section-${activeSection}`;
    const sectionElement = document.getElementById(sectionId);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSection, isMobile]);

  const handleSave = async () => {
    if (!hasUnsavedChanges || isSaving) return;

    try {
      await savePrefs();
      await saveMaterials(materialsState.materials);
      materialsState.markSaved();
      showToast('Preferences saved successfully.');
      navigator.vibrate?.(10);
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
        return <BillingSection />;
      default:
        return <FollowupSection prefs={prefs} updatePref={updatePref} />;
    }
  };

  const activeLabel = PREF_SECTIONS.find((section) => section.id === activeSection)?.label ?? 'Follow-up';
  const showSave = activeSection !== 'billing';

  const body = (
    <>
      {loadError && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Could not load preferences: {loadError.message}</p>}
      {!business?.name && (
        <NotificationStrip>Please configure your preferences below to ensure HeySasa works on your business as you want it!</NotificationStrip>
      )}
      <div id={`preferences-section-${activeSection}`} className="scroll-mt-24">
        {renderSection()}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#F7FBF9]">
        {/* Section list */}
        <div className="m-scroll min-h-0 flex-1 px-4 pb-6 pt-5">
          <h1 className="text-[24px] font-extrabold leading-tight tracking-tight text-slate-900">Preferences</h1>
          <p className="mb-4 mt-0.5 text-[13.5px] text-slate-500">Tune how HeySasa works for your business.</p>
          {!business?.name && (
            <NotificationStrip>Set up your business details so HeySasa can work the way you want.</NotificationStrip>
          )}
          <div className="flex flex-col gap-2.5">
            {PREF_SECTIONS.map((section, index) => (
              <button
                key={section.id}
                type="button"
                onClick={() => { setActiveSection(section.id); setMobileSectionOpen(true); }}
                className="m-stagger flex min-h-[72px] w-full items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-3.5 text-left shadow-sm"
                style={{ '--i': index }}
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#28A745]/10 text-[#1f8d3d] [&_svg]:h-6 [&_svg]:w-6"
                  dangerouslySetInnerHTML={{ __html: section.icon }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-[16px] font-bold text-slate-900">{section.label}</span>
                  <span className="block text-[13px] text-slate-500">{section.sub}</span>
                </span>
                {section.id === activeSection && hasUnsavedChanges && (
                  <span className="rounded-full bg-[#FF8C00]/15 px-2.5 py-1 text-[11px] font-bold text-[#FF8C00]">Unsaved</span>
                )}
                <ChevronRight size={20} className="shrink-0 text-slate-300" />
              </button>
            ))}
          </div>
        </div>

        {/* Section screen */}
        {mobileSectionOpen && (
          <div className="m-slide-in absolute inset-0 z-20 flex flex-col bg-[#F7FBF9]">
            <div className="flex h-14 shrink-0 items-center gap-1 border-b border-slate-200 bg-white/90 px-2 backdrop-blur-md">
              <button type="button" onClick={() => setMobileSectionOpen(false)} aria-label="Back to preferences" className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700 active:bg-slate-100">
                <ArrowLeft size={22} />
              </button>
              <h2 className="text-[17px] font-bold text-slate-900">{activeLabel}</h2>
            </div>
            <div className="m-scroll min-h-0 flex-1 px-3 pb-6 pt-4">{body}</div>
            {showSave && (
              <div className="shrink-0 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-3 backdrop-blur-md">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#28A745] text-[15px] font-bold text-white shadow-lg shadow-[#28A745]/25 transition disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                >
                  {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save changes' : 'All changes saved'}
                </button>
              </div>
            )}
          </div>
        )}

        <Toast toast={toast} />
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col gap-2 overflow-hidden p-2 md:flex-row md:gap-6 md:p-0">
      <PrefSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      <section className="w-full min-w-0 flex-1 overflow-y-auto rounded-[1.5rem] border border-white/80 bg-white/70 p-3 shadow-xl shadow-[#28A745]/5 backdrop-blur-xl sm:p-6 md:rounded-[1.75rem] md:p-4">
        <div className="mb-4 border-b border-slate-200/80 pb-3 sm:mb-6 sm:pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64748B] sm:text-[11px] sm:tracking-[0.2em]">Section</p>
          <h2 className="mt-1 text-xl font-bold text-[#0F172A] sm:text-2xl">{activeLabel}</h2>
        </div>

        {body}

        {showSave && (
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
        )}
      </section>

      <Toast toast={toast} />
    </div>
  );
}
