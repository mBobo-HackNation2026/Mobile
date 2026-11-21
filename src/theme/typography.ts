import { Platform, TextStyle } from 'react-native';

const fontSans = Platform.select({
  web: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
  default: 'System',
});

const fontDisplay = Platform.select({
  web: 'Literata, "Iowan Old Style", Georgia, serif',
  default: 'System',
});

export const typography = {
  display: {
    fontFamily: fontDisplay,
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  h1: {
    fontFamily: fontDisplay,
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  h2: {
    fontFamily: fontDisplay,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600',
  },
  h3: {
    fontFamily: fontSans,
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700',
  },
  body: {
    fontFamily: fontSans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodyStrong: {
    fontFamily: fontSans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  small: {
    fontFamily: fontSans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontFamily: fontSans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  button: {
    fontFamily: fontSans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
} as const satisfies Record<string, TextStyle>;
