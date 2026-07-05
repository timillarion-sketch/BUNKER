import { Platform } from 'react-native';

export const theme = {
  colors: {
    bg: '#050508',
    surface: 'rgba(25,25,27,0.65)',
    card: 'rgba(25,25,27,0.65)',
    border: 'rgba(255,255,255,0.08)',
    accent: '#00f0ff',
    accentPink: '#ff006e',
    accentPurple: '#7c3aed',
    text: '#e0e0ff',
    textMuted: '#505090',
    success: '#00ff88',
    danger: '#ff3366',
    warning: '#ffaa00',
    cyan: '#00f0ff',
    magenta: '#ff006e',
    lime: '#00ff88',
    orange: '#ff6600',
    purple: '#7c3aed',
    yellow: '#ffdd00',
    white: '#ffffff',
    glass: 'rgba(25,25,27,0.65)',
    glassBorder: 'rgba(255,255,255,0.08)',
  },
  fonts: {
    mono: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  radius: { sm: 12, md: 16, lg: 20, xl: 28 },
  glass: {
    backgroundColor: 'rgba(25,25,27,0.65)' as const,
    borderColor: 'rgba(255,255,255,0.08)' as const,
    borderWidth: 1 as const,
  },
};

export type Theme = typeof theme;
