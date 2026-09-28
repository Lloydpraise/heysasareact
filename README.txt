HeySasa Pricing Page — file drop-in guide
==========================================

NEW FILES (add these):
- src/components/landing/PricingPage.jsx
- src/components/landing/sections/Pricing.jsx

CHANGED FILES (replace these — each only has small edits):
- src/App.jsx
    -> added PricingPage import + a public "/pricing" route
- src/components/landing/LandingPage.jsx
    -> added a "Pricing" link in the top nav
- src/components/landing/sections/FinalCtaAndFooter.jsx
    -> added a "Pricing" link in the footer's Explore column

Nothing else in your repo was touched. Just copy these 5 files into the
matching paths in Lloydpraise/heysasareact, overwriting the 3 changed ones.

Open questions before you ship (see chat for full detail):
1. Growth's free AI message allowance was blank in your ChatGPT draft —
   I gave it 2,000/mo to match Essentials/Scale. Confirm that's right.
2. Growth vs Scale daily message ranges overlap (250-5,000 vs
   2,000-10,000) — explained via the WhatsApp info icon, not fixed.
