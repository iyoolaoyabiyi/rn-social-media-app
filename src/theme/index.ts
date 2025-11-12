export const palette = {
  primary: '#1F2A4B',
  primaryMuted: '#39456A',
  accent: '#EF4444',
  background: '#F5F6FA',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  text: '#111827',
  textMuted: '#6B7280',
  textSubtle: '#9CA3AF',
};

export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const container = {
  maxWidth: 680,
}

export const radii = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const typography = {
  heading: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: palette.text,
  },
  body: {
    fontSize: 15,
    color: palette.text,
  },
  caption: {
    fontSize: 12,
    color: palette.textSubtle,
  },
};

export const theme = {
  palette,
  spacing,
  radii,
  typography,
  container
};

export type Theme = typeof theme;
