import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/heysasalogo.png';
import Pricing from './sections/Pricing';
import { Footer } from './sections/FinalCtaAndFooter';
import WaitlistModal from './WaitlistModal';

export default function PricingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const openWaitlist = () => setModalOpen(true);
  const closeWaitlist = () => setModalOpen(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900">
      <nav className="fixed top-0 z-40 w-full border-b border-white/50 bg-[#FAFAFA]/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link to="/" aria-label="HeySasa! home" className="inline-flex items-center">
            <img src={logo} alt="HeySasa! logo" className="h-10 w-auto object-contain sm:h-12" />
          </Link>
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

      {/* pt-20 clears the fixed nav — LandingPage's Hero has its own top
          padding baked in, Pricing doesn't, so it's added here instead. */}
      <div className="pt-20">
        <Pricing onJoinWaitlist={openWaitlist} />
      </div>

      <Footer onJoinWaitlist={openWaitlist} />

      <WaitlistModal open={modalOpen} onClose={closeWaitlist} />
    </div>
  );
}
