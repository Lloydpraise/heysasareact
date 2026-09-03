// SequenceStepList.jsx
import SequenceStepCard from './SequenceStepCard';

export default function SequenceStepList({ steps }) {
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <SequenceStepCard key={step.id ?? i} step={step} index={i} />
      ))}
    </div>
  );
}