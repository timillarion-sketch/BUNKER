import { Platform } from 'react-native';

export const theme = {
  colors: {
    bg: '#050508',
    surface: '#0a0a1a',
    border: '#1a1a3e',
    accent: '#00f0ff',
    accentPink: '#ff006e',
    accentPurple: '#7c3aed',
    text: '#e0e0ff',
    textMuted: '#505090',
    success: '#00ff88',
    danger: '#ff3366',
  },
  fonts: {
    mono: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  radius: { sm: 8, md: 12, lg: 20 },
};

export type Theme = typeof theme;