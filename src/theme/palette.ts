/**
 * Paleta eBobo — Premium Soft Minimal (Etap 18).
 * Spokojny teal + ciepła biel + stonowane szarości.
 * Semantyka w `colors.ts`.
 */
export const palette = {
  /** Główny kolor marki — głęboki, spokojny teal. */
  brand: '#1A6B66',
  brandDark: '#134F4C',
  brandMuted: '#5B9A94',
  brandSoft: '#E4F2F0',
  brandWash: '#F0F7F6',

  /** Chrome / sticky header — ciepła, niemal biała powierzchnia. */
  header: '#F7F5F1',

  /** Subtelny akcent UI (pasek progresu) — ciepły bursztyn, oszczędnie. */
  accent: '#C4922A',
  accentDark: '#8F6A16',
  accentSoft: '#F8F1E0',

  /** Status sukces / „może przysługiwać”. */
  success: '#2D6A4F',
  successSoft: '#E7F2EC',

  /** Zieleń ZUS — tylko oznaczenia instytucjonalne / CTA świadczeń. */
  zus: '#009639',
  zusDark: '#007A2E',
  zusSoft: '#E6F7ED',
  zusNavy: '#1A4A66',
  zusNavySoft: '#E8F0F5',

  health: '#2D6A4F',
  healthSoft: '#E7F2EC',
  admin: '#5C6B73',
  adminSoft: '#EEF1F3',

  /** Tła: ciepła biel + delikatny sage. */
  canvas: '#F5F7F6',
  canvasWarm: '#F7F5F1',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2F1',
  surfaceElevated: '#FFFFFF',

  line: '#DDE5E3',
  lineStrong: '#C5D0CD',

  ink: '#1C2B2A',
  inkSecondary: '#4A5C5A',
  inkMuted: '#6E7F7C',
  inkInverse: '#FFFFFF',

  warning: '#8F6A16',
  warningSoft: '#F8F1E0',
  danger: '#A63D35',
  dangerSoft: '#F8EBEA',
  info: '#2A6A7A',
  infoSoft: '#E6F2F5',
  demo: '#7A5B1E',
  demoSoft: '#F6EFE0',

  overlay: 'rgba(28, 43, 42, 0.4)',
  shadow: 'rgba(26, 107, 102, 0.1)',
} as const;

export type PaletteToken = keyof typeof palette;
