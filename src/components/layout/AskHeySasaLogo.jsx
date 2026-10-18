import logo from '../../assets/images/heysasalogo.png';
import { useAssistant } from '../../context/useAssistant';
import './navLock.css';

// The HeySasa logo in the top bar IS the Ask HeySasa button. On Home (once setup is done) a very soft ring breathes
// out from it every few seconds, so the owner learns it can be tapped without a second button taking up space.
export default function AskHeySasaLogo({ pulse = false, className = '', imgClassName = '' }) {
  const { open } = useAssistant();
  return (
    <button
      type="button"
      onClick={() => open({ surface: 'general', title: 'Ask HeySasa' })}
      aria-label="Open Ask HeySasa"
      title="Ask HeySasa"
      className={`relative shrink-0 ${className}`}
    >
      {pulse && <span aria-hidden="true" className="ask-ring pointer-events-none absolute inset-0 rounded-lg" />}
      <img src={logo} alt="HeySasa" className={`${imgClassName} ${pulse ? 'ask-breathe' : ''}`} />
    </button>
  );
}
