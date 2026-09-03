import { AlertTriangle, LoaderCircle, MessageCircleMore } from 'lucide-react';
import { useState } from 'react';
import { AnalyticsProvider, useAnalyticsContext } from '../../context/AnalyticsContext';
import { useBusinessConnection } from '../../hooks/useBusinessConnection';
import { useWhatsAppHistory } from '../../hooks/useWhatsAppHistory';
import { WhatsAppConnectionFlow } from '../preferences/sections/WhatsAppConnectionFlow';
import TopNav from './TopNav';
import Drawer from './shared/Drawer';
import SkeletonGrid from './shared/SkeletonGrid';
import ComingSoon from './sections/ComingSoon';
import Overview from './sections/Overview';
import Market from './sections/Market';
import Ads from './sections/Ads';
import Demand from './sections/Demand';
import Timing from './sections/Timing';
import Health from './sections/Health';
import whatsappIcon from '../../assets/images/whatsappicon.svg';
import NotificationStrip from '../shared/NotificationStrip';

const SECTION_COMPONENTS = {
  overview: Overview,
  market: Market,
  ads: Ads,
  demand: Demand,
  timing: Timing,
  health: Health,
};

export default function AnalyticsPage() {
  return (
    <AnalyticsProvider>
      <AnalyticsPageInner />
    </AnalyticsProvider>
  );
}

function AnalyticsPageInner() {
  const { data, loading, error, activeSection, refetch } = useAnalyticsContext();
  const { business, loading: businessLoading } = useBusinessConnection();
  const [isConnectionOpen, setIsConnectionOpen] = useState(false);
  const { loading: historyLoading, error: historyError, loadHistory } = useWhatsAppHistory(refetch);

  const ActiveSection = SECTION_COMPONENTS[activeSection];
  const hasNoAnalyticsActivity = data && data.funnel?.[0]?.count === 0;
  const isDisconnected = !businessLoading && business?.whatsapp_connected === false;
  const showHistoryPrompt = !businessLoading && business?.whatsapp_connected === true && hasNoAnalyticsActivity;

  return (
    <div className="relative flex h-full min-w-0 w-full flex-col overflow-hidden bg-[#F7FBF9]">
      <TopNav />

      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="h-full min-w-0 overflow-y-auto p-2 sm:p-3 md:p-4 lg:p-5">
          {!loading && !error && (isDisconnected || showHistoryPrompt) && (
            <NotificationStrip
              action={isDisconnected
                ? <><MessageCircleMore className="mr-1.5 inline h-3.5 w-3.5" />Connect WhatsApp</>
                : <><LoaderCircle className={`mr-1.5 inline h-3.5 w-3.5 ${historyLoading ? 'animate-spin' : ''}`} />{historyLoading ? 'Loading...' : 'Load History'}</>}
              onAction={isDisconnected ? () => setIsConnectionOpen(true) : loadHistory}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <img src={whatsappIcon} alt="WhatsApp" className="h-5 w-5 flex-shrink-0" />
                <span>{isDisconnected ? 'You Have No WhatsApp Accounts connected. Link your first account to see its analytics data!' : 'Load your chat history for the last 90 days to start seeing data here!'}</span>
              </div>
            </NotificationStrip>
          )}
          {historyError && <p className="mb-3 text-xs text-red-500">{historyError}</p>}

          <section className="mx-auto w-full min-w-0 rounded-[1.5rem] border border-white/80 bg-white/70 p-3 shadow-xl shadow-[#28A745]/5 backdrop-blur-xl sm:p-4 lg:p-5">
            {error ? (
              <div className="flex flex-col items-center gap-2 py-24 text-center">
                <AlertTriangle size={28} className="text-red-400" />
                <p className="text-[13px] font-medium text-red-500">{error}</p>
              </div>
            ) : loading || !data ? (
              <SkeletonGrid />
            ) : ActiveSection ? (
              <ActiveSection />
            ) : (
              <ComingSoon label={activeSection} />
            )}
          </section>
        </div>

        <Drawer />
        <WhatsAppConnectionFlow
          open={isConnectionOpen}
          onClose={() => setIsConnectionOpen(false)}
          onConnected={() => refetch()}
        />
      </div>
    </div>
  );
}