import { useEffect, useRef, useState } from 'react';
import { GUIDES } from './guideData';

// All guide animations are plain HTML and CSS: no video, no images, nothing to load. Each loops in under 8 seconds.
// With "reduce motion" switched on they show their last frame and stand still.
const CSS = `
.hsg{position:relative;height:96px;border-radius:12px;background:#f8fafc;padding:10px;overflow:hidden;font-size:11px;color:#475569}
.hsg *{box-sizing:border-box}
.hsg-bar{height:10px;border-radius:5px;background:#cbd5e1}
.hsg-row{display:flex;align-items:center;gap:6px;margin-bottom:6px;opacity:0;animation:hsg-in 7s infinite both}
.hsg-tick{margin-left:auto;color:#28A745;font-weight:700;opacity:0;animation:hsg-late 7s infinite both}
.hsg-btn{position:absolute;right:10px;bottom:8px;padding:3px 10px;border-radius:999px;background:#28A745;color:#fff;font-weight:600;animation:hsg-pulse 7s infinite both}
.hsg-badge{margin-left:auto;padding:1px 7px;border-radius:999px;background:#28A745;color:#fff;font-weight:600;opacity:0;animation:hsg-late 7s infinite both}
.hsg-glow{animation:hsg-glow 7s infinite both}
.hsg-cell{flex:1;height:18px;background:#e2e8f0}
.hsg-cell.n{background:#334155}
.hsg-dot{position:absolute;top:44px;width:10px;height:10px;border-radius:50%;background:#28A745;opacity:0;animation:hsg-dot 7s infinite both}
.hsg-bubble{max-width:70%;padding:4px 8px;border-radius:10px;opacity:0;animation:hsg-in 7s infinite both}
.hsg-bubble.me{background:#fff;border:1px solid #e2e8f0}
.hsg-bubble.ai{background:#dcf8c6;margin-left:auto}
.hsg-type{display:inline-block;letter-spacing:2px;animation:hsg-blink 1s infinite}
.hsg-pill{padding:3px 8px;border-radius:999px;background:#fff;border:1px solid #cbd5e1;opacity:0;animation:hsg-in 7s infinite both}
.hsg-stop{opacity:0;animation:hsg-stop 7s infinite both}
@keyframes hsg-in{0%,2%{opacity:0;transform:translateY(6px)}10%,90%{opacity:1;transform:none}100%{opacity:0}}
@keyframes hsg-late{0%,48%{opacity:0}56%,90%{opacity:1}100%{opacity:0}}
@keyframes hsg-pulse{0%,35%,60%,100%{transform:scale(1)}45%{transform:scale(1.12)}}
@keyframes hsg-glow{0%,40%{background:transparent}50%,90%{background:#dcfce7}100%{background:transparent}}
@keyframes hsg-dot{0%,100%{opacity:0}20%,35%{opacity:1}}
@keyframes hsg-blink{50%{opacity:.25}}
@keyframes hsg-stop{0%,60%{opacity:0}68%,92%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.hsg *{animation:none!important;opacity:1!important;transform:none!important}}
`;

const delay = (s) => ({ animationDelay: `${s}s` });

function ApprovePlan() {
  return (
    <div className="hsg" aria-hidden="true">
      {[0, 0.5, 1].map((d) => (
        <div key={d} className="hsg-row" style={delay(d / 4)}><div className="hsg-bar" style={{ width: `${70 - d * 15}%` }} /><span className="hsg-tick">✓</span></div>
      ))}
      <div className="hsg-btn">Approve</div>
    </div>
  );
}

function ReadyToBuy() {
  return (
    <div className="hsg" aria-hidden="true">
      <div className="hsg-row" style={delay(0)}><div className="hsg-bar" style={{ width: '45%' }} /></div>
      <div className="hsg-row hsg-glow" style={delay(0.2)}><div className="hsg-bar" style={{ width: '55%', background: '#86efac' }} /><span className="hsg-badge">Ready to buy</span></div>
      <div className="hsg-row" style={delay(0.4)}><div className="hsg-bar" style={{ width: '38%' }} /></div>
    </div>
  );
}

function QuietHours() {
  return (
    <div className="hsg" aria-hidden="true">
      <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden' }}>
        {Array.from({ length: 24 }, (_, h) => <div key={h} className={`hsg-cell${h < 8 || h >= 21 ? ' n' : ''}`} />)}
      </div>
      <div className="hsg-dot" style={{ left: '38%', ...delay(0) }} /><div className="hsg-dot" style={{ left: '52%', ...delay(0.6) }} /><div className="hsg-dot" style={{ left: '66%', ...delay(1.2) }} />
      <div style={{ position: 'absolute', left: 10, right: 10, bottom: 8, display: 'flex', justifyContent: 'space-between' }}><span>quiet</span><span>open: messages go out</span><span>quiet</span></div>
    </div>
  );
}

function AutoChat() {
  return (
    <div className="hsg" aria-hidden="true">
      <div className="hsg-bubble me" style={delay(0)}>Do you have this in red? <span style={{ color: '#94a3b8' }}>2:14 am</span></div>
      <div className="hsg-bubble ai" style={{ ...delay(0.9), marginTop: 6 }}><span className="hsg-type">...</span></div>
      <div className="hsg-bubble ai" style={{ ...delay(1.6), marginTop: 6, position: 'absolute', right: 10, top: 40 }}>Yes! Red is in stock.</div>
    </div>
  );
}

function FollowUpPlan() {
  return (
    <div className="hsg" aria-hidden="true">
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span className="hsg-pill" style={delay(0)}>Day 1</span><span className="hsg-pill" style={delay(0.3)}>Day 3</span>
        <span className="hsg-pill hsg-stop" style={{ background: '#dcf8c6' }}>They reply!</span>
        <span className="hsg-pill hsg-stop" style={{ textDecoration: 'line-through', color: '#94a3b8' }}>Day 5</span>
      </div>
      <div className="hsg-stop" style={{ marginTop: 14 }}>The plan stops. Now you talk to them.</div>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const GUIDE_SCENES = { 'approve-plan': ApprovePlan, 'ready-to-buy': ReadyToBuy, 'quiet-hours': QuietHours, 'auto-chat': AutoChat, 'follow-up-plan': FollowUpPlan };

// A small "?" next to a feature. It opens a short looping animation and one plain sentence, and stays out of the way.
export default function HelpGuide({ id, className = '' }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const guide = GUIDES[id];
  const Scene = GUIDE_SCENES[id];

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (event.type === 'keydown' ? event.key === 'Escape' : !box.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [open]);

  if (!guide || !Scene) return null;
  return (
    <span ref={box} className={`relative inline-block ${className}`}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={`How it works: ${guide.title}`}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-bold text-slate-500 hover:border-[#28A745] hover:text-[#27500A]">?</button>
      {open && (
        <div role="dialog" aria-label={guide.title} className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg">
          <style>{CSS}</style>
          <Scene />
          <div className="mt-2 text-sm font-semibold text-slate-900">{guide.title}</div>
          <p className="mt-0.5 text-xs text-slate-500">{guide.text}</p>
        </div>
      )}
    </span>
  );
}
