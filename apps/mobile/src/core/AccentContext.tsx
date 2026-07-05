import React, {
  createContext, useContext,
  useState, useCallback, useEffect
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ACCENT_PRESETS = {
  cyan:   '#00F0FF',
  pink:   '#FF006E',
  purple: '#7C3AED',
  green:  '#00FF88',
  orange: '#FF6600',
} as const;

export type AccentKey = keyof typeof ACCENT_PRESETS;

interface AccentContextValue {
  accent: string;
  accentKey: AccentKey;
  setAccentKey: (key: AccentKey) => void;
  setCustomColor: (hex: string) => void;
}

const AccentContext = createContext<AccentContextValue>({
  accent: '#00F0FF',
  accentKey: 'cyan',
  setAccentKey: () => {},
  setCustomColor: () => {},
});

export function AccentProvider({
  children,
}: { children: React.ReactNode }) {
  const [accentKey, setAccentKeyState] =
    useState<AccentKey>('cyan');
  const [customHex, setCustomHex] =
    useState<string | null>(null);

  const setAccentKey = useCallback(
    (key: AccentKey) => setAccentKeyState(key),
    []
  );

  const setCustomColor = useCallback(
    (hex: string) => {
      setCustomHex(hex);
      AsyncStorage.setItem('custom_accent', hex);
    },
    []
  );

  useEffect(() => {
    AsyncStorage.getItem('custom_accent')
      .then(hex => { if (hex) setCustomHex(hex); });
  }, []);

  const accent = customHex
    ?? ACCENT_PRESETS[accentKey];

  return (
    <AccentContext.Provider value={{
      accent,
      accentKey,
      setAccentKey,
      setCustomColor,
    }}>
      {children}
    </AccentContext.Provider>
  );
}

export const useAccent = () => useContext(AccentContext);

// Обратная совместимость если где-то используется useTheme
export const useTheme = useAccent;
