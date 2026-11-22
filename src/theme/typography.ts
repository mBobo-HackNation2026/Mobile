import { Platform, TextStyle } from 'react-native';

const fontSans = Platform.select({
  web: '"Source Sans 3", "Segoe UI", system-ui, sans-serif',
  default: 'System',
});

const fontDisplay = Platform.select({
  web: 'Literata, "Iowan Old Style", Georgia, serif',
  default: 'System',
});

/**
 * Hierarchia typografii Etap 18 — max kilka poziomów.
 * display/h1: marka i hero; h2: ekran; h3: sekcja/karta; body/small/caption.
 */
export const typography = {
  display: {
    fontFamily: fontDisplay,
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  h1: {
    fontFamily: fontDisplay,
    fontSize: 26,
    lineHeight: 34,
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
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
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
    letterSpacing: 0.15,
  },
  button: {
    fontFamily: fontSans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  amount: {
    fontFamily: fontSans,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
} as const satisfies Record<string, TextStyle>;
