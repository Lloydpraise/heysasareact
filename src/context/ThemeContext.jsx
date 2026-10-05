import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeContext } from './theme-context-value';
import { useAuth } from './useAuth';

// Light is the default. The choice is remembered per browser/device.
// NOTE: index.html has a tiny inline script that applies this same key before
// first paint (no light flash on reload) — keep the key in sync with it.
export const THEME_STORAGE_KEY = 'heysasa-theme';

// Public marketing/auth pages keep their own light design; dark mode only
// themes the signed-in app.
const PUBLIC_PATHS = ['/login', '/signup', '/pricing', '/terms', '/privacy', '/contact', '/contact-us'];

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }) {
  const { user, loading } = useAuth();
  const [theme, setThemeState] = useState(readStoredTheme);

  const setTheme = useCallback((next) => {
    const value = next === 'dark' ? 'dark' : 'light';
    const root = document.documentElement;
    // Cross-fade colors for a moment so the flip feels smooth, not jarring.
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 350);
    setThemeState(value);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value);
    } catch {
      /* private mode / storage disabled: still works for this session */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [setTheme, theme]);

  // Keep other open tabs in step with this one.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === THEME_STORAGE_KEY) setThemeState(event.newValue === 'dark' ? 'dark' : 'light');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Apply to <html>. While auth is still resolving we leave whatever the
  // pre-paint script decided, so a signed-in reload never flashes light.
  useEffect(() => {
    if (loading) return;
    const onPublicPage = PUBLIC_PATHS.includes(window.location.pathname);
    const dark = theme === 'dark' && Boolean(user) && !onPublicPage;
    document.documentElement.classList.toggle('dark', dark);
  }, [theme, user, loading]);

  const value = useMemo(
    () => ({ theme, isDark: theme === 'dark', setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
