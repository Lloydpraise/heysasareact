import { useSyncExternalStore } from 'react';

// Same breakpoint Tailwind's `md:` uses (768px), so JS and CSS agree on what
// "mobile" means. Phones (and narrow windows) get the mobile layer; tablets in
// landscape and desktops keep the existing desktop layout untouched.
const QUERY = '(max-width: 767px)';

function subscribe(callback) {
  const mediaQuery = window.matchMedia(QUERY);
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useIsMobile;
