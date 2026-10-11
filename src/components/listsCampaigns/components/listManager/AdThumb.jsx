import { useState } from 'react';
import { Megaphone } from 'lucide-react';

// The picture from the ad (when we have one), otherwise a quiet megaphone.
export default function AdThumb({ src, size = 36, className = '' }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (src && !failed) {
    return <img src={src} alt="" onError={() => setFailed(true)} style={style} className={`shrink-0 rounded-lg object-cover ring-1 ring-slate-200 ${className}`} />;
  }
  return (
    <span style={style} className={`flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 ${className}`}>
      <Megaphone size={Math.round(size * 0.45)} />
    </span>
  );
}
