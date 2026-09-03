import { useEffect, useState } from 'react';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { fetchPersonaPackHistory, rollbackPersonaPack } from '../../../services/personaPackService';

export function VersionHistorySection({ businessId, onRolledBack }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rollingBack, setRollingBack] = useState(null);

  const load = () => {
    setLoading(true);
    fetchPersonaPackHistory(businessId)
      .then(setVersions)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (businessId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const handleRollback = async (version) => {
    setRollingBack(version);
    try {
      await rollbackPersonaPack(businessId, version);
      load();
      onRolledBack?.();
    } finally {
      setRollingBack(null);
    }
  };

  if (loading) return <p className="text-sm text-[#94A3B8]">Loading version history…</p>;

  return (
    <div className="rounded-[1.25rem] border border-white/80 bg-white/70 shadow-lg shadow-[#28A745]/5 backdrop-blur-xl">
      <div className="divide-y divide-slate-200/80">
        {versions.map((v) => (
          <div key={v.version} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#0F172A]">v{v.version}</span>
                {v.is_active && (
                  <span className="flex items-center gap-1 rounded-full bg-[#28A745]/10 px-2 py-0.5 text-[11px] font-medium text-[#1f8d3d]">
                    <CheckCircle2 size={11} /> Active
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-[#94A3B8]">
                {v.generated_by} · {new Date(v.generated_at).toLocaleString()}
              </p>
            </div>
            {!v.is_active && (
              <button
                onClick={() => handleRollback(v.version)}
                disabled={rollingBack !== null}
                className="flex items-center gap-1.5 rounded-full border border-slate-200/80 px-3 py-1.5 text-xs font-medium text-[#64748B] hover:border-[#28A745]/40 hover:text-[#1f8d3d] disabled:opacity-40"
              >
                <RotateCcw size={12} /> {rollingBack === v.version ? 'Rolling back…' : 'Roll back to this'}
              </button>
            )}
          </div>
        ))}
        {versions.length === 0 && <p className="px-4 py-6 text-center text-sm text-[#94A3B8]">No version history yet.</p>}
      </div>
    </div>
  );
}