import { Check, CheckCheck, Reply } from 'lucide-react';

// Small horizontal stepper showing where the last outbound message sits in
// the WhatsApp delivery lifecycle: sent -> delivered -> read -> replied.
const STEPS = [
  { key: 'sent', label: 'Sent', Icon: Check },
  { key: 'delivered', label: 'Delivered', Icon: CheckCheck },
  { key: 'read', label: 'Read', Icon: CheckCheck },
  { key: 'replied', label: 'Replied', Icon: Reply },
];

const ORDER = { sent: 0, delivered: 1, read: 2, replied: 3 };

export default function ReadReceiptFlow({ status }) {
  const currentIndex = ORDER[status] ?? 0;

  return (
    <div className="flex items-center gap-1 px-6 py-2">
      {STEPS.map((step, i) => {
        const reached = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.key} className="flex items-center">
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-semibold ${
                isCurrent
                  ? 'bg-[#28A745]/10 text-[#28A745]'
                  : reached
                  ? 'text-slate-500'
                  : 'text-slate-300'
              }`}
            >
              <step.Icon size={11} />
              <span>{step.label}</span>
            </div>
            {!isLast && (
              <div className={`mx-0.5 h-px w-4 ${i < currentIndex ? 'bg-[#28A745]/40' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}