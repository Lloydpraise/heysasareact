import { useAuth } from '../../../context/useAuth';
import { GlassCard } from '../shared/ui';
import AutoChatCard from '../../home/AutoChatCard';

// Auto chat in Preferences: the same switch, audience and daily limit as on Home. It saves by itself.
export function ChatSection() {
  const { activeBusinessId: businessId } = useAuth();
  return (
    <GlassCard>
      <AutoChatCard businessId={businessId} flat />
    </GlassCard>
  );
}
