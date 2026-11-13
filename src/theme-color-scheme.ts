import { useCallback, useEffect, useState } from 'react';
import { useColorScheme, type ResolvedColorScheme } from 'react-bootstrap-pro';

/** Explicit reader choice, or `auto` to follow the browser preference. */
type ColorSchemePreference = 'auto' | ResolvedColorScheme;

const colorSchemeStorageKey = 'vited-theme-bootstrap-color-scheme';

function readColorSchemePreference(): ColorSchemePreference {
  try {
    const stored = localStorage?.getItem(colorSchemeStorageKey);
    return stored === 'light' || stored === 'dark' ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

function storeColorSchemePreference(preference: ResolvedColorScheme) {
  try {
    localStorage?.setItem(colorSchemeStorageKey, preference);
  } catch {
    // Storage may be unavailable, e.g. in private browsing.
  }
}

/**
 * Applies the reader's color scheme preference to Bootstrap's `data-bs-theme`, following the
 * browser preference until an explicit light or dark choice is stored, and returns the resolved
 * scheme together with a toggle.
 */
export function useThemeColorScheme(): [ResolvedColorScheme, () => void] {
  const [preference, setPreference] = useState<ColorSchemePreference>(readColorSchemePreference);
  const colorScheme = useColorScheme();
  const scheme = preference === 'auto' ? colorScheme : preference;

  useEffect(() => {
    if (preference !== 'auto') {
      document.documentElement.dataset.bsTheme = preference;
      return;
    }
    const media = matchMedia('(prefers-color-scheme: dark)');
    const applySystemColorScheme = () => {
      document.documentElement.dataset.bsTheme = media.matches ? 'dark' : 'light';
    };
    applySystemColorScheme();
    media.addEventListener('change', applySystemColorScheme);
    return () => media.removeEventListener('change', applySystemColorScheme);
  }, [preference]);

  const toggleColorScheme = useCallback(() => {
    const next = scheme === 'dark' ? 'light' : 'dark';
    storeColorSchemePreference(next);
    setPreference(next);
  }, [scheme]);

  return [scheme, toggleColorScheme];
}
