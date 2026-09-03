// listsCampaigns/components/listManager/AutoBadge.jsx
import { AUTO_BADGE_COLOR } from '../../constants';

export default function AutoBadge() {
  return (
    <span
      className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white"
      style={{ backgroundColor: AUTO_BADGE_COLOR }}
    >
      Auto
    </span>
  );
}