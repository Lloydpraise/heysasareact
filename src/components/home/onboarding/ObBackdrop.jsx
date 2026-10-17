// The stage the whole onboarding plays on: a deep green-black room with two slow, breathing lights.
// All motion is CSS. With "reduce motion" switched on, every animation is switched off and each screen shows its
// finished frame, so nothing is ever hidden behind an animation.
const CSS = `
.ob{--ob-green:#28A745;--ob-lime:#7CF29A;--ob-orange:#FF8C00}
.ob *{box-sizing:border-box}
@keyframes ob-drift{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(6%,-5%,0) scale(1.12)}}
@keyframes ob-drift2{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-7%,6%,0) scale(1.15)}}
@keyframes ob-fadeup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@keyframes ob-pop{0%{opacity:0;transform:scale(.6)}70%{transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}
@keyframes ob-rise{0%{opacity:0;transform:translateY(40px) scale(.9)}15%{opacity:.9}85%{opacity:.5}100%{opacity:0;transform:translateY(-190px) scale(1)}}
@keyframes ob-ring{0%{opacity:.55;transform:scale(.7)}100%{opacity:0;transform:scale(1.9)}}
@keyframes ob-glowbtn{0%,100%{box-shadow:0 0 0 0 rgba(40,167,69,.55),0 10px 30px rgba(40,167,69,.35)}50%{box-shadow:0 0 0 12px rgba(40,167,69,0),0 10px 40px rgba(40,167,69,.55)}}
@keyframes ob-you{0%{left:0;opacity:0}6%{opacity:1}24%,86%{left:calc(100% - 38px);opacity:1}96%,100%{left:calc(100% - 38px);opacity:0}}
@keyframes ob-them{0%{left:0;opacity:0}6%{opacity:1}86%{left:34%;opacity:1}96%,100%{left:34%;opacity:0}}
@keyframes ob-flag{0%,22%{opacity:0;transform:scale(.4)}30%,86%{opacity:1;transform:scale(1)}96%,100%{opacity:0}}
@keyframes ob-draw{from{stroke-dashoffset:var(--len,600)}to{stroke-dashoffset:0}}
@keyframes ob-fall{0%{opacity:0;transform:translate3d(0,-30px,0) rotate(0)}10%{opacity:1}100%{opacity:0;transform:translate3d(var(--dx,0),340px,0) rotate(540deg)}}
@keyframes ob-shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes ob-tick{from{stroke-dashoffset:40}to{stroke-dashoffset:0}}
@keyframes ob-spin{to{transform:rotate(360deg)}}
.ob-beat{animation:ob-fadeup .7s cubic-bezier(.2,.8,.2,1) both}
.ob-pop{animation:ob-pop .6s cubic-bezier(.2,.9,.3,1.2) both}
.ob-glowbtn{animation:ob-glowbtn 2.6s ease-in-out infinite}
.ob-shimmer{background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.12) 50%,rgba(255,255,255,.04) 75%);background-size:200% 100%;animation:ob-shimmer 1.6s linear infinite}
.ob-glass{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
@media (prefers-reduced-motion:reduce){
  .ob *,.ob *::before,.ob *::after{animation:none!important;transition:none!important}
}
`;

export default function ObBackdrop() {
  return (
    <>
      <style>{CSS}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[70%] w-[90%] rounded-full bg-[#28A745]/25 blur-[90px]" style={{ animation: 'ob-drift 16s ease-in-out infinite' }} />
        <div className="absolute -bottom-1/4 -right-1/4 h-[60%] w-[80%] rounded-full bg-[#FF8C00]/15 blur-[100px]" style={{ animation: 'ob-drift2 20s ease-in-out infinite' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
      </div>
    </>
  );
}
