'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { ThemeMode, ScriffleTheme } from '@/types/theme';
import { BUILTIN_THEMES } from '@/lib/builtinThemes';
import {
  parseScriffleTheme,
  serializeScriffleTheme,
  applyThemeToDocument,
} from '@/lib/themeParser';

interface ThemeContextType {
  theme: ThemeMode;
  activeCustomTheme: ScriffleTheme | null;
  customThemes: ScriffleTheme[];
  setTheme: (mode: ThemeMode, customThemeOrId?: string | ScriffleTheme) => void;
  importTheme: (rawConfig: string) => ScriffleTheme;
  exportTheme: (themeToExport?: ScriffleTheme) => void;
  deleteCustomTheme: (id: string) => void;
}

const STORAGE_KEY_MODE = 'scriffle_theme_mode';
const STORAGE_KEY_CUSTOM_ID = 'scriffle_active_custom_theme_id';
const STORAGE_KEY_USER_THEMES = 'scriffle_user_custom_themes';

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  activeCustomTheme: null,
  customThemes: BUILTIN_THEMES,
  setTheme: () => {},
  importTheme: () => BUILTIN_THEMES[0],
  exportTheme: () => {},
  deleteCustomTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [activeCustomTheme, setActiveCustomTheme] = useState<ScriffleTheme | null>(null);
  const [userThemes, setUserThemes] = useState<ScriffleTheme[]>([]);

  // Load user themes & active theme on mount
  useEffect(() => {
    let loadedUserThemes: ScriffleTheme[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USER_THEMES);
      if (stored) {
        loadedUserThemes = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse user themes from localStorage:', e);
    }
    setUserThemes(loadedUserThemes);

    const allThemes = [...BUILTIN_THEMES, ...loadedUserThemes];
    const savedMode = (localStorage.getItem(STORAGE_KEY_MODE) as ThemeMode) || 'light';
    const savedCustomId = localStorage.getItem(STORAGE_KEY_CUSTOM_ID);

    let activeThemeObj: ScriffleTheme | null = null;
    if (savedMode === 'custom' && savedCustomId) {
      activeThemeObj = allThemes.find((t) => t.id === savedCustomId) || BUILTIN_THEMES[0];
    }

    if (savedMode === 'custom' && activeThemeObj) {
      setThemeState('custom');
      setActiveCustomTheme(activeThemeObj);
      applyThemeToDocument(activeThemeObj, 'custom');
    } else if (savedMode === 'mono' || savedMode === 'dark' || savedMode === 'light') {
      setThemeState(savedMode);
      setActiveCustomTheme(null);
      applyThemeToDocument(null, savedMode);
    } else {
      setThemeState('light');
      setActiveCustomTheme(null);
      applyThemeToDocument(null, 'light');
    }
  }, []);

  const allAvailableThemes = [...BUILTIN_THEMES, ...userThemes];

  const setTheme = useCallback(
    (mode: ThemeMode, customThemeOrId?: string | ScriffleTheme) => {
      setThemeState(mode);
      localStorage.setItem(STORAGE_KEY_MODE, mode);

      if (mode === 'custom') {
        let themeObj: ScriffleTheme | undefined;
        if (typeof customThemeOrId === 'object' && customThemeOrId !== null) {
          themeObj = customThemeOrId;
        } else if (typeof customThemeOrId === 'string') {
          themeObj = allAvailableThemes.find((t) => t.id === customThemeOrId);
        }

        if (!themeObj) {
          themeObj = activeCustomTheme || BUILTIN_THEMES[0];
        }

        setActiveCustomTheme(themeObj);
        localStorage.setItem(STORAGE_KEY_CUSTOM_ID, themeObj.id);
        applyThemeToDocument(themeObj, 'custom');
      } else {
        setActiveCustomTheme(null);
        localStorage.removeItem(STORAGE_KEY_CUSTOM_ID);
        applyThemeToDocument(null, mode);
      }
    },
    [allAvailableThemes, activeCustomTheme]
  );

  const importTheme = useCallback(
    (rawConfig: string): ScriffleTheme => {
      const parsed = parseScriffleTheme(rawConfig);
      // Check if ID collides with builtin or existing, append timestamp if needed
      const exists = allAvailableThemes.some((t) => t.id === parsed.id);
      const finalTheme: ScriffleTheme = exists
        ? { ...parsed, id: `${parsed.id}-${Date.now()}` }
        : parsed;

      const updatedUserThemes = [...userThemes.filter((t) => t.id !== finalTheme.id), finalTheme];
      setUserThemes(updatedUserThemes);
      localStorage.setItem(STORAGE_KEY_USER_THEMES, JSON.stringify(updatedUserThemes));

      setTheme('custom', finalTheme);
      return finalTheme;
    },
    [allAvailableThemes, userThemes, setTheme]
  );

  const exportTheme = useCallback(
    (themeToExport?: ScriffleTheme) => {
      const target = themeToExport || activeCustomTheme || BUILTIN_THEMES[0];
      const serialized = serializeScriffleTheme(target);
      const blob = new Blob([serialized], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${target.id}.scrifflemes`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [activeCustomTheme]
  );

  const deleteCustomTheme = useCallback(
    (id: string) => {
      const updated = userThemes.filter((t) => t.id !== id);
      setUserThemes(updated);
      localStorage.setItem(STORAGE_KEY_USER_THEMES, JSON.stringify(updated));

      if (activeCustomTheme?.id === id) {
        setTheme('light');
      }
    },
    [userThemes, activeCustomTheme, setTheme]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        activeCustomTheme,
        customThemes: allAvailableThemes,
        setTheme,
        importTheme,
        exportTheme,
        deleteCustomTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
