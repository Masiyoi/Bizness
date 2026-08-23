// src/context/ThemeContext.tsx
//
// Global light/dark theme, available to the whole app (not just /profile).
// Persists to localStorage under the same key the old profile-only
// version used, so anyone who already picked dark mode keeps it.
// Applies a `dark` class to <html>, which Tailwind's class-based dark
// mode strategy reads (see tailwind.config.js darkMode: 'class').
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
type Theme = 'light' | 'dark';
interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}
const Ctx = createContext<ThemeCtx | null>(null);
const STORAGE_KEY = 'lp_profile_theme'; // unchanged key: preserves existing users' choice
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  const setTheme = (t: Theme) => setThemeState(t);
  const toggle = () => setThemeState(t => (t === 'dark' ? 'light' : 'dark'));
  return <Ctx.Provider value={{ theme, setTheme, toggle }}>{children}</Ctx.Provider>;
}
export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}