import { useEffect, useState } from 'react';
import PlaygroundSidebar from './PlaygroundSidebar';
import { TestSection } from './sections/TestSection';
import { ReplaySection } from './sections/ReplaySection';
import { VersionHistorySection } from './sections/VersionHistorySection';
import { Toast } from '../preferences/shared/Toast';
import NotificationStrip from '../shared/NotificationStrip';
import { usePersonaPack } from '../../hooks/usePersonaPack';
import { useLiveChat } from '../../hooks/useLiveChat';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';

export default function PlaygroundPage({ businessId }) {
  const [activeSection, setActiveSection] = useState('test');
  const [productCount, setProductCount] = useState(null);

  const personaPack = usePersonaPack(businessId);
  const liveChat = useLiveChat(businessId);
  const { toast, showToast } = useToast();

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
        return <TestSection businessId={businessId} personaPack={personaPack} liveChat={liveChat} showToast={showToast} />;
      case 'replay':
        return <ReplaySection businessId={businessId} liveChat={liveChat} />;
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
        return <TestSection businessId={businessId} personaPack={personaPack} liveChat={liveChat} showToast={showToast} />;
    }
  };

  return (
    <div className="relative flex h-full min-w-0 w-full flex-1 flex-col overflow-hidden bg-[#F7FBF9]">
      <PlaygroundSidebar activeSection={activeSection} setActiveSection={setActiveSection} productCount={productCount} />

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 min-w-0 flex-col p-2 sm:p-3 md:p-4">
          {!personaPack.pack && (
            <NotificationStrip>No persona pack has been generated for this business yet — run the persona pack pipeline first, then come back here to fine-tune it.</NotificationStrip>
          )}
          <section className="mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/70 p-3 shadow-xl shadow-[#28A745]/5 backdrop-blur-xl sm:p-4 lg:p-5">
            {renderSection()}
          </section>
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  );
}