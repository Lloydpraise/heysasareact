import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Hero from './sections/Hero';
import LiveCounters from './sections/LiveCounters';
import HowItWorks from './sections/HowItWorks';
import FoundingOffer from './sections/FoundingOffer';
import FAQ from './sections/FAQ';
import { FinalCTA, Footer } from './sections/FinalCtaAndFooter';
import WaitlistModal from './WaitlistModal';

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);

  // Lets any link on the site (e.g. the /signup placeholder) open the
  // modal directly by sending someone to /?waitlist=1, instead of every
  // page needing its own copy of the form.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('waitlist') === '1') setModalOpen(true);
  }, []);

  const openWaitlist = () => setModalOpen(true);
  const closeWaitlist = () => {
    setModalOpen(false);
    if (window.location.search.includes('waitlist=1')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900">
      <nav className="fixed top-0 z-40 w-full border-b border-white/50 bg-[#FAFAFA]/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <span className="text-lg font-bold tracking-tight text-slate-900">
            HeySasa<span className="text-[#28A745]">!</span>
          </span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Log in
            </Link>
            <button
              onClick={openWaitlist}
              className="rounded-full bg-[#28A745] px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-[#28A745]/30 transition hover:bg-[#218838]"
            >
              Join Waitlist
            </button>
          </div>
        </div>
      </nav>

      <Hero onJoinWaitlist={openWaitlist} />
      <LiveCounters />
      <HowItWorks />
      <FoundingOffer onJoinWaitlist={openWaitlist} />
      <FAQ />
      <FinalCTA onJoinWaitlist={openWaitlist} />
      <Footer onJoinWaitlist={openWaitlist} />

      <WaitlistModal open={modalOpen} onClose={closeWaitlist} />
    </div>
  );
}
