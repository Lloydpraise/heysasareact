import { useEffect, useState } from 'react';
import PlaygroundSidebar from './PlaygroundSidebar';
import { TestSection } from './sections/TestSection';
import { ReplaySection } from './sections/ReplaySection';
import { SkillsFlowsSection } from './sections/SkillsFlowsSection';
import { VersionHistorySection } from './sections/VersionHistorySection';
import { Toast } from '../preferences/shared/Toast';
import NotificationStrip from '../shared/NotificationStrip';
import { usePersonaPack } from '../../hooks/usePersonaPack';
import { useLiveChat } from '../../hooks/useLiveChat';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/useAuth';
import { supabase } from '../../lib/supabase';
import { generatePersonaPack } from '../../services/personaPackService';

export default function PlaygroundPage({ businessId }) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('test');
  const [productCount, setProductCount] = useState(null);
  const [isGeneratingPersona, setIsGeneratingPersona] = useState(false);

  const personaPack = usePersonaPack(businessId);
  const liveChat = useLiveChat(businessId);
  const { toast, showToast } = useToast();

  const handleGeneratePersona = async () => {
    if (!businessId) {
      showToast('Business context is missing.', 'error');
      return;
    }

    setIsGeneratingPersona(true);
    try {
      const result = await generatePersonaPack(businessId);
      await personaPack.reload();
      showToast(result?.message || 'New AI persona generated.');
    } catch (error) {
      showToast(error.message || 'Could not generate a new AI persona.', 'error');
    } finally {
      setIsGeneratingPersona(false);
    }
  };

  useEffect(() => {
    if (!businessId) return;
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .then(({ count }) => setProductCount(count));
  }, [businessId]);

  const renderSection = () => {
    switch (activeSection) {
      case 'test':
        return <TestSection businessId={businessId} personaPack={personaPack} liveChat={liveChat} showToast={showToast} isAuthenticated={Boolean(user)} />;
      case 'replay':
        return <ReplaySection businessId={businessId} liveChat={liveChat} />;
      case 'skills':
        return <SkillsFlowsSection key={businessId} businessId={businessId} showToast={showToast} />;
      case 'history':
        return (
          <VersionHistorySection
            businessId={businessId}
            onRolledBack={() => {
              personaPack.reload();
              showToast('Rolled back — persona pack updated.');
            }}
          />
        );
      default:
        return <TestSection businessId={businessId} personaPack={personaPack} liveChat={liveChat} showToast={showToast} isAuthenticated={Boolean(user)} />;
    }
  };

  return (
    <div className="relative flex h-full min-w-0 w-full flex-1 flex-col overflow-hidden bg-[#F7FBF9]">
      <PlaygroundSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        productCount={productCount}
        onGeneratePersona={handleGeneratePersona}
        isGeneratingPersona={isGeneratingPersona}
      />

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 min-w-0 flex-col p-2 sm:p-3 md:p-4 max-md:px-3 max-md:pb-2 max-md:pt-3">
          {!personaPack.pack && (
            <div className={activeSection === 'test' ? 'max-md:hidden' : ''}>
            <NotificationStrip action="Generate New AI Persona" onAction={handleGeneratePersona}>
              To personalize your AI, a detailed persona pack is needed. Generate it automatically here.
            </NotificationStrip>
            </div>
          )}
          <section className="mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/70 p-3 shadow-xl shadow-[#28A745]/5 backdrop-blur-xl sm:p-4 lg:p-5 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none max-md:backdrop-blur-none">
            {renderSection()}
          </section>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}