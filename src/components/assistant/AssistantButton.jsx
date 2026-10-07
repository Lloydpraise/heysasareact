import { Sparkles } from 'lucide-react';
import { useAssistant } from '../../context/useAssistant';

// The small sparkle button that opens Ask HeySasa for one box. Pass the same options as useAssistant().open().
// `variant="pill"` shows a label (used where there is room and the owner might be stuck, like an empty flow).
export default function AssistantButton({ variant = 'icon', label = 'Write with AI', className = '', ...options }) {
  const { open } = useAssistant();
  const handleClick = () => open(options);

  if (variant === 'pill') {
    return (
      <button type="button" onClick={handleClick} className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[#28A745]/30 bg-[#28A745]/10 px-3 text-xs font-semibold text-[#1f8d3d] transition hover:bg-[#28A745]/20 ${className}`}>
        <Sparkles size={13} /> {label}
      </button>
    );
  }
  return (
    <button
      type="button" onClick={handleClick} title={label} aria-label={label}
      className={`flex h-7 w-7 items-center justify-center rounded-lg border border-[#28A745]/30 bg-white text-[#28A745] shadow-sm transition hover:bg-[#28A745]/10 ${className}`}
    >
      <Sparkles size={14} />
    </button>
  );
}
