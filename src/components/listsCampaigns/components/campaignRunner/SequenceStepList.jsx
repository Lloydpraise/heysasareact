// SequenceStepList.jsx
import { useEffect, useState } from 'react';
import SequenceStepCard from './SequenceStepCard';
import { fetchCampaignResponses } from '../../../../services/listsCampaignsService';

export default function SequenceStepList({ campaignId, steps, onOpenChat }) {
  const [responsesByStep, setResponsesByStep] = useState({});

  useEffect(() => {
    if (!campaignId) return undefined;
    let mounted = true;

    fetchCampaignResponses(campaignId)
      .then((rows) => {
        if (!mounted) return;
        const grouped = {};
        for (const row of rows) {
          if (!grouped[row.stepId]) grouped[row.stepId] = [];
          grouped[row.stepId].push(row);
        }
        setResponsesByStep(grouped);
      })
      .catch((error) => console.error('[SequenceStepList] Could not load responses:', error.message));

    return () => { mounted = false; };
  }, [campaignId]);

  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <SequenceStepCard
          key={step.id ?? i}
          step={step}
          index={i}
          responses={responsesByStep[step.id] || []}
          onOpenChat={onOpenChat}
        />
      ))}
    </div>
  );
}
